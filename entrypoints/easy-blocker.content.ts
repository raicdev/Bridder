import { observeDOM, loadSettings, markProcessed } from '@/utils/dom';

export default defineContentScript({
  matches: ['https://twitter.com/*', 'https://x.com/*'],
  runAt: 'document_idle',
  main() {
    'use strict';

    // ─── Shared: Block Confirmation ──────────────────────────────────────

    /** Clicks the block confirmation button after a short delay. */
    function confirmBlock(delayMs = 300): void {
      setTimeout(() => {
        const btn = document.querySelector<HTMLButtonElement>(
          'button[data-testid="confirmationSheetConfirm"]',
        );
        btn?.click();
      }, delayMs);
    }

    /** Creates a block button with the 🚫 emoji. */
    function createBlockButton(style?: Partial<CSSStyleDeclaration>): HTMLButtonElement {
      const btn = document.createElement('button');
      btn.textContent = '🚫';
      if (style) Object.assign(btn.style, style);
      return btn;
    }

    // ─── Feature: DM Conversation Block ──────────────────────────────────

    const DM_SELECTORS = [
      '.css-175oi2r.r-w7s2jr.r-3pj75a.r-13qz1uu.r-z32n2g.r-o7ynqc.r-6416eg.r-1ny4l3l.r-1loqt21',
      '.css-175oi2r.r-kemksi.r-w7s2jr.r-3pj75a.r-13qz1uu.r-o7ynqc.r-6416eg.r-1ny4l3l.r-1loqt21',
    ];

    function dmConversationBlock(): void {
      for (const selector of DM_SELECTORS) {
        for (const el of document.querySelectorAll<HTMLElement>(selector)) {
          if (el.dataset.testid !== 'conversation') continue;
          if (markProcessed(el, 'bridder-block-added')) continue;

          const authorArea = el.querySelector('.css-175oi2r.r-1d09ksm.r-18u37iz.r-1wbh5a2');
          if (!authorArea) continue;

          const blockBtn = createBlockButton({ marginLeft: '5px' });
          authorArea.appendChild(blockBtn);

          blockBtn.addEventListener('click', () => {
            el.click(); // Open the conversation
            setTimeout(() => {
              // Find and click the info button
              const infoLink = document.querySelector<HTMLAnchorElement>(
                'a.css-175oi2r.r-sdzlij.r-1phboty.r-rs99b7.r-lrvibr.r-2yi16.r-1qi8awa.r-o7ynqc.r-6416eg.r-1ny4l3l.r-1loqt21',
              );
              if (!infoLink?.href.endsWith('/info')) return;

              infoLink.click();
              setTimeout(() => {
                // Click the block button in the info panel
                const blockAction = document.querySelector<HTMLButtonElement>(
                  'button.css-175oi2r.r-1777fci.r-1pl7oy7.r-w7s2jr.r-3pj75a.r-1loqt21.r-o7ynqc.r-6416eg.r-1ny4l3l',
                );
                blockAction?.click();
                confirmBlock();
              }, 300);
            }, 300);
          });
        }
      }
    }

    // ─── Feature: Followers Block ────────────────────────────────────────

    function followersBlock(): void {
      const cells = document.querySelectorAll<HTMLElement>(
        '.css-175oi2r.r-1mmae3n.r-3pj75a.r-1loqt21.r-o7ynqc.r-6416eg.r-1ny4l3l',
      );

      for (const cell of cells) {
        if (cell.dataset.testid !== 'UserCell') continue;
        if (markProcessed(cell, 'bridder-block-added')) continue;

        const buttonsContainer = cell.querySelector('.css-175oi2r.r-18u37iz');
        const moreButton = cell.querySelector<HTMLButtonElement>(
          'button.css-175oi2r.r-1777fci.r-bt1l66.r-bztko3.r-lrvibr.r-1loqt21.r-1ny4l3l',
        );

        if (!buttonsContainer || !moreButton) continue;

        const blockBtn = createBlockButton({ maxHeight: '30px', marginLeft: '10px' });
        buttonsContainer.appendChild(blockBtn);

        blockBtn.addEventListener('click', () => {
          moreButton.click();
          setTimeout(() => {
            const blockMenuItem = document.querySelector<HTMLElement>(
              '[data-testid="block"]',
            );
            if (!blockMenuItem) return;

            blockMenuItem.click();
            confirmBlock();
          }, 300);
        });
      }
    }

    // ─── Initialize ──────────────────────────────────────────────────────

    loadSettings([], () => {
      observeDOM(dmConversationBlock);
      observeDOM(followersBlock);
    });
  },
});
