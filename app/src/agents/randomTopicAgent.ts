import promptTemplate from "@/prompts/randomTopic.prompt.md?raw";
import { completeChatCompletion, type LLMConfig } from "@/lib/llm-client";
import { extractTopicsFromCoT } from "@/lib/cot-parser";
import type { RandomTopicResult } from "./types";

export async function generateRandomTopic(
  config: LLMConfig,
  signal?: AbortSignal,
): Promise<RandomTopicResult> {
  const highTempConfig: LLMConfig = { ...config, temperature: 1.2 };

  const raw = await completeChatCompletion(
    highTempConfig,
    [{ role: "system", content: promptTemplate }],
    signal,
  );

  const topics = extractTopicsFromCoT(raw, 20);
  const topic =
    topics.length > 0
      ? topics[Math.floor(Math.random() * topics.length)]!
      : "Quantum Entanglement";

  return { raw, topic };
}
