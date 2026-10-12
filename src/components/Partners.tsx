import Image from "next/image";
import { site } from "@/lib/content";
import type { LangProps } from "./ui";

export function Partners({ lang }: LangProps) {
  const { c, partners } = site(lang);
  if (partners.length === 0) return null;
  const row = (hidden: boolean) =>
    partners.map((p, i) => {
      const inner = p.logo ? <Image src={p.logo} alt={p.name} width={140} height={56} /> : <span>{p.name}</span>;
      return (
        <li key={`${hidden}-${i}`} aria-hidden={hidden || undefined}>
          {p.url ? (
            <a href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : undefined}>
              {inner}
            </a>
          ) : (
            inner
          )}
        </li>
      );
    });

  return (
    <section className="partners" aria-labelledby="partners-title">
      <h2 id="partners-title" className="kicker wrap">
        {c.ui.partners}
      </h2>
      <div className="marquee">
        <ul className="marquee__track">
          {row(false)}
          {row(true)}
        </ul>
      </div>
    </section>
  );
}
