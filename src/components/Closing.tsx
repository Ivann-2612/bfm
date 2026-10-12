import { site } from "@/lib/content";
import type { LangProps } from "./ui";

export function Closing({ lang }: LangProps) {
  const s = site(lang);
  const { closing, event, ui } = s.c;
  return (
    <section className="closing" aria-labelledby="closing-title">
      <div className="wrap closing__inner">
        <p className="kicker">{closing.kicker}</p>
        <h2 id="closing-title" className="closing__title">
          {closing.title}
        </h2>
        <p className="closing__when">
          {s.dateRange()} · {event.venue}
        </p>
        <div className="closing__actions">
          <a href="#prijava" className="btn">
            {ui.register}
          </a>
          <a href="#top" className="link-arrow">
            {ui.backToTop}
          </a>
        </div>
      </div>
    </section>
  );
}
