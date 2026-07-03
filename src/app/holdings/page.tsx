"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useHoldings } from "@/hooks/useHoldings";
import { normalizeSymbol } from "@/lib/symbols";

function HoldingsContent() {
  const { user } = useAuth();
  const { holdings, loading, error, add, update, remove, atLimit, retry } =
    useHoldings(user?.uid);

  const [symbolInput, setSymbolInput] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [lastAddedSymbol, setLastAddedSymbol] = useState<string | null>(null);
  const [draftShares, setDraftShares] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const h of holdings) {
      next[h.symbol] = String(h.shares);
    }
    setDraftShares(next);
  }, [holdings]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setLastAddedSymbol(null);
    setAdding(true);

    const shares = parseInt(sharesInput, 10);
    if (Number.isNaN(shares) || shares < 1) {
      setAddError("Shares must be at least 1");
      setAdding(false);
      return;
    }

    try {
      await add(symbolInput, shares);
      const symbol = normalizeSymbol(symbolInput);
      setSymbolInput("");
      setSharesInput("");
      setLastAddedSymbol(symbol);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add holding");
    } finally {
      setAdding(false);
    }
  }

  async function saveShares(symbol: string) {
    const raw = draftShares[symbol] ?? "";
    const shares = parseInt(raw, 10);
    const holding = holdings.find((h) => h.symbol === symbol);
    if (!holding) return;

    if (Number.isNaN(shares) || shares < 1) {
      setRowErrors((prev) => ({
        ...prev,
        [symbol]: "Shares must be at least 1",
      }));
      setDraftShares((prev) => ({ ...prev, [symbol]: String(holding.shares) }));
      return;
    }

    if (holding.shares === shares) return;

    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });

    try {
      await update(symbol, shares);
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [symbol]: err instanceof Error ? err.message : "Failed to update",
      }));
      setDraftShares((prev) => ({ ...prev, [symbol]: String(holding.shares) }));
    }
  }

  async function handleDelete(symbol: string) {
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
    if (lastAddedSymbol === symbol) setLastAddedSymbol(null);

    try {
      await remove(symbol);
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [symbol]: err instanceof Error ? err.message : "Failed to delete",
      }));
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
        <Button variant="outline" className="min-h-11" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/user"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Holdings</h1>
      </header>

      {holdings.length === 0 ? (
        <p className="text-muted-foreground">
          Add your first holding to start tracking your portfolio.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {holdings.map((holding) => (
            <li
              key={holding.symbol}
              className="flex flex-col gap-2 rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{holding.symbol}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 shrink-0"
                  onClick={() => handleDelete(holding.symbol)}
                >
                  Delete
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`shares-${holding.symbol}`}>Shares</Label>
                <Input
                  id={`shares-${holding.symbol}`}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  className="min-h-11"
                  value={draftShares[holding.symbol] ?? String(holding.shares)}
                  onChange={(e) =>
                    setDraftShares((prev) => ({
                      ...prev,
                      [holding.symbol]: e.target.value,
                    }))
                  }
                  onBlur={() => saveShares(holding.symbol)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                />
                {rowErrors[holding.symbol] && (
                  <p className="text-sm text-destructive" role="alert">
                    {rowErrors[holding.symbol]}
                  </p>
                )}
              </div>
              {lastAddedSymbol === holding.symbol && (
                <p className="text-sm text-muted-foreground">
                  Quote data available after next market close
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-lg font-medium">Add holding</h2>
        {atLimit ? (
          <p className="text-sm text-muted-foreground">Maximum 25 symbols</p>
        ) : (
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-symbol">Symbol</Label>
              <Input
                id="add-symbol"
                type="text"
                autoCapitalize="characters"
                autoComplete="off"
                className="min-h-11 uppercase"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value)}
                onBlur={() => setSymbolInput(normalizeSymbol(symbolInput))}
                disabled={adding}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-shares">Shares</Label>
              <Input
                id="add-shares"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                className="min-h-11"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                disabled={adding}
              />
            </div>
            {addError && (
              <p className="text-sm text-destructive" role="alert">
                {addError}
              </p>
            )}
            <Button type="submit" className="min-h-11 w-full" disabled={adding}>
              {adding ? "Adding…" : "Add"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}

export default function HoldingsPage() {
  return (
    <RequireAuth>
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 py-6">
        <HoldingsContent />
      </div>
    </RequireAuth>
  );
}
