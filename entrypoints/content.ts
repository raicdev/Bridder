import { applyDefaultSettings } from '@/utils/settings_data';
import { observeDOM, matchesXPath, hide, markProcessed } from '@/utils/dom';
import { OPTIMIZE_MORE_HIDDEN_URLS, SETTINGS_GEAR_PATH } from '@/utils/constants';

export default defineContentScript({
  matches: ['https://twitter.com/*', 'https://x.com/*'],
  runAt: 'document_idle',
  main() {
    'use strict';

    // ─── Feature: Move Feature Flags Menu ──────────────────────────────────

    let featureMenuMoved = false;

    function moveFeatureMenu(): void {
      for (const container of document.querySelectorAll<HTMLElement>('.featuresBtnContainer')) {
        if (markProcessed(container, 'bridder-featuresBtnContainer')) continue;

        container.style.display = 'none';

        new MutationObserver(() => {
          const dropdown = document.querySelector<HTMLElement>("div.css-175oi2r[data-testid='Dropdown']");

          if (dropdown && !featureMenuMoved) {
            const targetContainer = document.querySelector<HTMLElement>('div.css-175oi2r.r-1mnxbyr');
            if (!targetContainer) return;

            targetContainer.appendChild(container);
            container.style.display = 'block';

            // Adjust dropdown position to account for added element
            const dropdownDiv = document.querySelector<HTMLElement>(
              '.css-175oi2r.r-j2cz3j.r-yfoy6g.r-1q9bdsx.r-xnswec.r-1udh08x.r-1rnoaur.r-1r851ge.r-1xcajam',
            );
            if (dropdownDiv) {
              dropdownDiv.style.top = `${parseInt(dropdownDiv.style.top) - 60}px`;
            }

            const span = container.querySelector('span');
            if (span) {
              span.classList.add('css-1qaijid', 'r-bcqeeo', 'r-qvutc0', 'r-1tl8opc');
              span.style.fontWeight = 'bold';
              span.textContent = '機能フラグ';
            }

            featureMenuMoved = true;
          }

          // Reset flag when dropdown disappears
          if (!dropdown && featureMenuMoved) {
            featureMenuMoved = false;
          }
        }).observe(document.body, { childList: true, subtree: true });
      }
    }

    // ─── Feature: Optimize More (Hide ads/monetization) ────────────────────

    function optimizeMore(): void {
      const links = document.querySelectorAll<HTMLAnchorElement>(
        'div.css-g5y9jx[data-testid="Dropdown"] a.css-g5y9jx.r-16y2uox.r-dnmrzs.r-o7ynqc.r-6416eg.r-1ny4l3l.r-1loqt21',
      );
      for (const link of links) {
        if (OPTIMIZE_MORE_HIDDEN_URLS.has(link.getAttribute('href') ?? '')) {
          hide(link);
        }
      }
    }


    // ─── Feature: White Mode ───────────────────────────────────────────────

    function whiteMode(): void {
      // Use CSS injection instead of iterating all elements for performance
      if (document.getElementById('bridder-whitemode-style')) return;

      const style = document.createElement('style');
      style.id = 'bridder-whitemode-style';
      style.textContent = `
        .r-1waj6vr, .r-4nw3r4,
        [style*="background-color: rgb(249, 24, 128)"] {
          background-color: rgb(255, 255, 255) !important;
          color: rgb(0, 0, 0) !important;
        }
        .r-1waj6vr span, .r-4nw3r4 span {
          color: rgb(0, 0, 0) !important;
        }
        .r-vkub15,
        [style*="color: rgb(249, 24, 128)"] {
          color: rgb(255, 255, 255) !important;
        }
        [stroke="#F91880"] {
          stroke: rgb(255, 255, 255) !important;
        }
      `;
      document.head.appendChild(style);
    }

    // ─── Feature: Remove Premium Banner ────────────────────────────────────

    function removePremiumBanner(): void {
      const containers = document.querySelectorAll(
        'aside[aria-label="プレミアムにサブスクライブ"]',
      );
      for (const container of containers) {
        const anchor = container.querySelector('a[href="/i/premium_sign_up"]');
        if (anchor) {
          const parent = container.parentElement?.parentElement;
          const moreParent = parent?.parentElement;
          // hide separator
          if (moreParent) {
            for (const emptyDiv of moreParent.querySelectorAll(
              'div.css-g5y9jx.r-kemksi.r-1kqtdi0.r-1867qdf.r-1phboty.r-rs99b7.r-1ifxtd0.r-1udh08x',
            )) {
              if (!emptyDiv.hasChildNodes() && !emptyDiv.textContent?.trim()) {
                emptyDiv.remove();
              }
            }
          }
          hide(parent);
        }
      }
    }

    // ─── Feature: Remove "Get Verified" Button ─────────────────────────────

    function removeGetVerified(): void {
      const links = document.querySelectorAll(
        'a.css-g5y9jx.r-sdzlij.r-1phboty.r-rs99b7.r-lrvibr.r-1ceczpf.r-lp5zef.r-3o4zer.r-o7ynqc.r-6416eg.r-1ny4l3l.r-1loqt21, ' +
          'a.css-g5y9jx.r-xoduu5.r-sdzlij.r-1phboty.r-rs99b7.r-lrvibr.r-knv0ih.r-15ysp7h.r-4wgw6l.r-3pj75a.r-o7ynqc.r-6416eg.r-1ny4l3l.r-1loqt21, ' +
          'a[href="/i/premium_sign_up?referring_page=verification_reason_dialog"]'
      );
      for (const link of links) {
        if (link.getAttribute('href') === '/i/premium_sign_up?referring_page=verification_reason_dialog') {
          hide(link);
          continue;
        }
        if (!matchesXPath('/i/premium_sign_up', link)) continue;

        const label = link.querySelector('.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-1tl8opc');
        if (label && label.textContent === '認証される') {
          hide(
            (link.parentNode as Element)?.parentNode
              ? (((link.parentNode as Element).parentNode as Element)?.parentNode as Element)?.parentNode as Element
              : (link.parentNode as Element),
          );
        }
      }
    }


    // ─── Feature: Post Notification Settings Gear ──────────────────────────

    function postNotification(): void {
      const headers = document.querySelectorAll(
        'div.css-175oi2r.r-1awozwy.r-18u37iz.r-1h3ijdo.r-1777fci.r-f8sm7e.r-13qz1uu.r-3pj75a',
      );

      for (const container of headers) {
        const heading = container.querySelector('h2 span');
        if (!heading) continue;
        if (heading.textContent !== 'ツイート' && heading.textContent !== 'ポスト') continue;
        if ((heading as HTMLElement).dataset.bridderAddedNotify) continue;
        (heading as HTMLElement).dataset.bridderAddedNotify = 'true';

        const anchor = createSettingsGearLink();
        const wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'css-175oi2r r-1pz39u2 r-1777fci r-15ysp7h r-obd0qt r-s8bhmr');
        wrapper.appendChild(anchor);
        container.appendChild(wrapper);
      }
    }

    /** Creates the settings gear icon link used in the post notification header. */
    function createSettingsGearLink(): HTMLAnchorElement {
      const anchor = document.createElement('a');
      anchor.href = '/settings/device_follow';
      anchor.setAttribute('aria-label', '設定');
      anchor.setAttribute('role', 'link');
      anchor.setAttribute('class',
        'css-175oi2r r-sdzlij r-1phboty r-rs99b7 r-lrvibr r-10iirkv r-2yi16 r-1qi8awa r-o7ynqc r-6416eg r-1ny4l3l r-1loqt21');
      anchor.dataset.testid = 'settingsAppBar';
      Object.assign(anchor.style, {
        borderColor: 'rgba(0, 0, 0, 0)',
        marginRight: 'calc(-9px)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      });

      anchor.addEventListener('click', async (event) => {
        event.preventDefault();
        window.history.pushState({}, '', '/settings/device_follow');

        try {
          const response = await fetch('/settings/device_follow', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          });
          if (!response.ok) throw new Error('Fetch failed');

          const html = await response.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const newContent = doc.querySelector('main');
          const oldContent = document.querySelector('main');

          if (newContent && oldContent) {
            document.title = doc.title;
            oldContent.innerHTML = newContent.innerHTML;
          } else {
            window.location.href = '/settings/device_follow';
          }
        } catch {
          window.location.href = '/settings/device_follow';
        }
      });

      // Build SVG icon
      const innerDiv = document.createElement('div');
      innerDiv.dir = 'ltr';
      innerDiv.setAttribute('class',
        'css-146c3p1 r-bcqeeo r-qvutc0 r-1tl8opc r-q4m81j r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-18u37iz r-16y2uox r-1777fci');
      Object.assign(innerDiv.style, {
        textOverflow: 'unset',
        color: 'rgb(239, 243, 244)',
      });

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('class', 'r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-z80fyv r-19wmn03');
      svg.style.color = 'rgb(239, 243, 244)';

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', SETTINGS_GEAR_PATH);
      g.appendChild(path);
      svg.appendChild(g);

      const span = document.createElement('span');
      span.setAttribute('class', 'css-1jxf684 r-dnmrzs r-1udh08x r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc r-a023e6 r-rjixqe');
      Object.assign(span.style, {
        textOverflow: 'unset',
        borderBottom: '2px solid rgb(239, 243, 244)',
      });

      innerDiv.appendChild(svg);
      innerDiv.appendChild(span);
      anchor.appendChild(innerDiv);

      return anchor;
    }

    // ─── Feature: Sidebar Optimization ─────────────────────────────────────

    function optimizeSidebar(settings: SidebarSettings): void {
      if (settings.removeFollow) {
        for (const link of document.querySelectorAll('a[data-testid="AppTabBar_Follow_Link"][href="/i/connect_people"]')) {
          hide(link);
        }
      }
      if (settings.removeCreatorStudio) {
        for (const link of document.querySelectorAll('a[href="/i/jf/creators/studio"][aria-label="クリエイタースタジオ"]')) {
          hide(link);
        }
      }

      if (settings.removeGrok) {
        for (const link of document.querySelectorAll('a.r-6koalj[href="/i/grok"]')) {
          hide(link);
        }
      }

      if (settings.removePremium) {
        for (const link of document.querySelectorAll(
          'a.r-6koalj[href="/i/premium_sign_up"], ' +
          'a[data-testid="premium-signup-tab"][href="/i/premium_sign_up"], ' +
          'a.r-6koalj[href="/i/verified-orgs-signup"], ' +
          'a.r-dnmrzs.r-o7ynqc.r-6416eg[href="/i/verified-orgs-signup"]',
        )) {
          hide(link);
        }

        // Business upsell card in the Premium hub (not a sidebar link).
        for (const link of document.querySelectorAll<HTMLAnchorElement>(
          'a[href^="/i/verified-orgs-signup?"][href*="referring_page=premium_hub_card"]',
        )) {
          hide(link.closest('div.r-kemksi.r-1867qdf'));
        }
      }
    }

    interface SidebarSettings {
      removePremium: boolean;
      removeGrok: boolean;
      removeFollow: boolean;
      removeCreatorStudio: boolean;
    }

    // ─── Initialize ────────────────────────────────────────────────────────

    chrome.storage.sync
      .get([
        'enabled',
        'whitemode',
        'optimizeMore',
        'sidebar_removePremium',
        'sidebar_removeGrok',
        'sidebar_removeFollow',
        'sidebar_removeCreatorStudio',
        'removePremiumBanner',
        'removeGetVerified',
        'FeatureFlags',
      ])
      .then((result: Record<string, unknown>) => {
        // Apply defaults on first run
        if (result.removeGetVerified == null) {
          applyDefaultSettings();
          window.location.reload();
          return;
        }

        if (!result.enabled) return;

        const sidebarSettings: SidebarSettings = {
          removePremium: result.sidebar_removePremium as boolean,
          removeGrok: result.sidebar_removeGrok !== false,
          removeFollow: result.sidebar_removeFollow !== false,
          removeCreatorStudio: result.sidebar_removeCreatorStudio !== false,
        };

        // Always-on features
        observeDOM(() => optimizeSidebar(sidebarSettings));
        observeDOM(postNotification);

        // Conditional features
        if (result.removePremiumBanner) observeDOM(removePremiumBanner);
        if (result.removeGetVerified) observeDOM(removeGetVerified);
        if (result.FeatureFlags) observeDOM(moveFeatureMenu);
        if (result.whitemode) whiteMode(); // CSS injection only needs to run once
        if (result.optimizeMore) observeDOM(optimizeMore);
      });
  },
});
