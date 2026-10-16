import { getContent } from "@/lib/content";
import { Portrait, SectionHead, type LangProps } from "./ui";

export function Organizers({ lang }: LangProps) {
  const c = getContent(lang);
  const o = c.organizers;
  return (
    <section id="organizatori" className="section organizers" aria-labelledby="organizers-title">
      <div className="wrap">
        <SectionHead id="organizers-title" kicker={o.kicker} title={o.title} />
        <div className="organizers__groups">
          {o.groups.map((g) => (
            <section key={g.title} className="organizers__group" style={{ "--n": g.items.length } as React.CSSProperties}>
              <h3 className="organizers__role">{g.title}</h3>
              <ul className="organizers__orgs">
                {g.items.map((org) => (
                  <li key={org.name}>
                    <span className="organizers__name">{org.name}</span>
                    {org.sub && <span className="organizers__sub">{org.sub}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="organizers__people">
          {o.people.map((p) => (
            <section key={p.role} className="organizers__team">
              <h3 className="organizers__role">{p.role}</h3>
              <ul>
                {p.members.map((m) => (
                  <li key={m.name} className="person">
                    <Portrait src={m.photo} alt={m.name} sizes="(max-width: 640px) 45vw, 14rem" />
                    <p className="person__name">{m.name}</p>
                    {"subtitle" in m && m.subtitle && <p className="person__subtitle">{m.subtitle}</p>}
                    {"bio" in m && m.bio && <PersonBio text={m.bio} more={c.ui.readMore} />}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonBio({ text, more }: { text: string; more: string }) {
  const [first, ...rest] = text.split("\n\n");
  return (
    <>
      <p className="person__bio">{first}</p>
      {rest.length > 0 && (
        <details className="person__more">
          <summary>{more}</summary>
          {rest.map((para) => (
            <p key={para} className="person__bio">
              {para}
            </p>
          ))}
        </details>
      )}
    </>
  );
}
