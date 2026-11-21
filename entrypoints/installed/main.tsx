import { createRoot } from "react-dom/client";
import { ArrowRight } from "lucide-react";
import "@/assets/style.css";
import { PageLayout, NewsCard } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <PageLayout narrow>
      <div className="mb-7 rounded-2xl border bg-card p-8">
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          インストールありがとうございます！
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Xをもっと快適に。好みに合わせて機能をカスタマイズできます。
        </p>
        <Button
          className="mt-6"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          設定を開く <ArrowRight />
        </Button>
      </div>
      <h2 className="mb-4 text-lg font-semibold">Bridderの機能</h2>
      <div className="space-y-3">
        <NewsCard title="テキストモード/アイコンモード">
          「X」から「Twitter」に名称を戻します
        </NewsCard>
        <NewsCard title="邪魔なものの削除">
          「認証される」やサイドバーのプレミアム登録、クリエイタースタジオ、Grokなどを削除できます
        </NewsCard>
        <NewsCard title="その他の改善">
          ポスト通知の画面から通知のアカウントを変えれます
        </NewsCard>
      </div>
    </PageLayout>
  </ThemeProvider>,
);
