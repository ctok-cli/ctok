import { getSiteConfig } from "./sites";
import { mountWidget } from "./widget";

const DEBOUNCE_MS = 350;
const HOST_ID = "ctok-widget-root";

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

function init() {
  const config = getSiteConfig();
  if (!config) return;

  // Don't inject twice
  if (document.getElementById(HOST_ID)) return;

  // Create shadow DOM host
  const host = document.createElement("div");
  host.id = HOST_ID;
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  let currentText = "";
  let dismissed = false;
  let renderWidget: (() => void) | null = null;
  let targetEl: Element | null = null;

  function getText(): string {
    return currentText;
  }

  function onDismiss() {
    dismissed = true;
    host.remove();
  }

  renderWidget = mountWidget(shadow, getText, config.label, onDismiss);

  const debouncedRender = debounce(() => {
    if (dismissed) return;
    renderWidget!();
  }, DEBOUNCE_MS);

  function attachListeners(el: Element) {
    if (targetEl === el) return;
    targetEl = el;

    // Initial render
    currentText = config!.readText(el);
    debouncedRender();

    // input events (keyboard typing)
    el.addEventListener("input", () => {
      if (dismissed) return;
      currentText = config!.readText(el);
      debouncedRender();
    });

    // Also watch for programmatic changes via MutationObserver on the element
    const innerObserver = new MutationObserver(() => {
      if (dismissed) return;
      const text = config!.readText(el);
      if (text !== currentText) {
        currentText = text;
        debouncedRender();
      }
    });
    innerObserver.observe(el, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  function tryFindTextarea(): Element | null {
    for (const selector of config!.selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  // Try to attach immediately
  const immediate = tryFindTextarea();
  if (immediate) {
    attachListeners(immediate);
  }

  // Watch for SPA navigation / lazy-loaded editors
  const domObserver = new MutationObserver(() => {
    if (dismissed || targetEl) return;
    const el = tryFindTextarea();
    if (el) attachListeners(el);
  });
  domObserver.observe(document.body, { childList: true, subtree: true });
}

// Run after page is loaded; on SPAs also re-run after navigation
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Re-init on SPA soft navigations (pushState / replaceState / popstate)
const originalPushState = history.pushState.bind(history);
history.pushState = function (...args) {
  originalPushState(...args);
  setTimeout(init, 500);
};
window.addEventListener("popstate", () => setTimeout(init, 500));
