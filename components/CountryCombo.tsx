"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

// Country field with our own suggestion list. The browser's <datalist> popup can't be styled
// (white box, "Manage addresses…" in Chrome), so this is an ARIA combobox: type to filter,
// arrows + Enter to pick, Escape to close. Any text is still accepted (the list only helps).

// One folded character per source character, so match positions map back onto the name:
// "Č" → "c", "Ö" → "o". Lets "srb", "Srb" and "šrb" all find "Srbija".
const fold = (s: string) =>
  Array.from(s, (ch) => ch.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()[0] ?? ch).join("");

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  noMatch: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

export function CountryCombo({ value, onChange, options, noMatch, ...inputProps }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  // Names that start with the query first, then names that contain it.
  const matches = useMemo(() => {
    const q = fold(value.trim());
    if (!q) return options.map((name) => ({ name, at: -1 }));
    const starts: { name: string; at: number }[] = [];
    const contains: { name: string; at: number }[] = [];
    for (const name of options) {
      const at = fold(name).indexOf(q);
      if (at === 0) starts.push({ name, at });
      else if (at > 0) contains.push({ name, at });
    }
    return [...starts, ...contains];
  }, [value, options]);
  const qLen = value.trim().length;

  useEffect(() => setActive(-1), [value]);
  useEffect(() => {
    if (active < 0) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (matches.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + matches.length) % matches.length);
    } else if (e.key === "Enter" && open && active >= 0) {
      e.preventDefault(); // pick the country instead of submitting the form
      pick(matches[active].name);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  // An exact match needs no list (e.g. right after picking, or a fully typed name).
  const exact = matches.length === 1 && matches[0].name.toLowerCase() === value.trim().toLowerCase();
  const show = open && !exact && options.length > 0;

  return (
    <div className={`combo ${show ? "is-open" : ""}`}>
      <input
        {...inputProps}
        value={value}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          // A pre-filled or picked country is selected, so typing simply replaces it.
          if (exact) e.currentTarget.select();
        }}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <span className="combo__chevron" aria-hidden="true" />
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        className={`combo__list ${qLen === 0 ? "is-full" : ""}`}
        hidden={!show}
        // Keep focus in the input while clicking an option (otherwise blur closes the list first).
        onMouseDown={(e) => e.preventDefault()}
      >
        {matches.map((m, i) => (
          <li
            key={m.name}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className={i === active ? "is-active" : ""}
            onMouseEnter={() => setActive(i)}
            onClick={(e) => {
              e.preventDefault(); // the field is a <label>: don't let it re-click the input
              pick(m.name);
            }}
          >
            {m.at < 0 ? (
              m.name
            ) : (
              <>
                {m.name.slice(0, m.at)}
                <mark>{m.name.slice(m.at, m.at + qLen)}</mark>
                {m.name.slice(m.at + qLen)}
              </>
            )}
          </li>
        ))}
        {matches.length === 0 && (
          <li className="combo__empty" aria-disabled="true">
            {noMatch}
          </li>
        )}
      </ul>
    </div>
  );
}
