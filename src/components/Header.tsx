import { getContent, homePath, otherLang, privacyPath } from "@/lib/content";
import { Wordmark, type LangProps } from "./ui";

export function Header({ lang, page = "home" }: LangProps & { page?: "home" | "privacy" }) {
  const { nav, ui } = getContent(lang);
  const other = otherLang(lang);
  const home = homePath(lang);
  // On the privacy page, section links point back to the home page.
  const prefix = page === "home" ? "" : home === "/" ? "/" : home;
  const switchHref = page === "home" ? homePath(other) : privacyPath(other);

  return (
    <header className="site-header">
      <a className="skip" href="#main">
        {ui.skip}
      </a>
      <div className="wrap site-header__inner">
        <Wordmark lang={lang} />
        <nav aria-label={ui.sectionsNav} className="site-nav">
          {nav.map((n) => (
            <a key={n.href} href={`${prefix}${n.href}`}>
              {n.label}
            </a>
          ))}
        </nav>
        <a href={switchHref} className="lang-switch" hrefLang={getContent(other).site.lang} lang={getContent(other).site.lang}>
          <span aria-hidden="true">{ui.otherLangShort}</span>
          <span className="visually-hidden">{ui.otherLang}</span>
        </a>
        <a href={`${prefix}#prijava`} className="btn btn--small">
          {ui.register}
        </a>
      </div>
    </header>
  );
}
