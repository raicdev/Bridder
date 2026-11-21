import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/theme-provider';

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="表示テーマを変更" title="表示テーマ"><Sun className="size-4 dark:hidden" /><Moon className="hidden size-4 dark:block" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>表示テーマ</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
        <DropdownMenuRadioItem value="light"><Sun />ライト</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark"><Moon />ダーク</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system"><Monitor />システム設定</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
