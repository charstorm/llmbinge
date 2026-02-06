import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

const sampleMarkdown = `
# Markdown Renderer Test

## Text Formatting

This is a paragraph with **bold**, *italic*, and ***bold italic*** text.
Here is some \`inline code\` in a sentence.

## Links

Visit [Example](https://example.com) for more info.

## Lists

### Unordered
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered
1. Step one
2. Step two
3. Step three

## Blockquote

> This is a blockquote. It can span multiple lines
> and should look nice with the left border accent.

## Code Block

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generate first n Fibonacci numbers."""
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib[:n]
\`\`\`

## Mathematics

Inline math: $E = mc^2$

Display math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

The quadratic formula:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

Euler's identity: $e^{i\\pi} + 1 = 0$

## Table

| Feature | Status | Notes |
|---------|--------|-------|
| Headings | Done | H1-H6 |
| Lists | Done | Ordered + unordered |
| Code | Done | Inline + blocks |
| Math | Done | KaTeX |
| Tables | Done | With striping |

## Horizontal Rule

---

## Nested Content

1. First item with **bold**
   > A blockquote inside a list
2. Second item
   \`\`\`js
   console.log("code inside a list");
   \`\`\`

## Long Code Block (overflow test)

\`\`\`
This is a really long line that should trigger horizontal scrolling in the code block to ensure the overflow-x auto styling works correctly for preformatted text blocks.
\`\`\`

That's all the markdown features!
`;

export function DevMarkdown() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: 24 }}>Dev: Markdown Renderer</h1>
      <MarkdownRenderer content={sampleMarkdown} />
    </div>
  );
}
