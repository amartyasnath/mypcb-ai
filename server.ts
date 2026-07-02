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
(The UI will parse this and show cards).`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parsing middleware
  app.use(express.json());

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  app.post("/api/gemini", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ text: "Error: GEMINI_API_KEY is not set on the server." });
      }

      const { messages } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid messages array." });
      }

      // Format messages for the API
      const history = messages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const lastMessage = messages[messages.length - 1].text;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: lastMessage }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        }
      });

      res.status(200).json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with AI" });
    }
  });

  // Analytics/Alerting Webhook Route
  app.post("/api/track", async (req, res) => {
    try {
      const { event, data } = req.body;
      console.log(`[Analytics] Received tracking event: ${event}`, data);

      // Secure Webhook Alert Forwarding
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      
      if (webhookUrl && (event === 'user_signup')) {
        const message = `🚨 **MyPCB AI Alert** 🚨\n**Event:** ${event}\n**Details:** \`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        const payload = {
          content: message
        };
        
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error("Webhook POST failed:", err));
      }

      res.status(200).json({ status: "logged" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Tracking failed" });
    }
  });

  // Feedback Submission Route
  app.post("/api/feedback", async (req, res) => {
    try {
      const { type, message, email } = req.body;
      console.log(`[Feedback] Received ${type} from ${email}`);
      
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        const payload = {
          content: `📬 **New Feedback/Support Request**\n**Type:** ${type}\n**From:** ${email}\n**Message:**\n>>> ${message}`
        };
        
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error("Webhook POST failed:", err));
      }

      res.status(200).json({ status: "success" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
