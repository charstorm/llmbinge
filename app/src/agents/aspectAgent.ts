import promptTemplate from "@/prompts/aspect.prompt.md?raw";
import { interpolateTemplate } from "@/lib/template";
import { completeChatCompletion, type LLMConfig } from "@/lib/llm-client";
import type { AspectResult } from "./types";

export interface AspectInput {
  topic: string;
  existingAspects: string[];
}

function parseAspectList(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => {
      const match = /^\s*\d+[\.\)]\s*(.+)$/.exec(line);
      return match?.[1]?.trim() ?? "";
    })
    .filter((a) => a.length > 0);
}

export async function generateAspects(
  input: AspectInput,
  config: LLMConfig,
  signal?: AbortSignal,
): Promise<AspectResult> {
  const systemPrompt = interpolateTemplate(promptTemplate, {
    topic: input.topic,
    existingAspects: input.existingAspects.join(", "),
  });

  const raw = await completeChatCompletion(
    config,
    [{ role: "system", content: systemPrompt }],
    signal,
  );

  return { raw, aspects: parseAspectList(raw) };
}
