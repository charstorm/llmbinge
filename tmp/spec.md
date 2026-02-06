# LLM Binge — Requirements Document

## 1. User-Level Requirements

### 1.1 Wiki Page View

Each topic is presented as a modern wiki-style page containing:

- **Title** of the topic
- **Generated description** — main article content rendered as Markdown with syntax-highlighted code blocks and LaTeX equation rendering
- **Related topics** — a combination of a global fixed set and an LLM-generated set; clickable to create a child page
- **Aspects** — angles to explore (e.g., history, people, locations, risks, applications); a global fixed set (~10, defined in TOML config) is always shown, plus LLM-generated additional aspects based on the topic; clicking one generates a new child page scoped to that angle
- **Previously explored sub-topics** — children already visited; clickable to revisit
- **Parent link** — navigate back up the tree (parent can be either another article page or a topic exploration map page)
- **Regenerate button** — re-generate the current page content
- **Delete button** — deletes the current node and all its descendants; triggers a soft inline confirmation (not a browser `confirm()` dialog — e.g., an inline "Are you sure?" banner or a modal within the app)

### 1.2 Starting an Exploration

- User types a topic into a text field and presses Enter to generate its wiki page
- A "Random Topic" button auto-generates and explores a random topic using chain-of-thought at higher temperature (generates ~100 candidates, picks from the last ~20 for maximum randomness buildup)
- Content streams in progressively as the LLM generates it

### 1.3 In-Page Exploration

- User can select text within the article body and click an "Explore Selection" button to create a child page from that selection

### 1.4 Sidebar

- Displays all topics generated in the current session as a navigable tree/list
- Wiki pages and map pages are visually distinguished (e.g., different icons)
- Clicking any entry jumps to that page

### 1.5 Topic Exploration Map (Separate Page)

- A dedicated page presenting a set of topics laid out on a **2D plane**
- **Initial topic generation**: LLM generates ~100 candidate topics using chain-of-thought at higher temperature; only the last ~20 are selected (the CoT preamble acts as a diversity/creativity warm-up)
- **Layout**: LLM provides grouping/positioning metadata (categories, relative coordinates, clusters); client renders topics as positioned `div` elements with connecting lines (e.g., using LeaderLine or simple SVG lines) — simplest viable approach
- **Navigation forward**: clicking a topic on the map generates a new set of nearby/related topics via a fresh LLM call, displayed as a new map page (child of the current map)
- **Navigation backward**: going back uses the already-stored parent map page — no regeneration needed
- **Article creation**: Shift+Click (or right-click → "Generate Article") on a topic creates a wiki article page as a child of the current map page; the article opens in the same page (replaces the map view), navigable back via parent link
- **Cross-linking**: a map page can be the parent of an article page, and an article page can be the parent of a map page; both types participate in the same session tree
- This page operates at the **topic level only** — no article content is shown inline

### 1.6 Sessions

- A session captures an entire exploration tree (wiki pages + map pages + relationships + generated content)
- Sessions persist across page refreshes via IndexedDB (namespaced)
- User can view a list of past sessions, resume one, or start a new session
- User can **delete an entire session**, which destroys all nodes belonging to it (with soft inline confirmation)
- No maximum depth or size limit on the exploration tree

### 1.7 Node Deletion

- Any node (wiki page or map page) can be deleted
- Deleting a node **recursively deletes all its descendants**
- A soft, in-app confirmation is shown before deletion (inline banner or small modal — never `window.confirm()`)
- Deletion is reflected immediately in the sidebar and in any parent page's sub-topic list

### 1.8 Configuration Page (Separate Page)

- Configurable fields:
  - LLM API endpoint URL (default: OpenRouter `https://openrouter.ai/api/v1`)
  - Model identifier (default: `openai/gpt-4o-mini`)
  - Temperature
  - Max tokens, top-p, and other common LLM parameters
  - The global fixed set of aspects (~10, editable)
- Defaults loaded from a TOML config file
- User overrides persist across sessions via IndexedDB (namespaced)
- All LLM calls use the OpenAI-compatible chat completions API format (`/v1/chat/completions` with streaming)

### 1.9 Error Handling

- LLM errors, network failures, streaming interruptions, and invalid configurations are surfaced to the user via clear, non-intrusive UI (toast notifications or inline error banners)

---

## 2. Implementation Requirements

### 2.1 Tech Stack

| Concern | Choice |
|---|---|
| Framework | React with TypeScript (strictly no plain JS) |
| Build tool | Bun |
| Testing | Vitest (Bun/Node — no browser required for unit tests) |
| LLM API format | OpenAI-compatible `/v1/chat/completions` with streaming |
| Markdown rendering | `react-markdown` + `remark-math` + `rehype-katex` + syntax highlighting |
| Storage | IndexedDB (namespaced under `llm-binge:`) |
| Routing | React Router (URL-based) |
| 2D map layout | Positioned `div` elements + SVG lines or LeaderLine |
| Default endpoint | `https://openrouter.ai/api/v1` |
| Default model | `openai/gpt-4o-mini` |

### 2.2 Testing Strategy

- **Framework**: Vitest — Bun/Node compatible, zero browser dependency for unit tests
- **Principle**: maximize testable-without-browser code
  - All agents, prompt template loaders, config parsing, tree operations (insert, delete, traverse), storage serialization/deserialization, LLM response parsing, and CoT output extraction are implemented as pure TypeScript functions and tested directly
  - UI components are kept thin; business logic lives in standalone modules
- **Standalone dev-only test pages** (excluded from production build):
  - `/__dev/test-markdown` — sample Markdown with code blocks and LaTeX
  - `/__dev/test-streaming` — raw LLM streaming output display
  - `/__dev/test-agents` — invoke individual agents with custom inputs, inspect prompt and response
  - `/__dev/test-tree` — visualize and manipulate a session tree with mock data
  - `/__dev/test-storage` — exercise IndexedDB read/write/delete, display stored data
  - `/__dev/test-map-layout` — render a 2D topic map with mock positioning data
- Test files colocated with source (e.g., `src/agents/__tests__/articleAgent.test.ts`)

### 2.3 Agent Architecture

Named agents, each in its own TypeScript file under `src/agents/`:

| Agent | Responsibility | Notes |
|---|---|---|
| `ArticleAgent` | Generates wiki article content for a topic | Streaming |
| `TopicSuggestionAgent` | Generates related topics for a wiki page | Given fixed set, generates more |
| `AspectAgent` | Generates additional aspects for a topic | Given the fixed set from config, asks LLM for more |
| `RandomTopicAgent` | Generates a single random topic | CoT + high temp, ~100 candidates → pick from last ~20 |
| `MapTopicGeneratorAgent` | Generates initial topic set for the 2D map | CoT + high temp, ~100 candidates → last ~20 |
| `MapLayoutAgent` | Produces grouping/positioning metadata for topics | LLM decides categories, relative x/y, clusters |
| `MapExpansionAgent` | Given a selected map topic, generates nearby topics for a new map | CoT + high temp, same approach |

**Prompt externalization**:
- Each agent loads its prompt template from a standalone file under `src/prompts/` (e.g., `article.prompt.md`)
- Prompts are never hard-coded in TypeScript
- Templates use clearly marked interpolation fields: `{{topic}}`, `{{aspect}}`, `{{existingAspects}}`, etc.

### 2.4 Storage

- All IndexedDB database names are prefixed with `llm-binge-` to avoid namespace pollution
- A storage abstraction layer so the rest of the app never calls IndexedDB directly
- An in-memory mock implementation of the same interface for unit testing

### 2.5 Configuration File

- `defaults.toml` stores all default configuration values, including the global fixed aspects list
- The Configuration Page reads these defaults and lets the user override them
- Overrides stored in IndexedDB under the `llm-binge-config` store

### 2.6 Tree Data Model

- Each node has: `id`, `type` (`article` | `map`), `parentId` (nullable for roots), `sessionId`, `title`, `content`, `metadata`, `childrenIds`, `createdAt`
- Tree operations (insert, delete with cascade, reparent, traverse) are implemented as **pure functions** — fully testable without a browser
- Deletion of a node recursively removes all descendants from storage

### 2.7 CoT Topic Extraction

- A shared utility function parses LLM CoT output and extracts the final ~20 topics from the tail of a ~100-topic generation
- This function is pure and independently testable

### 2.8 Project Structure
You decide.


#### Implimentation Dir
/home/vinay/universe/work/llmbinge/app