import { getContent } from "@/lib/content";
import type { LangProps } from "./ui";

export function History({ lang }: LangProps) {
  const h = getContent(lang).history;
  return (
    <section className="section history" aria-labelledby="history-title">
      <div className="wrap history__grid">
        <p className="history__year" aria-hidden="true">
          {h.year}
        </p>
        <div>
          <p className="kicker">{h.kicker}</p>
          <h2 id="history-title" className="section-title">
            {h.title}
          </h2>
          {h.paragraphs.map((p, i) => (
            <p key={i} className="history__p">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
