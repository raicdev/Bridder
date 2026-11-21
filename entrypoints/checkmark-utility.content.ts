import { observeDOM, loadSettings, isDarkTheme, createSVGElement } from '@/utils/dom';
import { TWITTER_BLUE_BADGE_PATH, TWITTER_BLUE_ICON_PATH, X_CHECKMARK_PATH } from '@/utils/constants';

export default defineContentScript({
  matches: ['https://twitter.com/*', 'https://x.com/*'],
  runAt: 'document_idle',
  main() {
    'use strict';

    // ─── Helpers ─────────────────────────────────────────────────────────

    /** Returns true if the SVG is a verification badge. */
    function isVerificationBadge(svg: SVGElement): boolean {
      return (
        svg.getAttribute('aria-label') === '認証済みアカウント' ||
        svg.dataset.testid === 'verificationBadge'
      );
    }

    // ─── Feature: White Checkmarks ───────────────────────────────────────

    function whiteCheckMark(includeOrg: boolean): void {
      if (!isDarkTheme()) return;

      for (const svg of document.querySelectorAll<SVGElement>('svg.r-yyyyoo')) {
        if (!isVerificationBadge(svg)) continue;

        // Make the checkmark white
        (svg as unknown as HTMLElement).style.color = 'white';

        if (!includeOrg) continue;

        // Replace the X-style checkmark path with the Twitter Blue badge
        for (const g of svg.querySelectorAll('g')) {
          const path = g.querySelector('path');

          // Replace the standard X checkmark
          if (path?.getAttribute('d') === X_CHECKMARK_PATH) {
            path.setAttribute('d', TWITTER_BLUE_BADGE_PATH);
            path.setAttribute('fill', 'white');
          }

          // Replace gradient-based org badges with a white badge
          if (g.querySelector('linearGradient')) {
            // Clear the gradient group and replace with a simple white badge path
            while (g.firstChild) g.removeChild(g.firstChild);

            const whitePath = createSVGElement('path');
            whitePath.setAttribute('fill', 'white');
            whitePath.setAttribute('d', TWITTER_BLUE_BADGE_PATH);
            g.appendChild(whitePath);
          }
        }
      }
    }

    // ─── Feature: Verified Blue Icon ─────────────────────────────────────

    function verifiedBlue(): void {
      for (const svg of document.querySelectorAll<SVGElement>('svg.r-yyyyoo')) {
        if (!isVerificationBadge(svg)) continue;
        if (svg.querySelector('linearGradient')) continue; // Don't modify org/gov badges

        const path = svg.querySelector('path');
        if (!path || path.getAttribute('fill') === '#829aab') continue;

        path.setAttribute('d', TWITTER_BLUE_ICON_PATH);
      }
    }

    // ─── Feature: Delete All Checkmarks ──────────────────────────────────

    function blueDelete(): void {
      // Hide "About verified accounts" detail panels
      for (const div of document.querySelectorAll<HTMLDivElement>('div')) {
        if (div.getAttribute('aria-label') === '認証済みアカウントについての詳細が表示されます。') {
          const parent = div.parentElement;
          if (parent) parent.style.display = 'none';
        }
      }

      // Hide the checkmark SVGs
      for (const svg of document.querySelectorAll<SVGElement>('svg')) {
        if (svg.getAttribute('aria-label') === '認証済みアカウント') {
          svg.style.display = 'none';
        }
      }
    }

    // ─── Initialize ──────────────────────────────────────────────────────

    type CheckmarkSettings = {
      verifiedBlue: boolean;
      blue_delete: boolean;
      wc_org: boolean;
      white_checkmark: boolean;
    };

    loadSettings<CheckmarkSettings>(
      ['verifiedBlue', 'blue_delete', 'wc_org', 'white_checkmark'],
      (settings) => {
        if (settings.verifiedBlue) observeDOM(verifiedBlue);
        if (settings.blue_delete) observeDOM(blueDelete);
        if (settings.white_checkmark) observeDOM(() => whiteCheckMark(settings.wc_org));
      },
    );
  },
});
