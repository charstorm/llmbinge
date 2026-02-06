import { describe, it, expect } from "vitest";
import { interpolateTemplate } from "@/lib/template";

describe("interpolateTemplate", () => {
  it("replaces single variable", () => {
    expect(interpolateTemplate("Hello {{name}}!", { name: "World" })).toBe(
      "Hello World!",
    );
  });

  it("replaces multiple variables", () => {
    expect(
      interpolateTemplate("{{a}} and {{b}}", { a: "X", b: "Y" }),
    ).toBe("X and Y");
  });

  it("replaces same variable multiple times", () => {
    expect(
      interpolateTemplate("{{x}} then {{x}}", { x: "A" }),
    ).toBe("A then A");
  });

  it("replaces missing variable with empty string", () => {
    expect(interpolateTemplate("Hello {{missing}}!", {})).toBe("Hello !");
  });

  it("ignores extra variables", () => {
    expect(
      interpolateTemplate("Hello {{name}}!", { name: "X", extra: "Y" }),
    ).toBe("Hello X!");
  });

  it("leaves non-template text unchanged", () => {
    expect(interpolateTemplate("No vars here", {})).toBe("No vars here");
  });

  it("handles empty template", () => {
    expect(interpolateTemplate("", { a: "1" })).toBe("");
  });
});
