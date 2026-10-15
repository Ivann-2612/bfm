import { getContent } from "@/lib/content";
import { AnthemPlayer } from "./AnthemPlayer";
import type { LangProps } from "./ui";

export function Anthem({ lang }: LangProps) {
  const a = getContent(lang).anthem;
  if (!a.src) return null;
  return (
    <section className="section anthem" aria-labelledby="anthem-title">
      <div className="wrap anthem__inner">
        <div>
          <p className="kicker">{a.kicker}</p>
          <h2 id="anthem-title" className="anthem__heading">
            {a.title}
          </h2>
          <p className="anthem__text">{a.text}</p>
        </div>
        <AnthemPlayer src={a.src} title={a.title} labels={{ play: a.play, pause: a.pause, seek: a.seek }} />
      </div>
    </section>
  );
}
