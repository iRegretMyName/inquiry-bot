import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(inquiry) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Gemini request: attempt ${attempt}/${maxAttempts}`);

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL,
        contents: inquiry,
        config: {
          systemInstruction:
            'You triage business inquiries. Respond ONLY with JSON: {"category": "sales" | "support" | "spam", "reply": "a short, polite draft reply"}',
          responseMimeType: "application/json",
        },
      });

      return response;
    } catch (err) {
      const status = err?.status || err?.response?.status;

      console.error(`Gemini attempt ${attempt} failed:`, status || err.message);

      // Only retry temporary server/capacity errors.
      if (status !== 503) {
        throw err;
      }

      // If this was the final attempt, give up.
      if (attempt === maxAttempts) {
        throw err;
      }

      // Wait before trying again.
      const delay = attempt * 2000;

      console.log(`Gemini unavailable. Retrying in ${delay / 1000} seconds...`);

      await sleep(delay);
    }
  }
}

app.post("/api/reply", async (req, res) => {
  try {
    const { inquiry } = req.body;

    if (!inquiry || !inquiry.trim()) {
      return res.status(400).json({
        error: "Inquiry is required.",
      });
    }

    const response = await generateWithRetry(inquiry);

    const result = JSON.parse(response.text);

    res.json(result);
  } catch (err) {
    console.error("Final Gemini error:", err);

    const status = err?.status || err?.response?.status;

    if (status === 503) {
      return res.status(503).json({
        error:
          "Gemini is currently overloaded. The request was retried 3 times. Please try again later.",
      });
    }

    if (status === 401 || status === 403) {
      return res.status(status).json({
        error: "Gemini API authentication failed. Check your API key.",
      });
    }

    if (status === 404) {
      return res.status(404).json({
        error:
          "The Gemini model was not found. Check GEMINI_MODEL in your .env file.",
      });
    }

    if (status === 429) {
      return res.status(429).json({
        error:
          "Gemini API rate limit reached. Please wait before trying again.",
      });
    }

    return res.status(500).json({
      error: "The AI request failed.",
    });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});