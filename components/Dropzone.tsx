"use client";

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onText: (text: string, fileName: string) => void;
  children?: (openFile: () => void) => React.ReactNode;
};

export function Dropzone({ onText, children }: Props) {
  const onDrop = useCallback(
    async (ev: React.DragEvent<HTMLDivElement>) => {
      ev.preventDefault();
      const file = ev.dataTransfer.files?.[0];
      if (!file) return;
      const text = await file.text();
      onText(text, file.name);
    },
    [onText]
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPick = useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      onText(text, file.name);
    },
    [onText]
  );

  const containerClass = children
    ? "rounded-lg p-0 text-left"
    : [
        "rounded-2xl p-8 md:p-10 text-center cursor-pointer transition-all",
        // Clean, subtle gradient that works in light/dark
        "bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950",
        // Soft border and depth
        "border border-zinc-200/70 dark:border-zinc-700/60 shadow-sm hover:shadow-md",
      ].join(" ");

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={containerClass}
    >
      {typeof children === "function" ? (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onPick}
            className="hidden"
          />
          {children(() => inputRef.current?.click?.())}
        </div>
      ) : (
        <>
          <p className="mb-4">Släpp din Shopify CSV här eller välj fil</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onPick}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            Välj fil
          </Button>
        </>
      )}
    </div>
  );
}
