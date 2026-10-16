import { site } from "@/lib/content";
import { Flag, Portrait, SectionHead, type LangProps } from "./ui";

export function Jury({ lang }: LangProps) {
  const { c, jury } = site(lang);
  if (jury.length === 0) return null;
  return (
    <section id="ziri" className="section jury" aria-labelledby="jury-title">
      <div className="wrap">
        <SectionHead id="jury-title" kicker={c.jury.kicker} title={c.jury.title} />
        <ul className="jury__list">
          {jury.map((j) => (
            <li key={j.name} className="juror">
              <Portrait src={j.photo} alt={j.name} sizes="(max-width: 640px) 40vw, 18rem" />
              <div className="juror__text">
                <h3 className="juror__name">{j.name}</h3>
                {j.country && (
                  <p className="juror__country">
                    <Flag code={j.code} />
                    {j.country}
                  </p>
                )}
                <p className="juror__role">{j.role}</p>
                {j.bio && <Bio text={j.bio} more={c.ui.readMore} />}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Bio({ text, more }: { text: string; more: string }) {
  const [first, ...rest] = text.split("\n\n");
  return (
    <>
      <p className="juror__bio">{first}</p>
      {rest.length > 0 && (
        <details className="juror__more">
          <summary>{more}</summary>
          {rest.map((para) => (
            <p key={para} className="juror__bio">
              {para}
            </p>
          ))}
        </details>
      )}
    </>
  );
}
