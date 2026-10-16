import links from "@content/links.json";
import { getContent } from "@/lib/content";
import { FormDialog } from "./FormDialog";
import { SectionHead, type LangProps } from "./ui";

export function RegistrationLink({ lang }: LangProps) {
  const c = getContent(lang);
  const r = c.registration;
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
          <FormDialog url={links.googleForm} title={g.title} open={g.open} newTab={g.button} close={c.ui.close} loading={g.loading} />
          <p className="register-link__note">
            {g.note}{" "}
            <a href={links.googleForm} target="_blank" rel="noopener noreferrer">
              {g.button} ↗
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
