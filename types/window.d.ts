// Type definitions for AI Studio API
interface AistudioWindow {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

declare global {
  interface Window {
    aistudio?: AistudioWindow;
  }
}

export {};

