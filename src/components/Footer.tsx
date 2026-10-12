import { homePath, privacyPath, site } from "@/lib/content";
import { Wordmark, type LangProps } from "./ui";

export function Footer({ lang }: LangProps) {
  const s = site(lang);
  const { event, footer, site: meta, nav, ui } = s.c;
  const home = homePath(lang);

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <div>
          <Wordmark lang={lang} as="p" />
          <p className="site-footer__tagline">{event.tagline}</p>
        </div>
        <div>
          <p>
            {s.dateRange()} · {event.venue}, {event.city}
          </p>
          <p>
            <a href={`mailto:${meta.contactEmail}`}>{meta.contactEmail}</a>
          </p>
        </div>
        <ul className="site-footer__links">
          {nav.map((l) => (
            <li key={l.href}>
              <a href={`${home}${l.href}`}>{l.label}</a>
            </li>
          ))}
          <li>
            <a href={privacyPath(lang)}>{ui.privacy}</a>
          </li>
        </ul>
        <p className="muted site-footer__legal">{footer.organiser}</p>
      </div>
    </footer>
  );
}
