/**
 * Shared DOM utility functions for Bridder content scripts.
 * Centralizes common patterns: MutationObserver setup, element querying,
 * URL matching, theme detection, and cookie access.
 */

// ─── MutationObserver Helper ─────────────────────────────────────────────────

/**
 * Observes `document.body` for DOM mutations and runs `callback` on each change.
 * Also invokes `callback` immediately so elements already on the page are processed.
 */
export function observeDOM(callback: () => void): MutationObserver {
  const observer = new MutationObserver(callback);
  observer.observe(document.body, { childList: true, subtree: true });
  callback(); // process already-rendered elements
  return observer;
}

// ─── Settings Helper ─────────────────────────────────────────────────────────

/**
 * Loads settings from `chrome.storage.sync` and invokes `callback` only when
 * the extension is enabled.
 */
export function loadSettings<T extends Record<string, unknown>>(
  keys: string[],
  callback: (settings: T) => void,
): void {
  chrome.storage.sync.get(['enabled', ...keys]).then((result) => {
    if (result.enabled) {
      callback(result as T);
    }
  });
}

// ─── URL Matching ────────────────────────────────────────────────────────────

/** Returns `true` if the anchor element points to the given path on x.com or twitter.com. */
export function matchesXPath(path: string, element: Element): boolean {
  const href = (element as HTMLAnchorElement).href;
  return href === `https://x.com${path}` || href === `https://twitter.com${path}`;
}

// ─── Theme Detection ─────────────────────────────────────────────────────────

export type Theme = 'light' | 'dim' | 'dark';

/** Detects the current Twitter/X theme based on `document.body.style.backgroundColor`. */
export function getTheme(): Theme {
  const bg = document.body.style.backgroundColor;
  if (bg === 'rgb(21, 32, 43)') return 'dim';
  if (bg === 'rgb(0, 0, 0)') return 'dark';
  return 'light';
}

/** Returns `true` when the current theme is dim or dark (i.e. not light). */
export function isDarkTheme(): boolean {
  return getTheme() !== 'light';
}

// ─── Cookie Access ───────────────────────────────────────────────────────────

/** Reads a specific cookie value by name. Returns the value string or `""`. */
export function getCookie(name: string): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

// ─── Misc DOM Helpers ────────────────────────────────────────────────────────

/** Hides an element by setting `display: none`. */
export function hide(el: Element | null | undefined): void {
  if (el) (el as HTMLElement).style.display = 'none';
}

/**
 * Marks an element as already-processed by Bridder to avoid duplicate work.
 * Returns `true` if the element was already marked (i.e. skip it).
 */
export function markProcessed(el: Element, key = 'bridder'): boolean {
  if (el.getAttribute(`data-${key}`) === 'true') return true;
  el.setAttribute(`data-${key}`, 'true');
  return false;
}

/** Creates an SVG element in the SVG namespace. */
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}
