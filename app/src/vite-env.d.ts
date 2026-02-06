/// <reference types="vite/client" />

declare module "*.toml?raw" {
  const content: string;
  export default content;
}

declare module "*.prompt.md?raw" {
  const content: string;
  export default content;
}
