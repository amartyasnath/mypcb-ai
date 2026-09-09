import "dotenv/config";

import express from "express";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { demoReply } from "./lib/demoReply";

// Explicit opt-in prevents accidental API spend, even if a key exists in .env.
const DEMO_MODE = process.env.DEMO_MODE !== "false";

const SYSTEM_INSTRUCTION = `You are myPCB, an AI agent specialized in electronic component recommendations.
Your goal is to help users find the best possible electronic components (ICs, passives, connectors, etc.) based on their project requirements.

GUIDELINES:
1. Always ask for specific requirements if not provided:
   - Voltage limits (Operating, Peak)
   - Current limits
   - Temperature range
   - Frequency/Speed
   - Package/Footprint requirements
   - Budget constraints
2. Once requirements are clear, provide recommendations in exactly these tiers if applicable:
   - 'Recommended': The best balance of performance, availability, and price.
   - 'Good Alternative': A reliable second choice.
   - 'Budget-Friendly': For cost-sensitive projects.
   - 'Premium': High-performance or high-reliability options (Optional).
   - 'Savings': Extreme low-cost alternatives (Optional).
3. Use the web_search tool to find real, currently available parts and pricing.
   Search before recommending: part availability, lifecycle status and pricing
   change constantly, so do not rely on memory for stock or price claims.
4. Provide structured data when recommending parts. Always include specific part numbers (e.g., "STM32F405RGT6" instead of just "STM32").
5. Format your output as a conversational response, but use a specific JSON-like structure (or clear delimiters) if you want the UI to render cards for the components.

UI RENDERING HINT:
When you have final recommendations, include a section at the end of your message in a clear Markdown format like this:
---RECOMMENDATIONS---
[
  {
    "name": "Part Number",
    "tier": "Recommended",
    "specs": "Brief spec summary",
    "pros": ["Pro 1", "Pro 2"],
    "cons": ["Con 1"],
    "approxPrice": "$1.50",
    "sourceUrl": "https://..."
  }
]
---END---
(The UI will parse this and show cards).
Every object MUST include "name", "tier", "specs", "pros" and "cons". Use an empty array for
"pros"/"cons" if you have nothing to list, never omit the field.`;

// Model is configurable so it can be rolled forward without a code change.
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";

// Cap on web searches per reply. Each search is billed on top of tokens, so
// this is the main lever on per-request cost.
const MAX_WEB_SEARCHES = Number(process.env.MAX_WEB_SEARCHES) || 6;

// Server tools can end a turn with stop_reason "pause_turn" on long-running
// work. We resume the same turn rather than returning a partial answer.
const MAX_TURN_CONTINUATIONS = 4;

// Request limits. These protect the API budget: the Anthropic key is ours, so
// an unauthenticated caller hammering /api/chat spends our money.
const MAX_MESSAGES = 60;
const MAX_TEXT_LENGTH = 8000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;

type ClientMessage = { role: "user" | "model"; text: string };

const hitsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (hitsByIp.get(ip) || []).filter((t) => t > cutoff);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    hitsByIp.set(ip, recent);
    return true;
  }

  recent.push(now);
  hitsByIp.set(ip, recent);
  return false;
}

// Drop idle IPs so the map cannot grow without bound.
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, hits] of hitsByIp) {
    const recent = hits.filter((t) => t > cutoff);
    if (recent.length === 0) hitsByIp.delete(ip);
    else hitsByIp.set(ip, recent);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

/**
 * Validates the client payload before it reaches the model. Returns the
 * normalized messages, or an error string describing what was wrong.
 */
function parseMessages(body: unknown): { messages: ClientMessage[] } | { error: string } {
  const raw = (body as { messages?: unknown })?.messages;

  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "Request must include a non-empty 'messages' array." };
  }
  if (raw.length > MAX_MESSAGES) {
    return { error: `Conversation too long (max ${MAX_MESSAGES} messages). Start a new scour.` };
  }

  const messages: ClientMessage[] = [];
  for (const entry of raw) {
    const role = (entry as ClientMessage)?.role;
    const text = (entry as ClientMessage)?.text;

    if (role !== "user" && role !== "model") {
      return { error: "Each message needs a role of 'user' or 'model'." };
    }
    if (typeof text !== "string") {
      return { error: "Each message needs a string 'text' field." };
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return { error: `Message too long (max ${MAX_TEXT_LENGTH} characters).` };
    }
    messages.push({ role, text });
  }

  if (messages[messages.length - 1].role !== "user") {
    return { error: "The final message must come from the user." };
  }

  return { messages };
}

/**
 * Concatenates the assistant's visible prose.
 *
 * A reply that used web search contains several block types - `thinking`,
 * `server_tool_use`, `web_search_tool_result` - alongside the `text` blocks.
 * Only `text` is meant for the user.
 */
function extractText(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

/**
 * Runs one conversational turn against Claude, with web search enabled.
 *
 * Streaming is used purely to avoid HTTP timeouts on slow turns (search plus
 * extended thinking can run a while); the full reply is still returned as a
 * single string, so the client contract is unchanged.
 */
async function generateReply(
  client: Anthropic,
  messages: ClientMessage[],
): Promise<string> {
  // The client and Firestore both store the assistant role as "model" (a
  // holdover from the Gemini schema). Mapping here rather than renaming the
  // stored field keeps every existing saved chat readable.
  const conversation: Anthropic.Beta.BetaMessageParam[] = messages.map((m) => ({
    role: m.role === "model" ? ("assistant" as const) : ("user" as const),
    content: m.text,
  }));

  for (let attempt = 0; attempt < MAX_TURN_CONTINUATIONS; attempt++) {
    const response = await client.beta.messages
      .stream({
        model: CLAUDE_MODEL,
        max_tokens: 16000,
        system: SYSTEM_INSTRUCTION,
        messages: conversation,
        thinking: { type: "adaptive" },
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: MAX_WEB_SEARCHES,
          },
        ],
        // If a safety classifier declines the request, retry it on a fallback
        // model inside the same call instead of failing the user's search.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      })
      .finalMessage();

    if (response.stop_reason === "refusal") {
      console.warn("Claude refused request:", response.stop_details);
      return "I wasn't able to answer that one. Try rephrasing it as a component sourcing question.";
    }

    // The turn was suspended mid-work; hand its output back and let it resume.
    if (response.stop_reason === "pause_turn") {
      conversation.push({ role: "assistant", content: response.content });
      continue;
    }

    return extractText(response.content);
  }

  return "That search took too many steps to complete. Please narrow the requirements and try again.";
}

async function postWebhook(payload: unknown): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Webhook returned ${res.status}`);
    }
  } catch (err) {
    console.error("Webhook POST failed:", err);
    throw err;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === "production";

  // Cloud Run / Render / Fly terminate TLS upstream, so req.ip must come from
  // X-Forwarded-For or every request looks like it originates from the proxy.
  if (isProduction) app.set("trust proxy", true);

  app.use(express.json({ limit: "256kb" }));

  if (!DEMO_MODE && !process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "WARNING: ANTHROPIC_API_KEY is not set. /api/chat will return 503 until it is configured.",
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      model: CLAUDE_MODEL,
      anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
      demoMode: DEMO_MODE,
    });
  });

  app.post("/api/chat", async (req, res) => {
    if (!DEMO_MODE && !process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: "API key required: configure ANTHROPIC_API_KEY, or enable DEMO_MODE=true for free samples." });
    }

    const ip = req.ip || "unknown";
    if (isRateLimited(ip)) {
      return res
        .status(429)
        .json({ error: "You're scouring a little fast. Please wait a moment and try again." });
    }

    const parsed = parseMessages(req.body);
    if ("error" in parsed) {
      return res.status(400).json({ error: parsed.error });
    }

    if (DEMO_MODE) {
      return res.json({ text: demoReply(parsed.messages) });
    }

    try {
      const text = await generateReply(anthropic, parsed.messages);

      if (!text) {
        return res
          .status(502)
          .json({ error: "The model returned an empty response. Please rephrase and try again." });
      }

      res.status(200).json({ text });
    } catch (error) {
      // Log the real error, but never forward provider internals to the client.
      console.error("Anthropic API Error:", error);

      if (error instanceof Anthropic.RateLimitError) {
        return res
          .status(429)
          .json({ error: "The AI service is busy right now. Please try again in a moment." });
      }
      if (error instanceof Anthropic.AuthenticationError) {
        // A bad key is our misconfiguration, not the caller's problem.
        return res.status(503).json({ error: "The AI service is not configured correctly." });
      }

      res.status(502).json({ error: "Failed to reach the AI service. Please try again shortly." });
    }
  });

  // Analytics/Alerting Webhook Route
  app.post("/api/track", async (req, res) => {
    const { event, data } = req.body ?? {};

    if (typeof event !== "string" || !event) {
      return res.status(400).json({ error: "Missing 'event' name." });
    }

    console.log(`[Analytics] Received tracking event: ${event}`, data);

    if (event === "user_signup") {
      await postWebhook({
        content: `🚨 **MyPCB AI Alert** 🚨\n**Event:** ${event}\n**Details:** \`\`\`json\n${JSON.stringify(
          data,
          null,
          2,
        ).slice(0, 1500)}\n\`\`\``,
      }).catch(() => {});
    }

    res.status(200).json({ status: "logged" });
  });

  // Feedback Submission Route
  app.post("/api/feedback", async (req, res) => {
    const { type, message, email } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "A message is required." });
    }
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const safeType = type === "bug" || type === "manufacturer" ? type : "support";
    if (!process.env.DISCORD_WEBHOOK_URL) {
      return res.status(503).json({ error: "Contact delivery is not configured yet. No message was sent." });
    }
    console.log(`[Feedback] Received ${safeType} from ${email}`);

    try {
      await postWebhook({
      content: `📬 **New Feedback/Support Request**\n**Type:** ${safeType}\n**From:** ${email.slice(
        0,
        256,
      )}\n**Message:**\n>>> ${message.slice(0, 1500)}`,
      });
    } catch {
      return res.status(502).json({ error: "Message delivery failed. Please try again later." });
    }

    res.status(200).json({ status: "success" });
  });

  // Body-parser failures (oversized or malformed JSON) otherwise render Express's
  // default HTML error page, which the client cannot parse as JSON.
  app.use((
    err: { type?: string } & Error,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({ error: "That request is too large. Try a shorter message." });
    }
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ error: "Malformed JSON body." });
    }
    return next(err);
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback: anything not matched above renders the client shell.
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (model: ${CLAUDE_MODEL})`);
  });
}

startServer().catch((err) => {
  console.error("Fatal: failed to start server", err);
  process.exit(1);
});
