import Image from "next/image";
import { SUIT_GLYPH, getContent, homePath, isRed, type Lang, type Suit } from "@/lib/content";

export type LangProps = { lang: Lang };

export function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function Flag({ code }: { code?: string }) {
  if (!code) return null;
  // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG
  return <img className="flag" src={`/flags/${code}.svg`} alt="" width={18} height={13} aria-hidden="true" />;
}

export const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

export function Portrait({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  return (
    <div className="person__frame">
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} />
      ) : (
        <span className="person__initials" aria-hidden="true">
          {initials(alt)}
        </span>
      )}
    </div>
  );
}

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
