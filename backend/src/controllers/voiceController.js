import fs from "fs";
import os from "os";
import path from "path";
import { createHash, randomUUID } from "crypto";
import { synthesizeSpeech, transcribeSpeech } from "../services/geminiService.js";

function decodeBase64Audio(payload) {
  const raw = payload?.audioBase64 || payload?.audio || "";
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const match = raw.match(/^data:audio\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  const base64 = match ? match[1] : raw;
  return Buffer.from(base64, "base64");
}

export async function transcribeAudio(req, res, next) {
  try {
    const audioBuffer = decodeBase64Audio(req.body);
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({
        message: "Audio manquant. Envoie un fichier audio ou une chaîne base64.",
      });
    }

    const tempFile = path.join(os.tmpdir(), `interviewprep-${randomUUID()}.webm`);
    await fs.promises.writeFile(tempFile, audioBuffer);

    try {
      const transcription = await transcribeSpeech({
        filePath: tempFile,
        fileName: "answer.webm",
      });

      return res.json({
        text: transcription.text || "",
        language: transcription.language || null,
        duration: transcription.duration ?? null,
      });
    } finally {
      await fs.promises.unlink(tempFile).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
}

export async function speakText(req, res, next) {
  try {
    const { text, voice, instructions, speed } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Le champ text est requis." });
    }

    const audio = await synthesizeSpeech({
      input: text,
      voice: voice || "alloy",
      instructions,
      speed,
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", 'inline; filename="voice.mp3"');
    return res.send(audio);
  } catch (error) {
    next(error);
  }
}

export async function createRealtimeSession(req, res, next) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ message: "OPENAI_API_KEY is not configured." });
    }

    const voice = req.body?.voice || "marin";
    const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
    const sessionConfig = {
      session: {
        type: "realtime",
        model,
        instructions:
          "You are a professional interview host for InterviewPrep AI. Ask concise, realistic interview questions, keep a calm and formal tone, and do not provide answers for the candidate.",
        audio: {
          input: {
            turn_detection: {
              type: "server_vad",
            },
          },
          output: {
            voice,
          },
        },
      },
    };

    const safetyIdentifier = createHash("sha256")
      .update(String(req.user?._id || req.user?.email || "anonymous"))
      .digest("hex");

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": safetyIdentifier,
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        message: "Failed to create Realtime session.",
        details: errorText,
      });
    }

    const data = await response.json();
    return res.json({
      value: data.value,
      expires_at: data.expires_at,
      model,
    });
  } catch (error) {
    next(error);
  }
}
