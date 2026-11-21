import { createRoot } from 'react-dom/client';
import '@/assets/style.css';
import { PageLayout, NewsCard } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import { applyDefaultSettings } from '@/utils/settings_data';

const oldVersion = new URL(location.href).searchParams.get('old_version');

createRoot(document.getElementById('root')!).render(<ThemeProvider><PageLayout narrow>
  <div className="mb-7 rounded-2xl border bg-card p-8">
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Bridderが更新されました！</h1>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">{oldVersion && `バージョン ${oldVersion} から`}最新版にアップデートしました。<br />一部の機能が使えない場合は、設定の初期化をお試しください。</p>
    <Button className="mt-6" onClick={() => { if (confirm('設定を初期化しますか？現在の設定は失われます。')) { applyDefaultSettings(); chrome.runtime.openOptionsPage(); } }}>設定を初期化</Button>
  </div>
  <h2 className="mb-4 text-lg font-semibold">アップデート内容</h2>
  <div className="space-y-3">
    <NewsCard title="テキスト置き換えの修正">ツイート本文・ユーザー名・トレンド名など、ユーザーが書いた文章まで置き換わってしまう問題を修正しました。通知、プロフィール、チャット、サブスクリプション画面の置き換え漏れにも対応しています。</NewsCard>
    <NewsCard title="パフォーマンスの向上">テキストモード・ホワイトモード使用時のパフォーマンスを大幅に向上させました。</NewsCard>
    <NewsCard title="変更速度の向上">テキスト変更や要素の削除がより速くなりました。</NewsCard>
    <NewsCard title="機能フラグとの連携"><a className="underline underline-offset-4 hover:text-muted-foreground" href="https://chromewebstore.google.com/detail/x-twitter-feature-flags/phioeneleonlckednejcmajbkmhhiepm">X / Twitter Feature Flags</a> の Features メニューをもっと見るへ移動できるようになりました。</NewsCard>
    <NewsCard title="バグ修正">サイドバーが消える問題や、チェックマークの強制表示が誤作動する問題などを修正しました。</NewsCard>
  </div>
</PageLayout></ThemeProvider>);
