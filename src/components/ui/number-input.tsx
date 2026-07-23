"use client";

/**
 * Input numérico simples com a mesma cara dos outros campos do form
 * (mesmas classes do CurrencyInput) — evita a caixinha de setinhas e o
 * radius diferente que o InputNumber do AntD traz por padrão.
 */
export function NumberInput({
  value,
  onChange,
  placeholder,
  step,
  suffix,
}: {
  value?: number | null;
  onChange?: (value: number | null) => void;
  placeholder?: string;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step ?? 1}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange?.(raw === "" ? null : Number(raw));
        }}
        placeholder={placeholder}
        className={`h-[34px] w-full rounded-sm border border-border bg-surface px-3 text-sm text-foreground-strong outline-none transition-colors placeholder:text-foreground-muted hover:border-accent focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${suffix ? "pr-9" : ""}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-foreground-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}
