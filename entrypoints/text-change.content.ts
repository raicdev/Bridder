import { loadSettings } from '@/utils/dom';
import { SIDEBAR_BIRD_PATH } from '@/utils/constants';

export default defineContentScript({
  matches: ['https://twitter.com/*', 'https://x.com/*'],
  runAt: 'document_idle',
  main() {
    'use strict';

    /** Shown in the footer; read from the manifest so it never drifts from the release. */
    const BRIDDER_VERSION = chrome.runtime.getManifest().version;

    // ─── Text Replacement Configuration ──────────────────────────────────

    /** Exact text replacements (full match → replace). */
    const EXACT_REPLACEMENTS: ReadonlyMap<string, string> = new Map([
      ['X Premium', 'Twitter Blue'],
      ['長いポスト', '長いツイート'],
      ['さんの新しいポスト通知', 'さんの新しいツイート通知'],
      ['さんがあなたのポストをいいねしました', 'さんがあなたのツイートをいいねしました'],
      ['さんがあなたのポストをリポストしました', 'さんがあなたのツイートをリツイートしました'],
      ['プレミアムにサブスクライブ', 'Twitter Blueにサブスクライブ'],
      ['プレミアムまたは認証済み組織にサブスクライブしている', 'Twitter Blueまたは認証済み組織にサブスクライブしている'],
      ['ポスト', 'ツイート'],
      ['リポスト', 'リツイート'],
      ['話題のポスト', '話題のツイート'],
      ['Reposts', '件のリツイート'],
      ['リポストしたユーザー', 'リツイートしたユーザー'],
      ['Xアクティビティ', 'Twitterアクティビティ'],
      ['プレミアムに含まれている特典を確認し、設定を管理しましょう', 'Blueに含まれている特典を確認し、設定を管理しましょう'],
      [
        'ポストの編集、ブックマークフォルダ、その他の新機能など、すでに提供されているすべてのPremiumの機能を利用できます',
        'ツイートの編集、ブックマークフォルダ、その他の新機能など、すでに提供されているすべてのBlueの機能を利用できます',
      ],
      [
        '電話番号が認証済みのプレミアムユーザーには、承認後、青いチェックマークが付きます。',
        '電話番号が認証済みのTwitter Blueユーザーには、承認後、青いチェックマークが付きます。',
      ],
      ['30分以内であれば投稿を5回まで編集できます。', '30分以内であればツイートを5回まで編集できます。'],
      [
        '長さが最大25,000文字の投稿、返信、引用を作成できます。',
        '長さが最大25,000文字のツイート、返信、引用を作成できます。',
      ],
    ]);

    /** Substring replacements (applied with replaceAll). */
    const SUBSTRING_REPLACEMENTS: ReadonlyArray<[string, string]> = [
      [' 件のポスト', ' 件のツイート'],
      ['長いポスト', '長いツイート'],
      ['さんがポストしました', 'さんがツイートしました'],
      ['ポスト', 'ツイート'],
    ];

    /**
     * The brand name "X" followed by a particle ("Xで", "Xを利用しています", "X上の").
     * The lookbehind keeps words that merely end in X ("MAXの", "FAXで") intact.
     */
    const X_BRAND_PATTERN = /(?<![A-Za-z0-9])X(?=アカウント|で|の|が|と|に|を|は|上)/g;

    /** data-testid or other attributes that mark containers we should NOT modify. */
    const SKIP_SELECTORS = [
      { selector: '[data-testid="UserName"]', check: null },
      { selector: '[role="heading"]', className: 'css-1rynq56.r-dnmrzs.r-1udh08x.r-3s2u2q.r-bcqeeo.r-qvutc0.r-1tl8opc.r-adyw6z.r-135wba7.r-b88u0q.r-1vvnge1' },
      { selector: '[data-testid="tweetText"]', check: null },
      { selector: '[aria-label="Grok"]', check: null },
      { selector: '[data-testid="activeRoute"]', check: null },
      { selector: '[data-testid="twitter-article-title"]', check: null },
      { selector: '[role="typeaheadDropdown-3"]', check: null },
      { selector: '[data-testid="UserCell"]', check: null },
      { selector: '[data-testid="TypeaheadUser"]', check: null },
    ];

    /** Include the root itself when it matches a selector. */
    function findIn(root: Element, selector: string): Element[] {
      return [
        ...(root.matches(selector) ? [root] : []),
        ...root.querySelectorAll(selector),
      ];
    }

    /**
     * Containers whose text is written by users (or generated from their posts),
     * not by X's UI. No replacement may ever touch these.
     */
    const USER_CONTENT_SELECTOR = [
      '[data-testid="tweetText"]',
      '[data-testid="UserName"]',
      '[data-testid="User-Name"]',
      '[data-testid="UserDescription"]',
      '[data-testid="UserLocation"]',
      '[data-testid="UserUrl"]',
      '[data-testid="UserProfessionalCategory"]',
      '[data-testid="UserCell"]',
      '[data-testid="TypeaheadUser"]',
      '[data-testid="typeaheadResult"]',
      // Search suggestions. (The chat conversation list is a listbox too, so match by id.)
      '[role="listbox"][id^="typeaheadDropdown"]',
      '[data-testid="twitter-article-title"]',
      '[data-testid="twitterArticleRichTextView"]',
      '[data-testid="card.wrapper"]',
      '[data-testid="cardPoll"]',
      '[data-testid="birdwatch-pivot"]',
      '[data-testid="messageEntry"]',
      '[data-testid="conversation"]',
      '[data-testid="DmActivityContainer"]',
      '[data-testid="GrokDrawer"]',
      '[data-testid="chat-drawer-root"]',
      '[aria-label="Grok"]',
      '[contenteditable="true"]',
      'textarea',
      // In notifications the account names are links; the sentence around them is UI.
      '[data-testid="notification"] a',
    ].join(', ');

    /** Trend / news cells: the name is content, only the post count line is UI. */
    const TREND_SELECTOR = '[data-testid="trend"], [data-testid^="news_sidebar_article"]';

    function isUserContent(el: Element | null): boolean {
      return !el || !!el.closest(USER_CONTENT_SELECTOR);
    }

    /** UI chrome only: not user content, a trend cell, a tweet body or a (possibly user-named) tab. */
    function isChrome(el: Element): boolean {
      return !isUserContent(el) && !el.closest(TREND_SELECTOR) && !el.closest('article, [role="tablist"]');
    }

    /** Replace only text nodes: removing children with textContent breaks X's React tree. */
    function replaceText(el: Element, transform: (text: string) => string): void {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (isUserContent(node.parentElement)) continue;
        const original = node.nodeValue ?? '';
        const replacement = transform(original);
        if (replacement !== original) node.nodeValue = replacement;
      }
    }

    /** Check whether this element is inside a context that should not be text-replaced. */
    function shouldSkipElement(el: Element): boolean {
      // Skip if it contains a textarea
      if (el.querySelector('textarea')) return true;

      for (const { selector } of SKIP_SELECTORS) {
        if (el.closest(selector)) return true;
      }
      if (isUserContent(el) || el.closest(TREND_SELECTOR)) return true;

      // Skip elements inside articles (tweet bodies) — except social context
      // and notification sentences ("…さんがあなたのポストをいいねしました").
      if (
        el.closest('article') &&
        !el.closest('[data-testid="socialContext"], [data-testid="notification"]')
      ) return true;

      return false;
    }

    // ─── Premium Label Replacement ───────────────────────────────────────

    /** Premium label selectors that match the sidebar items. */
    const PREMIUM_SIDEBAR_SELECTORS = [
      'a.css-175oi2r.r-6koalj.r-eqz5dr.r-16y2uox.r-1habvwh.r-oyd9sg.r-13qz1uu.r-1ny4l3l.r-1loqt21',
      'a.css-175oi2r.r-6koalj.r-eqz5dr.r-16y2uox.r-1habvwh.r-13qz1uu.r-rjfia.r-1ny4l3l.r-1loqt21',
    ];

    function fixPremiumLabels(root: Element): void {
      for (const el of findIn(root, 'span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-1tl8opc, [data-testid="premium-hub-tab"] span')) {
        const text = el.textContent ?? '';
        if (!text.includes('プレミアム')) continue;
        // Tabs may be user-named, so there only a tab that is just the brand name
        // (e.g. the "プレミアム" entry in the settings navigation) is replaced.
        const isBrandTab = !!el.closest('[role="tablist"]') &&
          /^X?プレミアム(プラス)?$/.test(text) && !isUserContent(el);
        if (!isChrome(el) && !isBrandTab) continue;

        // Only touch the brand name itself, never a stray "X" or "プラス".
        replaceText(el, (value) => value
          .replaceAll('Xプレミアム', 'プレミアム')
          .replaceAll('プレミアムプラス', 'Twitter Blue+')
          .replaceAll('プレミアム', 'Twitter Blue'));

        // Replace sidebar icon to Twitter bird
        for (const sidebarSelector of PREMIUM_SIDEBAR_SELECTORS) {
          const parentLink = el.closest(sidebarSelector);
          if (parentLink?.getAttribute('aria-label') === 'プレミアム') {
            el.parentElement?.parentElement
              ?.querySelectorAll('path')
              .forEach((path) => path.setAttribute('d', SIDEBAR_BIRD_PATH));
          }
        }
      }
    }

    // ─── Hide Premium Sidebar Link ───────────────────────────────────────

    function hidePremiumLink(root: Element): void {
      for (const container of findIn(root,
        '.css-4rbku5.css-18t94o4.css-1dbjc4n.r-1habvwh.r-1loqt21.r-6koalj.r-eqz5dr.r-16y2uox.r-1ny4l3l.r-oyd9sg.r-13qz1uu',
      )) {
        if (container.getAttribute('aria-label') === 'プレミアム') {
          (container as HTMLElement).style.display = 'none';
        }
      }
    }

    // ─── Fix Post Count Text ─────────────────────────────────────────────

    function fixPostCountText(root: Element): void {
      // Profile header count ("751 件のポスト"). The text sits directly in a div,
      // so match loosely on classes and strictly on the text itself.
      for (const el of findIn(root, 'div.css-146c3p1.r-dnmrzs.r-1udh08x.r-3s2u2q')) {
        if (el.childElementCount > 0) continue;
        replaceText(el, (text) => text.replace(/^(\d[\d,.]*\s*[万億KMB]?\s*)件のポスト$/, '$1件のツイート'));
      }
    }

    // ─── Fix X Corp → Twitter Inc. ───────────────────────────────────────

    function fixCorpText(root: Element): void {
      for (const el of findIn(root, '.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-1tl8opc')) {
        if (!isChrome(el)) continue;
        replaceText(el, (text) => text.replaceAll(' X Corp.', ` Twitter Inc.\nBridder v${BRIDDER_VERSION}`));
      }
    }

    // ─── Fix Draft Placeholder ───────────────────────────────────────────

    function fixDraftPlaceholder(root: Element): void {
      for (const el of findIn(root, '.public-DraftEditorPlaceholder-inner')) {
        replaceText(el, (text) => text.replaceAll('ポスト', 'ツイート'));
      }
    }

    // ─── Fix Trend Post Count ────────────────────────────────────────────

    function fixTrendPostCount(root: Element): void {
      // A root inside a trend cell (in-place text update) must still be handled.
      const containers = new Set(findIn(root, TREND_SELECTOR));
      const parent = root.closest(TREND_SELECTOR);
      if (parent) containers.add(parent);

      for (const container of containers) {
        for (const span of container.querySelectorAll('span')) {
          if (span.childElementCount > 0) continue;
          // Only the count line ("1,388件のポスト" / "12.3K posts"), never the trend name.
          replaceText(span, (text) => text
            .replace(/(\d[\d,.]*\s*[万億KMB]?\s*)件のポスト$/, '$1件のツイート')
            .replace(/^(\d[\d,.]*[KMB]?) posts$/, '$1 件のツイート'));
        }
      }
    }

    // ─── Main Text Replacement ───────────────────────────────────────────

    function fixGeneralText(root: Element): void {
      for (const el of findIn(root,
        'span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-1tl8opc',
      )) {
        if (shouldSkipElement(el)) continue;

        // Tabs can be user-named (pinned lists, communities): exact matches only.
        const exactOnly = !!el.closest('[role="tablist"]');

        replaceText(el, (original) => {
          const exactMatch = EXACT_REPLACEMENTS.get(original);
          if (exactMatch) return exactMatch;
          if (exactOnly) return original;

          let text = original.replace(X_BRAND_PATTERN, 'Twitter');
          for (const [from, to] of SUBSTRING_REPLACEMENTS) {
            text = text.replaceAll(from, to);
          }
          return text;
        });
      }
    }

    // ─── Standalone Post Labels ─────────────────────────────────────────

    /** Whole-node labels that are safe to replace anywhere outside user content. */
    const STANDALONE_LABELS: ReadonlyMap<string, string> = new Map([
      ['ポスト', 'ツイート'],
      ['おすすめ投稿', 'おすすめツイート'],
      ['最も人気のある投稿', '最も人気のあるツイート'],
    ]);

    function fixPostLabels(root: Element): void {
      // Action labels can live inside an article, activeRoute or a heading, which
      // the general pass skips. Still leave user-authored text untouched.
      const selector = 'span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-1tl8opc, [role="heading"]';
      const targets = new Set(findIn(root, selector));
      // A text node updated in place inside a heading arrives as a root below it.
      const heading = root.closest('[role="heading"]');
      if (heading) targets.add(heading);

      for (const el of targets) {
        if (isUserContent(el) || el.closest(TREND_SELECTOR)) continue;
        const isTimelineHeading = el.matches('[role="heading"]') && !el.closest('article');
        replaceText(el, (text) => {
          const label = STANDALONE_LABELS.get(text);
          if (label) return label;
          // Profile timeline heading: "<name>さんのポスト". Only the suffix is UI.
          return isTimelineHeading ? text.replace(/さんのポスト$/, 'さんのツイート') : text;
        });
      }
    }

    // ─── New UI (Tailwind-based surfaces) ────────────────────────────────

    /**
     * X is migrating some surfaces (premium sign-up, chat, logged-out pages) to a
     * new UI without the react-native-web classes or data-testids the passes
     * above rely on. User content cannot be told apart there, so only whole-node
     * matches of known UI labels are replaced.
     */
    const NEW_UI_LABELS: ReadonlyMap<string, string> = new Map([
      ['ポスト', 'ツイート'],
      ['リポスト', 'リツイート'],
      ['ポストする', 'ツイートする'],
      ['ポストを編集', 'ツイートを編集'],
      ['より長いポストを作成', 'より長いツイートを作成'],
      ['より長い動画をポスト', 'より長い動画をツイート'],
      ['投稿して報酬を得る', 'ツイートして報酬を得る'],
      ['投稿上限の引き上げ', 'ツイート上限の引き上げ'],
      ['プレミアムチェックマーク', 'Twitter Blueチェックマーク'],
      ['おすすめ投稿', 'おすすめツイート'],
      ['最も人気のある投稿', '最も人気のあるツイート'],
      ['ポストを送信しました', 'ツイートを送信しました'],
    ]);

    /** Plan names are ordinary words, so only replace them inside a dialog. */
    const NEW_UI_DIALOG_LABELS: ReadonlyMap<string, string> = new Map([
      ['Premium', 'Twitter Blue'],
      ['Premium+', 'Twitter Blue+'],
      [
        'Premiumのすべての機能に加え、以下の特典を利用できます:',
        'Twitter Blueのすべての機能に加え、以下の特典を利用できます:',
      ],
    ]);

    function fixNewUiLabels(root: Node): void {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const original = node.nodeValue ?? '';
        const inDialogOnly = NEW_UI_DIALOG_LABELS.get(original);
        const replacement = NEW_UI_LABELS.get(original) ?? inDialogOnly;
        if (!replacement) continue;

        const parent = node.parentElement;
        if (!parent || isUserContent(parent)) continue;
        // Old-UI elements are handled (and guarded) by the passes above.
        if (/(^|\s)css-/.test(parent.getAttribute('class') ?? '')) continue;
        if (parent.closest('article, script, style, noscript')) continue;
        if (!NEW_UI_LABELS.has(original) && !parent.closest('[role="dialog"]')) continue;

        node.nodeValue = replacement;
      }
    }

    // ─── Shadow DOM (chat) ───────────────────────────────────────────────

    /**
     * The chat (DM) screen renders inside open shadow roots, which neither
     * querySelectorAll nor the body observer can see into. It is new UI, so only
     * the whole-node label pass applies there.
     */
    const SHADOW_HOST_SELECTOR = '[data-testid="xchatEmbedRoute"], [data-testid="xchatEmbedOverlays"]';
    const observedShadowRoots = new WeakSet<ShadowRoot>();

    function watchShadowRoots(): void {
      for (const host of document.querySelectorAll(SHADOW_HOST_SELECTOR)) {
        const shadow = host.shadowRoot;
        if (!shadow || observedShadowRoots.has(shadow)) continue;
        observedShadowRoots.add(shadow);

        fixNewUiLabels(shadow);
        // Our own edits re-enter here once and then no longer match a label.
        new MutationObserver((records) => {
          for (const record of records) {
            if (record.type === 'characterData') {
              if (record.target.parentNode) fixNewUiLabels(record.target.parentNode);
              continue;
            }
            for (const node of record.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) fixNewUiLabels(node);
              else if (node.parentNode) fixNewUiLabels(node.parentNode);
            }
          }
        }).observe(shadow, { childList: true, characterData: true, subtree: true });
      }
    }

    // ─── Orchestrator ────────────────────────────────────────────────────

    function fixText(root: Element): void {
      hidePremiumLink(root);
      fixPostCountText(root);
      fixCorpText(root);
      fixDraftPlaceholder(root);
      fixTrendPostCount(root);
      fixPremiumLabels(root);
      fixGeneralText(root);
      fixPostLabels(root);
      fixNewUiLabels(root);
    }

    function fixTitle(): void {
      const title = document.title;

      if (title === 'X') {
        document.title = 'Twitter';
        return;
      }

      let newTitle = title;
      if (newTitle.includes('/ X')) newTitle = newTitle.replace('/ X', '/ Twitter');
      if (newTitle.includes('ポスト / ')) newTitle = newTitle.replace('ポスト / ', 'ツイート / ');
      if (newTitle.includes('Xユーザーの')) {
        newTitle = newTitle
          .replace('さん: ', 'さんはTwitterを利用しています: ')
          .replace('Xユーザーの', '');
      }

      if (newTitle !== title) document.title = newTitle;
    }

    // ─── Initialize ──────────────────────────────────────────────────────

    loadSettings<{ text_mode: boolean }>(['text_mode'], (settings) => {
      if (!settings.text_mode) return;

      // Process inserted subtrees and text nodes updated in place by React.
      // Disconnect while editing so our own text changes don't schedule another pass.
      const observer = new MutationObserver((records) => {
        const roots = new Set<Element>();
        for (const record of records) {
          if (record.type === 'characterData' && record.target.parentElement) {
            roots.add(record.target.parentElement);
          }
          for (const node of record.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) roots.add(node as Element);
            else if (node.nodeType === Node.TEXT_NODE && node.parentElement) roots.add(node.parentElement);
          }
        }
        observer.disconnect();
        try {
          for (const root of roots) {
            if (!root.isConnected) continue;
            if ([...roots].some((other) => other !== root && other.contains(root))) continue;
            fixText(root);
          }
          // The shadow root can be attached after its host was inserted.
          watchShadowRoots();
        } finally {
          observer.observe(document.body, { childList: true, characterData: true, subtree: true });
        }
      });
      fixText(document.body);
      watchShadowRoots();
      observer.observe(document.body, { childList: true, characterData: true, subtree: true });

      new MutationObserver(fixTitle).observe(
        document.querySelector('title') ?? document.body,
        { childList: true, subtree: true },
      );
      fixTitle();
    });
  },
});
