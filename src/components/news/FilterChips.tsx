import { Button } from "@/components/ui/button";

type FilterChipsProps = {
  symbols: string[];
  selected: string | null;
  onSelect: (symbol: string | null) => void;
};

export function FilterChips({ symbols, selected, onSelect }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Button
        size="sm"
        className="shrink-0"
        variant={selected === null ? "secondary" : "ghost"}
        onClick={() => onSelect(null)}
      >
        All
      </Button>
      {symbols.map((sym) => (
        <Button
          key={sym}
          size="sm"
          className="shrink-0"
          variant={selected === sym ? "secondary" : "ghost"}
          onClick={() => onSelect(sym)}
        >
          {sym}
        </Button>
      ))}
    </div>
  );
}
