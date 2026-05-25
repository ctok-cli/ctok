const SUPPORTED_HOSTS = [
  "claude.ai",
  "chatgpt.com",
  "chat.openai.com",
  "www.cursor.com",
  "chat.deepseek.com",
  "gemini.google.com",
];

const HOST_LABELS: Record<string, string> = {
  "claude.ai": "Claude",
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "www.cursor.com": "Cursor",
  "chat.deepseek.com": "DeepSeek",
  "gemini.google.com": "Gemini",
};

async function init() {
  const statusEl = document.getElementById("status-val");
  const overlayEl = document.getElementById("overlay-status");
  const infoRows = document.getElementById("info-rows");
  if (!statusEl || !overlayEl || !infoRows) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    statusEl.textContent = "No active tab";
    return;
  }

  const url = new URL(tab.url);
  const host = url.hostname;

  if (!SUPPORTED_HOSTS.includes(host)) {
    statusEl.textContent = "Not a supported page";
    statusEl.style.color = "#e05252";
    return;
  }

  const label = HOST_LABELS[host] ?? host;
  statusEl.textContent = label;
  statusEl.className = "info-val accent";

  overlayEl.textContent = "Overlay active";
  overlayEl.className = "status active";

  // Ping the content script to confirm it's running
  try {
    await chrome.tabs.sendMessage(tab.id!, { type: "ping" });
  } catch {
    overlayEl.textContent = "Overlay not yet injected";
    overlayEl.className = "status";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch(console.error);
});
