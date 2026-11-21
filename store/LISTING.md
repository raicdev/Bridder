# Chrome ウェブストア掲載文（Bridder 2.3.1）

## 短い説明
Xの青い鳥アイコンや「ツイート」の表記を復活。投稿元ラベルや表示の整理も選べる拡張機能。

## 詳細説明
Bridderは、X（旧Twitter）の見た目を好みに合わせてカスタマイズする拡張機能です。x.comとtwitter.comで動作します。

主な機能：
- Xのロゴを青い鳥に変更
- 「ポスト」「リポスト」などの表示を「ツイート」「リツイート」に変更
- サイドバーの不要な項目や広告ポスト・プロモーションを非表示
- ダークテーマで認証済みチェックマークを白色に変更
- 投稿詳細ページに投稿元（Twitter Web Appなど）を表示

機能は設定画面から個別に切り替えられます。投稿元の取得にはXのAPIを使用します。BridderはXの公式拡張機能ではありません。

## 提出ファイル
- 拡張機能: `.output/bridder-2.3.1-chrome.zip`（`pnpm zip`で再生成）
- スクリーンショット（1280×800 PNG）: `store/screenshots/01-sidebar.png`、`store/screenshots/02-tweet.png`
- Small promo tile（440×280 PNG）: `store/promotional/small-tile.png`
- Marquee promo tile（1400×560 PNG）: `store/promotional/marquee-tile.png`
- アイコン: `public/blue-bird.png`（128×128 PNG、拡張機能ZIPに同梱）

スクリーンショットとプロモーション画像は提供された `scr-1.png` / `scr-2.png` と拡張機能アイコンを使用して合成したものです。再生成: `python scripts/make-store-screenshots.py`（Pillowが必要）。

## 権限とデータ利用の申告メモ
- `storage`: 各機能のオン・オフを `chrome.storage.sync` に保存。
- 対象サイト: `x.com` と `twitter.com`。表示変更、投稿元ラベル、広告の非表示のためページのDOMを読み取って変更。
- 投稿元ラベルが有効な場合、ログイン中のXへの同一サイトAPIリクエストを行う。取得したデータを開発者のサーバーへ送信しない。
- 開発者のサーバーへの解析・広告用通信は実装していない。X上の挙動に必要な処理以外に閲覧履歴を収集しない。
- 「単一目的」の説明: Xの表示を利用者の好みに合わせて変更する。

ストアのフォームのデータ取り扱いとプライバシーポリシーURLは、公開時に実態と照合して入力すること。`store/PRIVACY.md` を公開URLに置く。アカウントでの提出・審査は別途必要。
