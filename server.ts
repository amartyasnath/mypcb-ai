import "dotenv/config";

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
3. Use Google Search to find real, currently available parts and pricing.
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
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Request limits. These protect the API budget: the Gemini key is ours, so an
// unauthenticated caller hammering /api/gemini spends our money.
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
      console.error(`Webhook returned ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error("Webhook POST failed:", err);
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

  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      "WARNING: GEMINI_API_KEY is not set. /api/gemini will return 503 until it is configured.",
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      model: GEMINI_MODEL,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post("/api/gemini", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "The AI service is not configured. Please try again later." });
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

    try {
      const contents = parsed.messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      if (!text) {
        return res
          .status(502)
          .json({ error: "The model returned an empty response. Please rephrase and try again." });
      }

      res.status(200).json({ text });
    } catch (error) {
      // Log the real error, but never forward provider internals to the client.
      console.error("Gemini API Error:", error);
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
      });
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
    console.log(`[Feedback] Received ${safeType} from ${email}`);

    await postWebhook({
      content: `📬 **New Feedback/Support Request**\n**Type:** ${safeType}\n**From:** ${email.slice(
        0,
        256,
      )}\n**Message:**\n>>> ${message.slice(0, 1500)}`,
    });

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
    console.log(`Server running on http://0.0.0.0:${PORT} (model: ${GEMINI_MODEL})`);
  });
}

startServer().catch((err) => {
  console.error("Fatal: failed to start server", err);
  process.exit(1);
});
