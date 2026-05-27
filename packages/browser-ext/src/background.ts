// MV3 service worker - minimal; content scripts do all the work.
// Kept alive by chrome.runtime.onInstalled and onMessage.

chrome.runtime.onInstalled.addListener(() => {
  // Could set default options here in the future
});

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    if (
      typeof message === "object" &&
      message !== null &&
      (message as Record<string, unknown>).type === "ping"
    ) {
      sendResponse({ type: "pong" });
    }
    return false;
  },
);
