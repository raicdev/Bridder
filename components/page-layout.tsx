import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ThemeMenu } from "@/components/theme-menu";

export function Brand() {
  return (
    <span className="inline-flex items-center gap-3 text-lg font-bold tracking-tight text-foreground">
      <img
        src="/blue-bird.png"
        alt=""
        className="size-9 rounded-xl bg-secondary p-1.5"
      />
      Bridder
    </span>
  );
}

export function PageLayout({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div
        className={`mx-auto px-5 pt-9 pb-20 sm:px-8 ${narrow ? "max-w-4xl" : "max-w-6xl"}`}
      >
        <header className="mb-10 flex items-center justify-between gap-4">
          <Brand />
          <ThemeMenu />
        </header>
        {children}
      </div>
    </div>
  );
}

export function NewsCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-2 px-6 py-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm leading-7 text-muted-foreground">{children}</p>
    </Card>
  );
}
