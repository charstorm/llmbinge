export interface ArticleResult {
  raw: string;
  content: string;
}

export interface TopicSuggestionResult {
  raw: string;
  topics: string[];
}

export interface AspectResult {
  raw: string;
  aspects: string[];
}

export interface RandomTopicResult {
  raw: string;
  topic: string;
}

export interface MapTopicsResult {
  raw: string;
  topics: string[];
}

export interface MapLayoutGroup {
  name: string;
  topics: { name: string; x: number; y: number }[];
}

export interface MapLayoutResult {
  raw: string;
  layout: { groups: MapLayoutGroup[] };
}
