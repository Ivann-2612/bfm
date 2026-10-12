import { getContent } from "@/lib/content";
import { SectionHead, type LangProps } from "./ui";

export function Organizers({ lang }: LangProps) {
  const o = getContent(lang).organizers;
  return (
    <section id="organizatori" className="section organizers" aria-labelledby="organizers-title">
      <div className="wrap">
        <SectionHead id="organizers-title" kicker={o.kicker} title={o.title} />
        <ul className="organizers__orgs">
          {o.orgs.map((org) => (
            <li key={org.name}>
              <span className="organizers__role">{org.role}</span>
              <span className="organizers__name">{org.name}</span>
              <span className="organizers__sub">{org.sub}</span>
            </li>
          ))}
        </ul>
        <dl className="organizers__people">
          {o.people.map((p) => (
            <div key={p.role}>
              <dt>{p.role}</dt>
              <dd>{p.name}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
