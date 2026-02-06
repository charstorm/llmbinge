export class LLMError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export class StreamError extends Error {
  constructor(
    message: string,
    public partialContent?: string,
  ) {
    super(message);
    this.name = "StreamError";
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
