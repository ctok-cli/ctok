export interface SiteConfig {
  /** CSS selectors tried in order - first match wins. */
  selectors: string[];
  /** How to extract text from a matched element. */
  readText: (el: Element) => string;
  /** Label shown in the widget header. */
  label: string;
}

function contentEditableText(el: Element): string {
  return (el as HTMLElement).innerText ?? el.textContent ?? "";
}

function textareaText(el: Element): string {
  return (el as HTMLTextAreaElement).value ?? "";
}

const SITE_CONFIGS: Record<string, SiteConfig> = {
  "claude.ai": {
    selectors: [
      ".ProseMirror[contenteditable='true']",
      "[contenteditable='true'][data-gramm]",
      "div[contenteditable='true']",
    ],
    readText: contentEditableText,
    label: "Claude",
  },
  "chatgpt.com": {
    selectors: [
      "#prompt-textarea",
      "[contenteditable='true'][data-id]",
      "div[contenteditable='true']",
      "textarea",
    ],
    readText: (el) =>
      el.tagName === "TEXTAREA" ? textareaText(el) : contentEditableText(el),
    label: "ChatGPT",
  },
  "chat.openai.com": {
    selectors: [
      "#prompt-textarea",
      "[contenteditable='true']",
      "textarea",
    ],
    readText: (el) =>
      el.tagName === "TEXTAREA" ? textareaText(el) : contentEditableText(el),
    label: "ChatGPT",
  },
  "www.cursor.com": {
    selectors: [
      ".composer-input[contenteditable='true']",
      "[contenteditable='true']",
      "textarea",
    ],
    readText: (el) =>
      el.tagName === "TEXTAREA" ? textareaText(el) : contentEditableText(el),
    label: "Cursor",
  },
  "chat.deepseek.com": {
    selectors: [
      "textarea#chat-input",
      "textarea",
      "[contenteditable='true']",
    ],
    readText: (el) =>
      el.tagName === "TEXTAREA" ? textareaText(el) : contentEditableText(el),
    label: "DeepSeek",
  },
  "gemini.google.com": {
    selectors: [
      ".ql-editor[contenteditable='true']",
      "rich-textarea [contenteditable='true']",
      "[contenteditable='true']",
    ],
    readText: contentEditableText,
    label: "Gemini",
  },
};

export function getSiteConfig(): SiteConfig | null {
  const host = window.location.hostname;
  return SITE_CONFIGS[host] ?? null;
}
