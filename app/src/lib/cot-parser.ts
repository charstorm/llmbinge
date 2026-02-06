const NUMBERED_LINE = /^\s*\d+[\.\)]\s*(.+)$/;
const BULLETED_LINE = /^\s*[-*•]\s+(.+)$/;

export function extractTopicsFromCoT(
  cotOutput: string,
  takeFromEnd = 20,
): string[] {
  const lines = cotOutput.split("\n");
  const topics: string[] = [];

  for (const line of lines) {
    let match = NUMBERED_LINE.exec(line);
    if (!match) match = BULLETED_LINE.exec(line);
    if (match?.[1]) {
      const topic = match[1].trim();
      if (topic.length > 0) {
        topics.push(topic);
      }
    }
  }

  if (topics.length <= takeFromEnd) return topics;
  return topics.slice(-takeFromEnd);
}
