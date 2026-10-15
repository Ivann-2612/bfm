import { getContent } from "@/lib/content";
import { GalleryGrid } from "./GalleryGrid";
import { SectionHead, type LangProps } from "./ui";

export function Gallery({ lang }: LangProps) {
  const { gallery: g, ui } = getContent(lang);
  if (g.items.length === 0) return null;

  return (
    <section id="galerija" className="section gallery" aria-labelledby="gallery-title">
      <div className="wrap">
        <SectionHead id="gallery-title" kicker={g.kicker} title={g.title} intro={g.intro} />
        <GalleryGrid items={g.items} labels={{ open: ui.openPhoto, close: ui.close, prev: ui.prev, next: ui.next }} />
      </div>
    </section>
  );
}
