import { getContent, homePath, otherLang, privacyPath } from "@/lib/content";
import { MobileMenu } from "./MobileMenu";
import { InstagramIcon, Wordmark, type LangProps } from "./ui";

export function Header({ lang, page = "home" }: LangProps & { page?: "home" | "privacy" }) {
  const { nav, menu, ui, site } = getContent(lang);
  const other = otherLang(lang);
  const otherSite = getContent(other).site;
  const home = homePath(lang);
  const prefix = page === "home" ? "" : home;
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
        <a href={site.instagram} className="lang-switch social-link" target="_blank" rel="noopener" aria-label={ui.instagramLabel}>
          <InstagramIcon />
        </a>
        <a href={switchHref} className="lang-switch" hrefLang={otherSite.lang} lang={otherSite.lang}>
          <span aria-hidden="true">{ui.otherLangShort}</span>
          <span className="visually-hidden">{ui.otherLang}</span>
        </a>
        <a href={`${prefix}#prijava`} className="btn btn--small site-header__cta">
          {ui.register}
        </a>
        <MobileMenu
          links={menu.map((m) => ({ label: m.label, href: `${prefix}${m.href}` }))}
          privacy={{ label: ui.privacy, href: privacyPath(lang) }}
          instagram={{ label: "Instagram", href: site.instagram }}
          lang={{ href: switchHref, label: ui.otherLang, hrefLang: otherSite.lang }}
          labels={{ open: ui.menuOpen, close: ui.menuClose, sections: ui.sectionsNav }}
        />
      </div>
    </header>
  );
}
