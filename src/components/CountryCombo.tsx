"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

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
      e.preventDefault();
      pick(matches[active].name);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

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
              e.preventDefault();
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
