import { site } from "@/lib/content";
import { SectionHead, type LangProps } from "./ui";

// Both prices are always shown, so the static page never depends on "today".
export function Packages({ lang }: LangProps) {
  const s = site(lang);
  const p = s.c.packages;
  const untilLabel = `${p.labels.until} ${s.formatInstant(p.earlyBirdUntil)}`;

  return (
    <section id="cene" className="section packages" aria-labelledby="packages-title">
      <div className="wrap packages__wrap">
        <SectionHead id="packages-title" kicker={p.kicker} title={p.title} />
        <table className="pricelist">
          <caption className="visually-hidden">{p.title}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">{p.labels.package}</span>
              </th>
              <th scope="col">{untilLabel}</th>
              <th scope="col">{p.labels.after}</th>
            </tr>
          </thead>
          <tbody>
            {p.items.map((it) => (
              <tr key={it.id}>
                <th scope="row">
                  <span className="pricelist__name">{it.name}</span>
                  <ul className="pricelist__includes">
                    {it.includes.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </th>
                <td className="pricelist__early" data-label={untilLabel}>
                  {s.money(it.price.early)}
                </td>
                <td data-label={p.labels.after}>{s.money(it.price.regular)}</td>
              </tr>
            ))}
          </tbody>
          <tbody className="pricelist__extras">
            <tr>
              <th scope="rowgroup" colSpan={3} className="pricelist__group">
                {p.labels.extras}
              </th>
            </tr>
            {p.extras.map((x) => (
              <tr key={x.id}>
                <th scope="row">
                  <span className="pricelist__name">{x.label}</span>
                </th>
                <td colSpan={2}>{s.money(x.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <a href="#prijava" className="btn">
          {s.c.ui.register}
        </a>
      </div>
    </section>
  );
}
