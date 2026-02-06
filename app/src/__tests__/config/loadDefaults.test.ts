import { describe, it, expect } from "vitest";
import { validateConfig } from "@/config/configSchema";

describe("validateConfig", () => {
  it("parses a valid config object", () => {
    const raw = {
      llm: {
        endpoint: "https://openrouter.ai/api/v1",
        model: "openai/gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1.0,
      },
      aspects: {
        fixed: ["History", "Key People"],
      },
      topics: {
        starters: ["Science", "Philosophy"],
      },
    };

    const config = validateConfig(raw);
    expect(config.llm.endpoint).toBe("https://openrouter.ai/api/v1");
    expect(config.llm.model).toBe("openai/gpt-4o-mini");
    expect(config.llm.temperature).toBe(0.7);
    expect(config.llm.maxTokens).toBe(4096);
    expect(config.llm.topP).toBe(1.0);
    expect(config.aspects.fixed).toEqual(["History", "Key People"]);
    expect(config.topics.starters).toEqual(["Science", "Philosophy"]);
  });

  it("throws on missing endpoint", () => {
    expect(() => validateConfig({ llm: {} })).toThrow(
      "Missing or invalid llm.endpoint",
    );
  });

  it("throws on missing model", () => {
    expect(() =>
      validateConfig({ llm: { endpoint: "http://x" } }),
    ).toThrow("Missing or invalid llm.model");
  });

  it("uses defaults for missing optional fields", () => {
    const config = validateConfig({
      llm: { endpoint: "http://x", model: "m" },
    });
    expect(config.llm.temperature).toBe(0.7);
    expect(config.llm.maxTokens).toBe(4096);
    expect(config.llm.topP).toBe(1.0);
    expect(config.aspects.fixed).toEqual([]);
    expect(config.topics.starters).toEqual([]);
  });
});
