import Image from "next/image";
import { SUIT_GLYPH, getContent, homePath, isRed, type Lang, type Suit } from "@/lib/content";

export type LangProps = { lang: Lang };

export function SuitMark({ suit, className = "" }: { suit: Suit; className?: string }) {
  return (
    <span className={`suit ${isRed(suit) ? "suit--red" : ""} ${className}`} aria-hidden="true">
      {SUIT_GLYPH[suit]}
    </span>
  );
}

export function SectionHead({ kicker, title, id, intro }: { kicker: string; title: string; id?: string; intro?: string }) {
  return (
    <header className="section-head">
      <p className="kicker">{kicker}</p>
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {intro && <p className="section-intro">{intro}</p>}
    </header>
  );
}

// Renders the photo, or a labelled empty frame until a real photo is added to /public.
export function Photo({
  src,
  alt,
  sizes,
  label,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  label: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={`photo photo--empty ${className}`} role="img" aria-label={alt}>
        <span>
          {label}: {alt}
        </span>
      </div>
    );
  }
  return (
    <div className={`photo ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} />
    </div>
  );
}

export function Wordmark({ lang, as: Tag = "a" }: LangProps & { as?: "a" | "p" }) {
  const { name, year } = getContent(lang).event;
  const [first, ...rest] = name.split(" ");
  const inner = (
    <>
      <i>{first}</i> {rest.join(" ")} <span>{year}</span>
    </>
  );
  return Tag === "a" ? (
    <a href={homePath(lang)} className="wordmark">
      {inner}
    </a>
  ) : (
    <p className="wordmark">{inner}</p>
  );
}
