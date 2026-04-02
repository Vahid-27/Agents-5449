import { createOpenAI } from "@ai-sdk/openai";

export function getOpenAI(env: { AI_GATEWAY_BASE_URL: string; AI_GATEWAY_API_KEY: string }) {
  return createOpenAI({
    baseURL: env.AI_GATEWAY_BASE_URL,
    apiKey: env.AI_GATEWAY_API_KEY,
  });
}

export const MODEL = "anthropic/claude-sonnet-4.5";
