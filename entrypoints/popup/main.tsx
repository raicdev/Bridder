import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings2 } from 'lucide-react';
import '@/assets/style.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Brand } from '@/components/page-layout';
import { ThemeMenu } from '@/components/theme-menu';
import { ThemeProvider } from '@/components/theme-provider';

function Popup() {
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const [reload, setReload] = useState(false);
  useEffect(() => {
    chrome.storage.sync.get<{ enabled?: boolean }>('enabled').then(({ enabled: saved }) => { setEnabled(saved ?? true); setReady(true); });
  }, []);
  function toggle(checked: boolean) {
    setEnabled(checked);
    chrome.storage.sync.set({ enabled: checked });
    setReload(true);
  }
  return <main className="w-[320px] bg-background p-5">
    <header className="flex items-center justify-between"><Brand /><ThemeMenu /></header>
    <Card className="mt-6 flex-row items-center justify-between gap-0 p-5">
      <label htmlFor="enabled" className="text-sm font-semibold">拡張機能 <span className="ml-1 text-xs text-muted-foreground">{enabled ? '有効' : '無効'}</span></label>
      <Switch id="enabled" checked={enabled} disabled={!ready} onCheckedChange={toggle} aria-label="拡張機能を切り替え" />
    </Card>

    {reload && <div className="mt-3 rounded-lg border bg-muted p-3 text-xs text-muted-foreground">変更を反映するには <button type="button" className="font-semibold underline" onClick={() => chrome.tabs.reload()}>ページを再読み込み</button></div>}
    <Button variant="outline" className="mt-4 w-full" onClick={() => chrome.runtime.openOptionsPage()}><Settings2 /> 設定を開く</Button>
  </main>;
}

createRoot(document.getElementById('root')!).render(<ThemeProvider><Popup /></ThemeProvider>);
