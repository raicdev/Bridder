import { observeDOM, loadSettings, getCookie } from '@/utils/dom';

export default defineContentScript({
  matches: ['https://twitter.com/*', 'https://x.com/*'],
  runAt: 'document_idle',
  main() {
    'use strict';

    let lastTweetId = '';
    let lastSource = '';
    let lastRequestedTweetId = '';

    // ─── Tweet Source API ────────────────────────────────────────────────

    const TWEET_DETAIL_URL = '/i/api/graphql/zoF7_t363wZyzylk-BLfZQ/TweetDetail';
    const BEARER_TOKEN = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

    /** Builds the GraphQL query URL for fetching tweet details. */
    function buildQueryURL(tweetId: string): string {
      const variables = JSON.stringify({
        focalTweetId: tweetId,
        referrer: 'home',
        controller_data: 'DAACDAABDAABCgABAAAAAAAAAAAKAAoAAAGg4hOi7AgACwAAAAAPAAwDAAAAKAUAAABgAAAAAAABAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAQEAKABEU0SNfMCRLMwAAAAA=',
        with_rux_injections: false,
        rankingMode: 'Relevance',
        includePromotedContent: true,
        withCommunity: true,
        withQuickPromoteEligibilityTweetFields: true,
        withBirdwatchNotes: true,
        withVoice: true,
      });

      const features = JSON.stringify({
        rweb_video_screen_enabled: false,
        rweb_cashtags_enabled: true,
        profile_label_improvements_pcf_label_in_post_enabled: true,
        responsive_web_profile_redirect_enabled: true,
        rweb_tipjar_consumption_enabled: false,
        verified_phone_label_enabled: false,
        creator_subscriptions_tweet_preview_api_enabled: true,
        responsive_web_graphql_timeline_navigation_enabled: true,
        premium_content_api_read_enabled: false,
        communities_web_enable_tweet_community_results_fetch: true,
        c9s_tweet_anatomy_moderator_badge_enabled: true,
        responsive_web_grok_analyze_button_fetch_trends_enabled: false,
        responsive_web_grok_analyze_post_followups_enabled: true,
        rweb_cashtags_composer_attachment_enabled: true,
        responsive_web_jetfuel_frame: true,
        rweb_sports_post_context_enabled: true,
        responsive_web_grok_share_attachment_enabled: true,
        responsive_web_grok_annotations_enabled: true,
        articles_preview_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        rweb_conversational_replies_downvote_enabled: false,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: true,
        content_disclosure_indicator_enabled: true,
        content_disclosure_ai_generated_indicator_enabled: true,
        responsive_web_grok_show_grok_translated_post: true,
        responsive_web_grok_analysis_button_from_backend: true,
        post_ctas_fetch_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: false,
        responsive_web_nested_quote_preview_enabled: true,
        responsive_web_grok_image_annotation_enabled: true,
        responsive_web_grok_imagine_annotation_enabled: true,
        responsive_web_grok_community_note_auto_translation_is_enabled: true,
        responsive_web_enhance_cards_enabled: false,
      });
      const fieldToggles = JSON.stringify({
        withPayments: false,
        withArticleRichContentState: true,
        withArticlePlainText: false,
        withArticleSummaryText: true,
        withArticleVoiceOver: true,
        withGrokAnalyze: false,
        withDisallowedReplyControls: false,
      });

      return `${TWEET_DETAIL_URL}?variables=${encodeURIComponent(variables)}&features=${encodeURIComponent(features)}&fieldToggles=${encodeURIComponent(fieldToggles)}`;
    }

    /** Fetches the tweet source label from the Twitter GraphQL API. */
    async function fetchTweetSource(tweetId: string): Promise<void> {
      const url = buildQueryURL(tweetId);
      const csrfToken = getCookie('ct0');
      const headers: Record<string, string> = {
        authorization: BEARER_TOKEN,
        'x-csrf-token': csrfToken,
        'x-twitter-active-user': 'yes',
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-client-language': 'ja',
      };

      try {
        const response = await fetch(url, {
          headers,
          credentials: 'include',
        });

        if (!response.ok) return;

        const data = await response.json();
        const instructions = data?.data?.threaded_conversation_with_injections_v2?.instructions;
        if (!instructions) return;

        for (const instruction of instructions) {
          if (instruction.type !== 'TimelineAddEntries') continue;

          for (const entry of instruction.entries) {
            if (
              entry.content?.entryType !== 'TimelineTimelineItem' ||
              entry.entryId !== `tweet-${tweetId}`
            ) {
              continue;
            }

            const tweetResults = entry.content.itemContent?.tweet_results?.result;
            const source = tweetResults?.tweet?.source ?? tweetResults?.legacy?.source ?? tweetResults?.source;
            if (source && extractTweetId() === tweetId) {
              lastSource = String(source);
              showLabel(lastSource);
            }
            return;
          }
        }
      } catch {
        // Silently fail — the source label is a non-critical enhancement
      }
    }

    // ─── Label Display ───────────────────────────────────────────────────

    /** Extracts the source label text from an HTML string (e.g. `<a href="...">Twitter for iPhone</a>`). */
    function extractSourceText(sourceHtml: string): string {
      const template = document.createElement('template');
      template.innerHTML = sourceHtml;
      return template.content.querySelector('a')?.textContent ?? '';
    }

    /** Locate the timestamp/view-count row on the tweet detail page. */
    function getLabelField(): Element | null {
      const tweetId = extractTweetId();
      if (!tweetId) return null;
      const time = document.querySelector(`a[href$="/status/${tweetId}"] time`);
      return time?.closest('div.r-1d09ksm.r-18u37iz.r-1wbh5a2.r-1471scf') ?? null;
    }

    /** Renders the tweet source label into the tweet detail view. */
    function showLabel(sourceHtml: string): void {
      const labelField = getLabelField();
      if (!labelField || labelField.querySelector('#RTSL_base')) return;

      const sourceText = extractSourceText(sourceHtml);
      if (!sourceText) return;

      // Match X's timestamp and separator markup so font, spacing and theme agree.
      const base = document.createElement('span');
      base.id = 'RTSL_base';
      base.style.display = 'contents';

      const timestamp = labelField.querySelector('time');
      const color = timestamp ? getComputedStyle(timestamp).color : 'inherit';
      const dotWrapper = document.createElement('div');
      dotWrapper.dir = 'ltr';
      dotWrapper.setAttribute('aria-hidden', 'true');
      dotWrapper.className = 'css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc r-a023e6 r-rjixqe r-16dba41 r-1q142lx r-n7gxbd';
      dotWrapper.style.color = color;
      const dot = document.createElement('span');
      dot.className = 'css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc';
      dot.textContent = '·';
      dotWrapper.appendChild(dot);
      base.appendChild(dotWrapper);

      const sourceWrapper = document.createElement('div');
      sourceWrapper.dir = 'ltr';
      sourceWrapper.className = 'css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc r-a023e6 r-rjixqe r-16dba41';
      sourceWrapper.style.color = color;
      const link = document.createElement('a');
      link.href = 'https://help.twitter.com/using-twitter/how-to-tweet#source-labels';
      link.rel = 'noopener noreferrer nofollow';
      link.target = '_blank';
      link.setAttribute('role', 'link');
      link.className = 'css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc r-xoduu5 r-1q142lx r-1w6e6rj r-9aw3ui r-3s2u2q r-1loqt21';
      link.style.color = color;
      const text = document.createElement('span');
      text.className = 'css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc';
      text.textContent = sourceText;
      link.appendChild(text);
      sourceWrapper.appendChild(link);
      base.appendChild(sourceWrapper);
      labelField.appendChild(base);
    }

    // ─── URL Parsing ─────────────────────────────────────────────────────

    /** Extracts the tweet status ID from the current URL, or `null` if not on a tweet page. */
    function extractTweetId(): string | null {
      const url = location.href;
      const statusIndex = url.indexOf('status/');
      if (statusIndex < 0) return null;

      const afterStatus = url.substring(statusIndex + 7);
      // Extract digits only (stop at ? or / or end of string)
      const match = afterStatus.match(/^(\d+)/);
      return match?.[1] ?? null;
    }

    // ─── Mutation Callback ───────────────────────────────────────────────

    function returnTweetLabel(): void {
      const tweetId = extractTweetId();
      if (!tweetId) {
        lastTweetId = '';
        lastSource = '';
        lastRequestedTweetId = '';
        return;
      }
      if (tweetId !== lastTweetId) {
        lastTweetId = tweetId;
        lastSource = '';
        lastRequestedTweetId = '';
      }
      // Wait for the detail row, rather than a timeline preview of the same tweet.
      if (!getLabelField()) return;
      if (lastSource) {
        showLabel(lastSource); // X may have remounted the detail row.
      } else if (lastRequestedTweetId !== tweetId) {
        // Fetch once per visit; a missing row no longer marks it as fetched.
        lastRequestedTweetId = tweetId;
        fetchTweetSource(tweetId);
      }
    }

    // ─── Initialize ──────────────────────────────────────────────────────

    loadSettings<{ tweetSourceLabel: boolean }>(['tweetSourceLabel'], (settings) => {
      if (!settings.tweetSourceLabel) return;
      observeDOM(returnTweetLabel);
    });
  },
});
