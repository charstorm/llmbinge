import promptTemplate from "@/prompts/mapTopicGenerator.prompt.md?raw";
import { interpolateTemplate } from "@/lib/template";
import { completeChatCompletion, type LLMConfig } from "@/lib/llm-client";
import { extractTopicsFromCoT } from "@/lib/cot-parser";
import type { MapTopicsResult } from "./types";

export interface MapTopicGeneratorInput {
  topic: string;
}

export async function generateMapTopics(
  input: MapTopicGeneratorInput,
  config: LLMConfig,
  signal?: AbortSignal,
): Promise<MapTopicsResult> {
  const highTempConfig: LLMConfig = { ...config, temperature: 1.2 };

  const systemPrompt = interpolateTemplate(promptTemplate, {
    topic: input.topic,
  });

  const raw = await completeChatCompletion(
    highTempConfig,
    [{ role: "system", content: systemPrompt }],
    signal,
  );

  const topics = extractTopicsFromCoT(raw, 20);
  return { raw, topics };
}
