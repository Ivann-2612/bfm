import Image from 'next/image';
import { homePath, privacyPath, site } from '@/lib/content';
import { InstagramIcon, MailIcon, Wordmark, type LangProps } from './ui';

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
          <ul className="site-footer__badges">
            {footer.badges.map((b) => (
              <li key={b.src}>
                <Image src={b.src} alt={b.alt} title={b.alt} width={40} height={40} />
              </li>
            ))}
          </ul>
        </div>
        <div className="site-footer__contact">
          <p className="site-footer__when">
            {s.dateRange()} · {event.venue}, {event.city}
          </p>
          <a
            className="site-footer__social"
            href={`mailto:${meta.contactEmail}`}
          >
            <MailIcon />
            <span>{meta.contactEmail}</span>
          </a>
          <a
            className="site-footer__social"
            href={meta.instagram}
            target="_blank"
            rel="noopener"
            aria-label={ui.instagramLabel}
          >
            <InstagramIcon />
            <span aria-hidden="true">
              @{new URL(meta.instagram).pathname.replaceAll('/', '')}
            </span>
          </a>
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
