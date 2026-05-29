import OpenAI from "openai";
import fs from "fs";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o";
const ttsModel = process.env.OPENAI_TTS_MODEL || "tts-1";
const transcriptionModel = process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1";

const client = apiKey ? new OpenAI({ apiKey }) : null;

export const openAIConfig = {
  enabled: Boolean(client),
  model
};

export const generateStructuredResponse = async ({
  instructions,
  input,
  schemaName,
  schema,
  temperature = 0.2,
  maxOutputTokens = 1200
}) => {
  if (!client) {
    throw new Error("OpenAI is not configured.");
  }

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: instructions },
      { role: "user", content: input }
    ],
    temperature,
    max_tokens: maxOutputTokens,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        schema,
        strict: true
      }
    }
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(raw);
};

export const synthesizeSpeech = async ({ input, voice = "alloy", speed = 1.0 }) => {
  if (!client) {
    throw new Error("OpenAI is not configured.");
  }

  const response = await client.audio.speech.create({
    model: ttsModel,
    voice,
    input,
    speed,
    response_format: "mp3"
  });

  return Buffer.from(await response.arrayBuffer());
};

export const transcribeSpeech = async ({ filePath, fileName }) => {
  if (!client) {
    throw new Error("OpenAI is not configured.");
  }

  const stream = fs.createReadStream(filePath, { autoClose: true });
  const response = await client.audio.transcriptions.create({
    model: transcriptionModel,
    file: stream
  });

  return {
    text: response.text || "",
    language: response.language || "",
    duration: response.duration || null
  };
};
