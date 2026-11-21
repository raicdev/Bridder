export interface Setting {
  id: string;
  name: string;
  type: "checkbox";
  category: string;
  description: string;
  default: boolean;
}

/** Writes all default settings to `chrome.storage.sync`. */
export function applyDefaultSettings(): void {
  const defaults: Record<string, boolean> = { enabled: true };

  for (const setting of settingsData) {
    defaults[setting.id] = setting.default;
  }

  chrome.storage.sync.set(defaults, () => {
    console.log("すべての設定がデフォルトに設定されました");
  });
}

export const settingsData: Setting[] = [
  // ── 表示 (Display) ──
  {
    id: "text_mode",
    name: "テキストの置き換え",
    type: "checkbox",
    category: "表示",
    description: "「ポスト」->「ツイート」みたいにテキストを置き換えます。",
    default: false,
  },
  {
    id: "icon_mode",
    name: "アイコンの置き換え",
    type: "checkbox",
    category: "表示",
    description: "XのロゴをTwitterの青い鳥に変更します。",
    default: true,
  },
  {
    id: "whitemode",
    name: "ホワイトモード",
    type: "checkbox",
    category: "表示",
    description: "Twitterの色をホワイトに変更します。",
    default: false,
  },
  {
    id: "removePremiumBanner",
    name: "プレミアムのバナーを削除",
    type: "checkbox",
    category: "表示",
    description: "右上にあるプレミアムにサブスクライブを削除します",
    default: true,
  },
  {
    id: "removeGetVerified",
    name: "認証されるを削除",
    type: "checkbox",
    category: "表示",
    description: "自分のプロフィールを開いた時の認証されるを削除します",
    default: true,
  },

  // ── チェックマーク (Checkmark) ──
  {
    id: "white_checkmark",
    name: "白いチェックマークを有効にする",
    type: "checkbox",
    category: "チェックマーク",
    description: "チェックマークを白色に変更します。(ダークテーマのみ)",
    default: true,
  },
  {
    id: "wc_org",
    name: "組織、政府アカウントも白にする",
    type: "checkbox",
    category: "チェックマーク",
    description:
      "組織(ゴールド)、政府(グレー)アカウントのチェックマークも白に変更します。",
    default: false,
  },
  {
    id: "verifiedBlue",
    name: "チェックマークをBlueのアイコンに変更",
    type: "checkbox",
    category: "チェックマーク",
    description:
      "Twitter BlueユーザーのチェックマークをBlueのアイコンに変更します。",
    default: false,
  },
  {
    id: "blue_delete",
    name: "チェックマークを削除する",
    type: "checkbox",
    category: "チェックマーク",
    description:
      "すべてのチェックマークを削除します。(バグが発生する可能性があります。)",
    default: false,
  },

  // ── サイドバーの改善 (Sidebar) ──
  {
    id: "sidebar_removePremium",
    name: "プレミアムを削除",
    type: "checkbox",
    category: "サイドバーの改善",
    description: "サイドバーのプレミアム(登録)と認証済み組織を削除します",
    default: true,
  },
  {
    id: "sidebar_removeGrok",
    name: "Grokを削除",
    type: "checkbox",
    category: "サイドバーの改善",
    description: "サイドバーのGrokリンクを非表示にします。",
    default: true,
  },
  {
    id: "sidebar_removeFollow",
    name: "フォローするを削除",
    type: "checkbox",
    category: "サイドバーの改善",
    description: "サイドバーの「フォローする」リンクを非表示にします。",
    default: true,
  },
  {
    id: "sidebar_removeCreatorStudio",
    name: "クリエイタースタジオを削除",
    type: "checkbox",
    category: "サイドバーの改善",
    description: "サイドバーの「クリエイタースタジオ」リンクを非表示にします。",
    default: true,
  },

  // ── 快適な使用 (Comfort) ──
  {
    id: "hideAds",
    name: "広告ポストを隠す",
    type: "checkbox",
    category: "快適な使用",
    description: "「広告」ラベルが付いたポストを非表示にします。",
    default: true,
  },
  {
    id: "hideTrend",
    name: "速報（トレンド）を隠す",
    type: "checkbox",
    category: "快適な使用",
    description: "サイドバーの「速報」やトレンドのセクションを隠します。",
    default: false,
  },
  {
    id: "hideRecommend",
    name: "おすすめタブを隠す",
    type: "checkbox",
    category: "快適な使用",
    description: "おすすめタブを削除し、デフォルトのタブをフォロー中にします。",
    default: false,
  },
  {
    id: "hideEngagement",
    name: "エンゲージメントを隠す",
    type: "checkbox",
    category: "快適な使用",
    description:
      "表示数(インプレッション)、いいね、リツイート、ブックマーク、返信の数を非表示にします。",
    default: false,
  },

  // ── その他 (Other) ──
  {
    id: "tweetSourceLabel",
    name: "ソースラベルを有効にする",
    type: "checkbox",
    category: "その他",
    description:
      "ポストが送信されたデバイス(Twitter for iPhoneなど)を確認するラベルを追加します。",
    default: true,
  },
  {
    id: "FeatureFlags",
    name: "機能メニューをもっと見るに移動",
    type: "checkbox",
    category: "その他",
    description:
      "X / Twitter Feature Flags のメニューをもっと見るに移動します。",
    default: false,
  },
  {
    id: "optimizeMore",
    name: "「もっと見る」を整理",
    type: "checkbox",
    category: "その他",
    description: "もっと見るから広告および収益化を削除します。",
    default: true,
  },
];
