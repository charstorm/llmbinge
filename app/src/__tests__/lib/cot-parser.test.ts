import { describe, it, expect } from "vitest";
import { extractTopicsFromCoT } from "@/lib/cot-parser";

describe("extractTopicsFromCoT", () => {
  it("parses numbered list with dots", () => {
    const input = `Let me think...
1. Quantum entanglement
2. History of origami
3. Bioluminescence`;
    expect(extractTopicsFromCoT(input)).toEqual([
      "Quantum entanglement",
      "History of origami",
      "Bioluminescence",
    ]);
  });

  it("parses numbered list with parentheses", () => {
    const input = `1) Topic A
2) Topic B`;
    expect(extractTopicsFromCoT(input)).toEqual(["Topic A", "Topic B"]);
  });

  it("parses bulleted list with dashes", () => {
    const input = `- Alpha
- Beta
- Gamma`;
    expect(extractTopicsFromCoT(input)).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("parses bulleted list with asterisks", () => {
    const input = `* One
* Two`;
    expect(extractTopicsFromCoT(input)).toEqual(["One", "Two"]);
  });

  it("parses bulleted list with bullet characters", () => {
    const input = `• First
• Second`;
    expect(extractTopicsFromCoT(input)).toEqual(["First", "Second"]);
  });

  it("takes from end when more than takeFromEnd items", () => {
    const lines = Array.from(
      { length: 50 },
      (_, i) => `${i + 1}. Topic ${i + 1}`,
    ).join("\n");
    const result = extractTopicsFromCoT(lines, 5);
    expect(result).toEqual([
      "Topic 46",
      "Topic 47",
      "Topic 48",
      "Topic 49",
      "Topic 50",
    ]);
  });

  it("returns all if fewer than takeFromEnd", () => {
    const input = `1. A
2. B`;
    expect(extractTopicsFromCoT(input, 20)).toEqual(["A", "B"]);
  });

  it("handles messy CoT with mixed content", () => {
    const input = `I'll brainstorm some topics. Let me think broadly...

First, some science topics:
1. Quantum computing
2. CRISPR gene editing

Now some humanities:
3. Renaissance art history
4. Stoic philosophy

And more random ones...
5. Underwater basket weaving`;
    expect(extractTopicsFromCoT(input)).toEqual([
      "Quantum computing",
      "CRISPR gene editing",
      "Renaissance art history",
      "Stoic philosophy",
      "Underwater basket weaving",
    ]);
  });

  it("returns empty array for no topics", () => {
    expect(extractTopicsFromCoT("Just some text with no lists")).toEqual([]);
  });

  it("trims whitespace from topics", () => {
    const input = `1.   Spaced topic   `;
    expect(extractTopicsFromCoT(input)).toEqual(["Spaced topic"]);
  });

  it("skips empty lines", () => {
    const input = `1. A

2. B`;
    expect(extractTopicsFromCoT(input)).toEqual(["A", "B"]);
  });
});
