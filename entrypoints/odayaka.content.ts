import { observeDOM } from '@/utils/dom';

export default defineContentScript({
  matches: ['https://twitter.com/*', 'https://x.com/*'],
  runAt: 'document_idle',
  main() {
    'use strict';

    let hasClickedFollowing = false;

    // ─── Feature: Hide Recommend Tab ─────────────────────────────────────

    function hideRecommend(): void {
      for (const el of document.querySelectorAll<HTMLElement>(
        '.css-175oi2r.r-14tvyh0.r-cpa5s6.r-16y2uox',
      )) {
        const span = el.querySelector('span');
        if (!span) continue;

        if (span.textContent === 'おすすめ') {
          el.style.display = 'none';
        } else if (span.textContent === 'フォロー中' && !hasClickedFollowing) {
          el.querySelector('a')?.click();
          hasClickedFollowing = true;
        }
      }

      // Hide the recommend section indicator
      for (const el of document.querySelectorAll<HTMLElement>(
        '.css-175oi2r.r-4amgru.r-u8s1d.r-184en5c.r-orgf3d.r-633pao.r-o7ynqc.r-1i6wzkk',
      )) {
        el.style.display = 'none';
      }
    }

    // ─── Feature: Hide Ads ───────────────────────────────────────────────

    function hideAds(): void {
      for (const label of document.querySelectorAll('article[data-testid="tweet"] span')) {
        if (label.textContent?.trim() !== '広告' || label.closest('[data-testid="tweetText"]')) continue;
        const article = label.closest<HTMLElement>('article[data-testid="tweet"]');
        if (article) article.style.display = 'none';
      }

      // Promoted trends and event hero cards are not tweet articles.
      // Limit the search to Explore timelines so ordinary content stays visible.
      for (const timeline of document.querySelectorAll(
        '[aria-label="タイムライン: 速報"], [aria-label="タイムライン: 話題を検索"]',
      )) {
        for (const item of timeline.querySelectorAll<HTMLElement>(
          '[data-testid="trend"], [data-testid="eventHero"]',
        )) {
          const promoted = [...item.querySelectorAll('span')].some((span) => {
            const text = span.textContent?.trim() ?? '';
            return text.startsWith('Promoted by ') || text === 'Promoted' ||
              text === 'プロモーション' || text.endsWith('によるプロモーション');
          });
          if (promoted) {
            (item.closest<HTMLElement>('div.r-1adg3ll.r-1ny4l3l') ?? item).style.display = 'none';
          }
        }
      }
    }

    // ─── Feature: Hide Trends ────────────────────────────────────────────

    function hideTrend(): void {
      for (const el of document.querySelectorAll<HTMLElement>(
        'div.r-1867qdf.r-1phboty.r-rs99b7.r-1ifxtd0.r-1udh08x',
      )) {
        const heading = el.querySelector('section[role="region"] h1');
        if (heading?.textContent?.trim() === 'トレンド' || heading?.textContent?.trim() === '速報') {
          el.style.display = 'none';
        }
      }
    }

    // ─── Feature: Hide Engagement Metrics ────────────────────────────────

    /** Texts that should NOT be hidden even in engagement sections. */
    const ENGAGEMENT_KEEP_TEXTS = new Set(['フォロー中', 'フォロワー', '人のメンバー']);

    function hideEngagement(): void {
      // Hide engagement counts on tweets
      const tweetEngagementSelectors = [
        '.css-175oi2r.r-1kbdv8c.r-18u37iz.r-1wtj0ep.r-1ye8kvj.r-1s2bzr4',
        '.css-175oi2r.r-1kbdv8c.r-18u37iz.r-1oszu61.r-3qxfft.r-s1qlax.r-1kfrmmb.r-1efd50x.r-5kkj8d.r-h3s6tt.r-1wtj0ep.r-1ila09b.r-rull8r.r-qklmqi',
      ];

      for (const selector of tweetEngagementSelectors) {
        for (const el of document.querySelectorAll(selector)) {
          for (const span of el.querySelectorAll<HTMLElement>('span')) {
            span.style.display = 'none';
          }
        }
      }

      // Handle view count on tweet detail
      for (const el of document.querySelectorAll(
        '.css-175oi2r.r-1d09ksm.r-18u37iz.r-1wbh5a2.r-1471scf',
      )) {
        for (const span of el.querySelectorAll<HTMLSpanElement>('span')) {
          if (span.textContent === '件の表示') {
            span.style.display = 'inline';
            span.textContent = '非表示';
            // Hide the count number
            const countSpan = span.parentElement?.querySelector('span');
            if (countSpan && countSpan !== span) {
              countSpan.style.display = 'none';
            }
          }
        }
      }

      // Hide profile engagement counts (except "Following", "Followers", "Members")
      for (const el of document.querySelectorAll(
        '.css-175oi2r.r-13awgt0.r-18u37iz.r-1w6e6rj',
      )) {
        for (const span of el.querySelectorAll<HTMLSpanElement>('span')) {
          if (span.textContent && !ENGAGEMENT_KEEP_TEXTS.has(span.textContent)) {
            span.style.display = 'none';
          }
        }
      }
    }

    // ─── Initialize ──────────────────────────────────────────────────────

    chrome.storage.sync
      .get(['enabled', 'hideTrend', 'hideRecommend', 'hideEngagement', 'hideAds'])
      .then((result) => {
        if (result.enabled && result.hideAds !== false) observeDOM(hideAds);
        if (result.hideRecommend) observeDOM(hideRecommend);
        if (result.hideTrend) observeDOM(hideTrend);
        if (result.hideEngagement) observeDOM(hideEngagement);
      });
  },
});
