import { notFound } from "next/navigation";
import { LANGS, getContent, isLang } from "@/lib/content";
import { Header } from "@/components/Header";

import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Programs } from "@/components/Programs";
import { GalaArtists } from "@/components/GalaArtists";
import { Schedule } from "@/components/Schedule";
// import { Vision } from "@/components/Vision";
import { Gallery } from "@/components/Gallery";
import { Video } from "@/components/Video";
import { History } from "@/components/History";
import { Lecturers } from "@/components/Lecturers";
import { Contest } from "@/components/Contest";
import { Jury } from "@/components/Jury";
import { Packages } from "@/components/Packages";
import { Hotels } from "@/components/Hotels";
import { Travel } from "@/components/Travel";
import { Registration } from "@/components/Registration";
import { Organizers } from "@/components/Organizers";
// import { Closing } from "@/components/Closing";
import { Partners } from "@/components/Partners";
import { Footer } from "@/components/Footer";
import { Anthem } from "@/components/Anthem";
import { StickyCta } from "@/components/StickyCta";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <>
      <Header lang={lang} />
      <main id="main">
        <Hero lang={lang} />
        <Schedule lang={lang} />
        <Contest lang={lang} />
        <Jury lang={lang} />
        <Lecturers lang={lang} />
        <GalaArtists lang={lang} />
        <Packages lang={lang} />
        <About lang={lang} />
        <Programs lang={lang} />
        {/* <Vision lang={lang} /> */}
        <Gallery lang={lang} />
        <Anthem lang={lang} />
        <Video lang={lang} />
        <History lang={lang} />
        <Hotels lang={lang} />
        <Travel lang={lang} />
        <Registration lang={lang} />
        <Organizers lang={lang} />
        {/* <Closing lang={lang} /> */}
        <Partners lang={lang} />
      </main>
      <Footer lang={lang} />
      <StickyCta label={getContent(lang).ui.register} />
    </>
  );
}
