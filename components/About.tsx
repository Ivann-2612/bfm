import { getContent } from "@/lib/content";
import { Photo, type LangProps } from "./ui";

export function About({ lang }: LangProps) {
  const { about, ui } = getContent(lang);
  return (
    <section id="festival" className="section about" aria-labelledby="about-title">
      <div className="wrap about__grid">
        <div className="about__text">
          <p className="kicker">{about.kicker}</p>
          <h2 id="about-title" className="section-title">
            {about.title}
          </h2>
          <p className="about__lead">{about.lead}</p>
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <figure className="about__aside">
          <Photo
            src={about.photo.src}
            alt={about.photo.alt}
            label={ui.photoPlaceholder}
            sizes="(min-width: 900px) 45vw, 100vw"
            className="about__photo"
          />
          <figcaption>
            <b>{about.aside.title}</b>
            <span>{about.aside.text}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
