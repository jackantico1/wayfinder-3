import { useEffect, useId, useRef, useState } from "react";
import { Plane } from "lucide-react";
import { findAirport, searchAirports, type Airport } from "../data/airports";

interface AirportComboboxProps {
  value: string;
  onChange: (code: string) => void;
}

function airportLabel(airport: Airport): string {
  return `${airport.city}, ${airport.state} (${airport.code})`;
}

export default function AirportCombobox({ value, onChange }: AirportComboboxProps) {
  const selected = findAirport(value);
  const [query, setQuery] = useState(selected ? airportLabel(selected) : value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const results = searchAirports(query === (selected ? airportLabel(selected) : "") ? "" : query);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        const current = findAirport(value);
        setQuery(current ? airportLabel(current) : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const commit = (airport: Airport) => {
    onChange(airport.code);
    setQuery(airportLabel(airport));
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIndex];
      if (pick) commit(pick);
    } else if (e.key === "Escape") {
      setOpen(false);
      const current = findAirport(value);
      setQuery(current ? airportLabel(current) : "");
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
        <Plane size={16} /> Home airport
      </label>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // Keep the parent's value in sync with what's on screen — otherwise typing
          // over a previously-selected airport without picking a new suggestion would
          // silently submit the old code while displaying the new (invalid) text.
          onChange(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search city or airport code"
        autoComplete="off"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-lg text-white placeholder-white/20 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
      />

      {open && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-neutral-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {results.map((airport, i) => (
            <li
              key={airport.code}
              role="option"
              aria-selected={airport.code === value}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(airport);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${
                i === activeIndex ? "bg-fuchsia-500/20 text-white" : "text-white/70"
              }`}
            >
              <span>
                {airport.city}, {airport.state}
                <span className="ml-1 text-white/40">{airport.name}</span>
              </span>
              <span className="ml-3 font-mono text-xs font-semibold tracking-widest text-fuchsia-300">
                {airport.code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
