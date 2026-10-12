import Image from "next/image";
import { getContent } from "@/lib/content";
import { SectionHead, type LangProps } from "./ui";

export function Gallery({ lang }: LangProps) {
  const g = getContent(lang).gallery;
  if (g.items.length === 0) return null;

  return (
    <section id="galerija" className="section gallery" aria-labelledby="gallery-title">
      <div className="wrap">
        <SectionHead id="gallery-title" kicker={g.kicker} title={g.title} intro={g.intro} />
        <ul className="gallery__grid">
          {g.items.map((it, i) => (
            <li key={it.src} className={`gallery__item gallery__item--${i % 6}`}>
              <figure>
                <div className="gallery__img">
                  <Image src={it.src} alt={it.alt} fill sizes="(min-width: 900px) 33vw, 50vw" />
                </div>
                <figcaption>{it.alt}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
