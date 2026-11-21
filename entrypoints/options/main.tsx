import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@/assets/style.css";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageLayout } from "@/components/page-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { settingsData } from "@/utils/settings_data";

const categories = [
  ...new Set(settingsData.map((setting) => setting.category)),
];
const dependents = ["white_checkmark", "wc_org", "verifiedBlue"] as const;
const defaults = Object.fromEntries(
  settingsData.map((setting) => [setting.id, setting.default]),
) as Record<string, boolean>;

function Options() {
  const [values, setValues] = useState<Record<string, boolean> | null>(null);
  useEffect(() => {
    let active = true;
    chrome.storage.sync.get<Record<string, boolean>>(Object.keys(defaults)).then((saved) => {
      if (active) setValues({ ...defaults, ...saved });
    });
    return () => {
      active = false;
    };
  }, []);

  function update(id: string, checked: boolean) {
    if (!values) return;
    const changes: Record<string, boolean> = { [id]: checked };
    if (id === "white_checkmark" && !checked) changes.wc_org = false;
    if (id === "blue_delete" && checked) {
      for (const dependent of dependents) changes[dependent] = false;
    }
    setValues({ ...values, ...changes });
    chrome.storage.sync.set(changes);
  }

  return (
    <PageLayout>
      <div className="mb-9">
        <h1 className="text-4xl font-bold tracking-tight">設定</h1>
      </div>
      <div className="grid items-start gap-8 md:grid-cols-[210px_minmax(0,1fr)]">
        <nav
          aria-label="設定カテゴリ"
          className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-3 shadow-sm md:sticky md:top-6 md:flex-col"
        >
          {categories.map((category, index) => (
            <a
              key={category}
              href={`#category-${index}`}
              className="shrink-0 rounded-lg px-3 py-2.5 my-1 text-sm font-medium text-muted-foreground bg-accent/50 hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {category}
            </a>
          ))}
        </nav>
        <main className="min-w-0 space-y-7">
          {categories.map((category, index) => {
            const settings = settingsData.filter(
              (setting) => setting.category === category,
            );
            return (
              <section
                id={`category-${index}`}
                key={category}
                className="scroll-mt-6"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-lg font-semibold">{category}</h2>
                  <span className="text-xs text-muted-foreground">
                    {settings.length} 件の設定
                  </span>
                </div>
                <Card className="gap-0 overflow-hidden py-0">
                  {settings.map((setting) => {
                    const disabled =
                      !values ||
                      (setting.id !== "blue_delete" &&
                        dependents.includes(
                          setting.id as (typeof dependents)[number],
                        ) &&
                        values.blue_delete) ||
                      (setting.id === "wc_org" && !values.white_checkmark);
                    return (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between gap-5 border-b px-5 py-5 last:border-b-0 hover:bg-accent/50"
                      >
                        <label
                          htmlFor={setting.id}
                          className={`min-w-0 flex-1 ${disabled ? "opacity-50" : "cursor-pointer"}`}
                        >
                          <span className="block text-sm font-semibold">
                            {setting.name}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {setting.description}
                          </span>
                        </label>
                        <Switch
                          id={setting.id}
                          aria-label={setting.name}
                          checked={values?.[setting.id] ?? false}
                          disabled={disabled}
                          onCheckedChange={(checked) =>
                            update(setting.id, checked)
                          }
                        />
                      </div>
                    );
                  })}
                </Card>
              </section>
            );
          })}
        </main>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        変更を反映するには、Xのページを再読み込みしてください。
      </p>
    </PageLayout>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <Options />
  </ThemeProvider>,
);
