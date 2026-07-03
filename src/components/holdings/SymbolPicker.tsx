"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UniverseSymbol } from "@/types/universe";

type SymbolPickerProps = {
  symbols: UniverseSymbol[];
  loading: boolean;
  value: string;
  onChange: (symbol: string) => void;
  disabled?: boolean;
};

export function SymbolPicker({
  symbols,
  loading,
  value,
  onChange,
  disabled,
}: SymbolPickerProps) {
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toUpperCase();
    if (!q) return symbols;
    return symbols.filter(
      (s) =>
        s.symbol.toUpperCase().includes(q) ||
        s.name.toUpperCase().includes(q),
    );
  }, [symbols, filter]);

  const selected = symbols.find((s) => s.symbol === value);

  function pick(symbol: string) {
    onChange(symbol);
    setFilter("");
    setOpen(false);
  }

  return (
    <div className="relative flex flex-col gap-2">
      <Label htmlFor="symbol-picker">Symbol</Label>
      {selected && !open ? (
        <button
          type="button"
          id="symbol-picker"
          className="flex min-h-11 w-full items-center justify-between rounded-lg border border-input px-2.5 text-left text-base disabled:opacity-50 md:text-sm"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled || loading}
        >
          <span>
            <span className="font-medium">{selected.symbol}</span>
            <span className="ml-2 text-muted-foreground">{selected.name}</span>
          </span>
          <span className="text-muted-foreground">Change</span>
        </button>
      ) : (
        <Input
          id="symbol-picker"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          className="min-h-11 uppercase"
          placeholder={loading ? "Loading symbols…" : "Search symbol or name"}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setOpen(true);
            onChange("");
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled || loading}
        />
      )}
      {open && !loading && (
        <ul
          className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-sm"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {symbols.length === 0
                ? "Symbol universe not loaded — run npm run seed:universe for this Firebase project"
                : "No matching symbols"}
            </li>
          ) : (
            filtered.slice(0, 50).map((s) => (
              <li key={s.symbol}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === s.symbol}
                  className="flex w-full min-h-11 items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => pick(s.symbol)}
                >
                  <span className="font-medium">{s.symbol}</span>
                  <span className="truncate text-muted-foreground">{s.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
