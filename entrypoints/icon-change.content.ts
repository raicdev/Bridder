import { observeDOM, loadSettings, isDarkTheme } from '@/utils/dom';
import {
  X_LOGO_PATH,
  X_DOCUMENT_LOGO_PATH,
  X_HOME_OUTLINE_PATH,
  X_HOME_FILLED_PATH,
  TWITTER_BIRD_PATH,
  TWITTER_FAVICON_URL,
  TWITTER_BLUE_BADGE_PATH,
  TWITTER_HOME_OUTLINE_PATH,
  TWITTER_HOME_FILLED_PATH,
  TWITTER_HOME_OUTLINE_SPACED_PATH,
} from '@/utils/constants';

export default defineContentScript({
  matches: ['https://twitter.com/*', 'https://x.com/*'],
  runAt: 'document_idle',
  main() {
    'use strict';

    // ─── Favicon ─────────────────────────────────────────────────────────

    function fixIcon(): void {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      if (link.href !== TWITTER_FAVICON_URL) {
        link.href = TWITTER_FAVICON_URL;
      }
    }

    // ─── SVG Path Replacement Map ────────────────────────────────────────

    /**
     * Defines all SVG path replacements in a single pass.
     * Each entry maps an old path `d` attribute to a replacement config.
     */
    interface PathReplacement {
      newPath: string;
      /** Optional style to apply to the parent SVG. */
      svgStyle?: Partial<CSSStyleDeclaration>;
      /** Optional fill-rule to set on the path. */
      fillRule?: string;
      /** Optional fill color on the SVG. */
      svgFill?: string;
    }

    const PATH_REPLACEMENTS = new Map<string, PathReplacement>([
      [X_HOME_OUTLINE_PATH, { newPath: TWITTER_HOME_OUTLINE_PATH }],
      [X_HOME_FILLED_PATH, { newPath: TWITTER_HOME_FILLED_PATH }],
    ]);

    // ─── Logo Replacement ────────────────────────────────────────────────

    function fixLogo(): void {
      const darkMode = isDarkTheme();
      const birdColor = darkMode ? '#fff' : 'rgb(29, 155, 240)';

      for (const svg of document.querySelectorAll<SVGElement>('svg')) {
        // --- X Logo → Twitter Bird ---
        const xLogoPath = svg.querySelector<SVGPathElement>(`path[d='${X_LOGO_PATH}']`);
        if (xLogoPath) {
          // Special loading screen logo (has specific class pattern)
          const cl = svg.classList;
          if (cl.contains('r-1nao33i') && cl.contains('r-4qtqp9') && cl.contains('r-yyyyoo') && cl.contains('r-lwhw9o')) {
            svg.style.fill = 'none';
            svg.style.stroke = 'rgb(0, 0, 0)';
            svg.style.paintOrder = 'fill';
            xLogoPath.setAttribute('d', TWITTER_BLUE_BADGE_PATH);
          } else {
            svg.style.color = birdColor;
            xLogoPath.setAttribute('d', TWITTER_BIRD_PATH);
          }
          continue; // Only one main path per SVG
        }

        // --- Document/Large X Logo → Twitter Bird ---
        const docLogoPath = svg.querySelector<SVGPathElement>(`path[d='${X_DOCUMENT_LOGO_PATH}']`);
        if (docLogoPath) {
          svg.style.color = birdColor;
          docLogoPath.setAttribute('d', TWITTER_BIRD_PATH);

          // Remove drop-shadow filter if present
          const filtered = svg.querySelector('g[filter="url(#filter0_d_40_56253)"]');
          filtered?.removeAttribute('filter');
          continue;
        }

        // --- Home Icon Replacements ---
        for (const [oldPath, replacement] of PATH_REPLACEMENTS) {
          const pathEl = svg.querySelector<SVGPathElement>(`path[d='${oldPath}']`);
          if (pathEl) {
            pathEl.setAttribute('d', replacement.newPath);
            if (replacement.svgFill) svg.style.fill = replacement.svgFill;
            if (replacement.fillRule) pathEl.setAttribute('fill-rule', replacement.fillRule);
            break;
          }
        }

        // --- Second home outline variant (already replaced path, re-apply with spaced version) ---
        const homeOutline2 = svg.querySelector<SVGPathElement>(`path[d='${X_HOME_OUTLINE_PATH}']`);
        if (homeOutline2) {
          svg.style.fill = '#fff';
          homeOutline2.setAttribute('fill-rule', 'nonzero');
          homeOutline2.setAttribute('d', TWITTER_HOME_OUTLINE_SPACED_PATH);
        }
      }
    }

    // ─── Initialize ──────────────────────────────────────────────────────

    loadSettings<{ icon_mode: boolean }>(['icon_mode'], (settings) => {
      if (!settings.icon_mode) return;

      observeDOM(fixLogo);
      observeDOM(fixIcon);
    });
  },
});
