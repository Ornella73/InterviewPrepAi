import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const fileManager = apiKey ? new GoogleAIFileManager(apiKey) : null;

export const geminiConfig = {
  enabled: Boolean(genAI),
  model: "models/gemini-2.5-flash-lite"
};

/**
 * Generates a structured response using Gemini.
 */
export const generateStructuredResponse = async ({
  instructions,
  input,
  schemaName,
  schema,
  temperature = 0.2,
  maxOutputTokens = 2048
}) => {
  if (!genAI) {
    throw new Error("Gemini API is not configured.");
  }

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash-lite",
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  });

  const prompt = `System Instructions: ${instructions}\n\nUser Input: ${input}\n\nPlease output a JSON object matching this schema:\n${JSON.stringify(schema, null, 2)}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const raw = response.text().trim();

  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gemini JSON parse error. Raw output:", raw);
    throw new Error("Failed to parse Gemini response as JSON.");
  }
};

/**
 * Synthesizes speech using a reliable free fallback (Google Translate TTS).
 */
export const synthesizeSpeech = async ({ input, voice = "alloy", speed = 1.0 }) => {
  try {
    const lang = "en";
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(input)}&tl=${lang}&client=tw-ob`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`TTS Fallback failed with status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Audio synthesis failed:", err);
    throw new Error("Could not generate audio.");
  }
};

export const transcribeSpeech = async ({ filePath, fileName }) => {
  if (!genAI || !fileManager) {
    throw new Error("Gemini API or File Manager is not configured.");
  }

  const modelsToTry = [
    "models/gemini-2.5-flash-lite",
    "models/gemini-2.0-flash-lite",
    "models/gemini-flash-lite-latest",
    "models/gemini-3.1-flash-lite"
  ];

  let lastError = null;

  try {
    // 1. Upload the file to the File API
    const uploadResponse = await fileManager.uploadFile(filePath, {
      mimeType: "audio/webm",
      displayName: fileName || "interview-answer",
    });

    const fileUri = uploadResponse.file.uri;

    // 2. Try models sequentially if one is busy
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent([
          {
            fileData: {
              mimeType: uploadResponse.file.mimeType,
              fileUri: fileUri
            }
          },
          { text: "Transcribe this audio recording accurately. Return only the text of the transcription." },
        ]);

        const response = await result.response;
        const text = response.text().trim();

        // If we got a response, clean up and return
        await fileManager.deleteFile(uploadResponse.file.name).catch(() => {});
        return {
          text: text || "",
          language: "auto",
          duration: null
        };
      } catch (err) {
        lastError = err;
        // If it's a 503 (busy) or 404 (not found), try the next model
        if (err.message.includes("503") || err.message.includes("404")) {
          console.warn(`Model ${modelName} failed/busy, trying next...`);
          continue;
        }
        throw err; // For other errors, stop
      }
    }

    // If all models failed
    await fileManager.deleteFile(uploadResponse.file.name).catch(() => {});
    throw lastError || new Error("All transcription models are currently unavailable.");

  } catch (err) {
    console.error("Gemini Transcription Error:", err);
    throw new Error(`Transcription failed: ${err.message}`);
  }
};
