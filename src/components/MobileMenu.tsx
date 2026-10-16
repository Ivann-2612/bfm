"use client";

import { useEffect, useState } from "react";
import { InstagramIcon } from "./ui";

type Link = { label: string; href: string };
type Props = {
  links: Link[];
  privacy: Link;
  instagram: Link;
  lang: { href: string; label: string; hrefLang: string };
  labels: { open: string; close: string; sections: string };
};

export function MobileMenu({ links, privacy, instagram, lang, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    document.documentElement.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      document.documentElement.classList.remove("menu-open");
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`burger ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} hidden={!open}>
        <nav aria-label={labels.sections}>
          <ol className="mobile-menu__list">
            {links.map((l, i) => (
              <li key={l.href} style={{ "--i": i } as React.CSSProperties}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="mobile-menu__foot">
          <a href={lang.href} hrefLang={lang.hrefLang} lang={lang.hrefLang} className="link-arrow">
            {lang.label}
          </a>
          <a href={instagram.href} target="_blank" rel="noopener" className="mobile-menu__social">
            <InstagramIcon />
            {instagram.label}
          </a>
          <a href={privacy.href} onClick={() => setOpen(false)}>
            {privacy.label}
          </a>
        </div>
      </div>
    </>
  );
}
