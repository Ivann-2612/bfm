import links from "@content/links.json";
import { getContent, ORGANIZER_LANG } from "@/lib/content";
import { SheetData } from "./SheetData";

const { event } = getContent(ORGANIZER_LANG);

const items = [
  {
    href: links.answersSheet,
    title: "Tabela prijava",
    text: "Sve prijave sa iznosom, uplatom i FISM proverom. Prvi tab, „Pregled“, ima zbir: broj prijava, paketi, hotel, takmičenje, očekivano i uplaćeno.",
  },
  { href: links.formEdit, title: "Uredi formu", text: "Pitanja, tema i odgovori u Google Forms." },
  { href: links.googleForm, title: "Forma kao posetilac", text: "Ono što vide posetioci, za probnu prijavu." },
].filter((i) => i.href);

export function AdminLinks() {
  return (
    <main className="links-admin">
      <p className="kicker">
        {event.name} {event.year}
      </p>
      <h1 className="section-title">Prijave</h1>
      <SheetData api={links.dataApi} />
      <ul>
        {items.map((i) => (
          <li key={i.title}>
            <a href={i.href} target="_blank" rel="noopener noreferrer">
              <b>{i.title} ↗</b>
              <span>{i.text}</span>
            </a>
          </li>
        ))}
      </ul>
      <p>
        Tabela se otvara samo Google nalozima kojima je podeljena (Share u tabeli). Pregled iznad se vidi samo uz ključ posle # u adresi
        (/karte/#ključ); adresu sa ključem ne prosleđuj nikome kome ne treba.
      </p>
    </main>
  );
}
