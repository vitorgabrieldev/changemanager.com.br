"use client";

import { useState, type KeyboardEvent, type ClipboardEvent } from "react";

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const NAVIGATION_KEYS = [
  "Tab",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "Enter",
  "Escape",
];

/**
 * Máscara "de banco": os dígitos digitados entram sempre pela direita
 * (casas decimais), empurrando o valor para a esquerda a cada tecla.
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value?: number | null;
  onChange?: (value: number | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [cents, setCents] = useState(() => Math.round((value ?? 0) * 100));
  const [syncedValue, setSyncedValue] = useState(value);

  // Sincroniza durante o render (em vez de useEffect) quando o `value`
  // externo muda — evita o cascading render do react-hooks/set-state-in-effect.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setCents(Math.round((value ?? 0) * 100));
  }

  function emit(nextCents: number) {
    setCents(nextCents);
    onChange?.(nextCents === 0 ? null : nextCents / 100);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey || e.metaKey || NAVIGATION_KEYS.includes(e.key)) return;

    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const next = cents * 10 + Number(e.key);
      if (next <= Number.MAX_SAFE_INTEGER) emit(next);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      emit(Math.floor(cents / 10));
      return;
    }

    e.preventDefault();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    emit(Number(digits.slice(-15)));
  }

  return (
    <input
      inputMode="numeric"
      value={cents === 0 ? "" : formatter.format(cents / 100)}
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onChange={() => {}}
      className={`h-[34px] w-full rounded-sm border border-border bg-surface px-3 text-sm text-foreground-strong outline-none transition-colors placeholder:text-foreground-muted hover:border-accent focus:border-accent ${className ?? ""}`}
    />
  );
}
