import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  LANGS,
  fill,
  getContent,
  homePath,
  isLang,
  privacyPath,
} from "@/lib/content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const c = getContent(lang);
  return {
    title: `${c.privacy.title} — ${c.site.title}`,
    alternates: {
      canonical: privacyPath(lang),
      languages: Object.fromEntries(
        LANGS.map((l) => [getContent(l).site.lang, privacyPath(l)]),
      ),
    },
  };
}

export default async function Privacy({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const c = getContent(lang);
  const values = {
    organiser: c.site.organiserLegal,
    contact: c.site.contactEmail,
  };

  return (
    <>
      <Header lang={lang} page="privacy" />
      <main id="main" className="section legal">
        <div className="wrap legal__wrap">
          <a href={homePath(lang)} className="link-arrow link-arrow--back">
            {c.ui.backToSite}
          </a>
          <h1 className="section-title">{c.privacy.title}</h1>
          <p className="legal__updated">{c.privacy.updated}</p>
          {c.privacy.sections.map((s) => (
            <section key={s.title} className="legal__section">
              <h2>{s.title}</h2>
              <p>{fill(s.text, values)}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
