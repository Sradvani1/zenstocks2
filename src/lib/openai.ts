import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI();
  }
  return _client;
}

export const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID ?? "";
export const CHAT_MODEL = "gpt-4.1";
