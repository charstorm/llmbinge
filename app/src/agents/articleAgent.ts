import promptTemplate from "@/prompts/article.prompt.md?raw";
import { interpolateTemplate } from "@/lib/template";
import {
  streamChatCompletion,
  type LLMConfig,
  type StreamCallbacks,
} from "@/lib/llm-client";
import type { ArticleResult } from "./types";

export interface ArticleInput {
  topic: string;
  aspect?: string;
}

export async function generateArticle(
  input: ArticleInput,
  config: LLMConfig,
  callbacks?: StreamCallbacks,
  signal?: AbortSignal,
): Promise<ArticleResult> {
  const aspectInstruction = input.aspect
    ? `Focus specifically on the aspect: **${input.aspect}** as it relates to "${input.topic}".`
    : "";

  const systemPrompt = interpolateTemplate(promptTemplate, {
    topic: input.topic,
    aspectInstruction,
  });

  const messages = [{ role: "system" as const, content: systemPrompt }];

  return new Promise((resolve, reject) => {
    let accumulated = "";
    streamChatCompletion(
      config,
      messages,
      {
        onToken: (token) => {
          accumulated += token;
          callbacks?.onToken(token);
        },
        onComplete: (fullText) => {
          callbacks?.onComplete(fullText);
          resolve({ raw: fullText, content: fullText });
        },
        onError: (error) => {
          callbacks?.onError(error);
          reject(error);
        },
      },
      signal,
    );
  });
}
