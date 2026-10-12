import { site } from "@/lib/content";
import { Photo, type LangProps } from "./ui";

export function Jury({ lang }: LangProps) {
  const { c, jury } = site(lang);
  if (jury.length === 0) return null;
  return (
    <section className="section jury" aria-labelledby="jury-title">
      <div className="wrap jury__inner">
        <h2 id="jury-title" className="kicker">
          {c.jury.title}
        </h2>
        <ul className="jury__list">
          {jury.map((j, i) => (
            <li key={i}>
              <Photo src={j.photo} alt={j.name} label={c.ui.photoPlaceholder} sizes="96px" className="jury__photo" />
              <span className="jury__name">{j.name}</span>
              <span className="jury__role">{j.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
