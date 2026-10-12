import { getContent } from "@/lib/content";
import type { LangProps } from "./ui";

export function Vision({ lang }: LangProps) {
  const v = getContent(lang).vision;
  const [open, close] = lang === "sr" ? ["„", "“"] : ["“", "”"];
  return (
    <section className="section vision" aria-labelledby="vision-title">
      <div className="wrap vision__grid">
        <div>
          <p className="kicker">{v.kicker}</p>
          <h2 id="vision-title" className="vision__title">
            {v.title}
          </h2>
        </div>
        <div className="vision__text">
          {v.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <blockquote className="vision__quote">
            {open}
            {v.quote}
            {close}
          </blockquote>
        </div>
      </div>
    </section>
  );
}
