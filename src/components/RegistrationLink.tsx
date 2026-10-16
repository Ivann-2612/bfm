import { getContent } from "@/lib/content";
import { SectionHead, type LangProps } from "./ui";

export function RegistrationLink({ lang }: LangProps) {
  const r = getContent(lang).registration;
  const g = r.googleForm;
  return (
    <section id="prijava" className="section register" aria-labelledby="register-title">
      <span className="register__ghost" aria-hidden="true">
        ♦
      </span>
      <div className="wrap">
        <SectionHead id="register-title" kicker={r.kicker} title={r.title} />
        <div className="register-link">
          <p className="register-link__text">{g.text}</p>
          <ol className="register-link__steps">
            {g.steps.map((step, i) => (
              <li key={step}>
                <span className="register-link__num" aria-hidden="true">
                  {["♠", "♥", "♣"][i] ?? "♦"}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <a className="btn register-link__btn" href={g.url} target="_blank" rel="noopener noreferrer">
            {g.button} <span aria-hidden="true">↗</span>
          </a>
          <p className="register-link__note">{g.note}</p>
        </div>
      </div>
    </section>
  );
}
