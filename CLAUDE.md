# Golden — sajt za događaj sa registracionom formom

Kostur je napravljen 2026-10-12 (Next.js 16, App Router, `src/`). Pokretanje, env i baza: README.md.

## Konvencije u kodu

- Događaj je **Beogradski festival magije 2027** (27–28. feb, MTS dvorana); tekst i slike preuzeti 2026-10-12 sa
  beogradski-festival-magije.magic-piksi.chatgpt.site. Struktura sekcija ostaje po uzoru na goldencat.eu.
- Dvojezično: `content/sr.json` (na `/`) i `content/en.json` (na `/en`). Rute su `src/app/[lang]/…`; `next.config.ts`
  rewrite-uje `/` → `/sr` i redirect-uje `/sr` → `/`. Komponente primaju `lang` i koriste `site(lang)` (sadržaj + formatiranje datuma/novca).
- Sav tekst, uključujući dugmiće, formu, mejlove, greške i privatnost, je u JSON-u; komponente ne sadrže tekst.
  `content.ts` pri buildu poredi sr/en: ključevi iz `DATA_KEYS` (datumi, cene, id, src…) i dužine nizova moraju biti isti.
- Cene, paketi (Standard / Dealer), dodaci, Hotel Park, predavači i umetnici Gala šoua su sa zvaničnog flajera
  (snimak ekrana od 2026-10-12). Dodaci (`packages.extras`) važe samo za pakete koji ih navode u `allowExtras`;
  `computePrice` odbacuje ostale, a u bazu ide samo ono što je naplaćeno (`registrations.extras`).
- Organizator uvek dobija mejl na srpskom; korisnik na jeziku na kom se prijavio (`registrations.lang`).
- Sekcije sa praznom listom (predavači, žiri, hoteli, partneri, video) se ne renderuju.
- `src/lib/content.ts` pri buildu proverava da se datumi slažu (zaštita od greške koju ima goldencat.eu).
  Naslovi sa opsegom datuma se grade iz `event.startDate/endDate` (`dateRange()`), ne pišu se ručno.
- Vizuelni potpis: svaki dan ima svoj znak, redom ♠ ♥ ♣ ♦ (hero, „Magični Varijete“ termini, tabovi rasporeda). Boje/fontovi su tokeni na vrhu `globals.css`.
  Plakat festivala (`/images/naslovna.png`) je u hero delu.
- `src/lib/pricing.ts` i `src/lib/schema.ts` dele klijent i server. Server je jedini izvor cene.
- Ništa što zavisi od „danas“ (early bird) ne renderuje se na serveru; računa se posle mount-a (izbegava hydration #418).
- Supabase: samo secret key na serveru, RLS uključen bez politika. Bez `@supabase/ssr`, nema auth-a.
- Srpski je latinica (`sr-Latn-RS`), engleski je britanski (`en-GB`).
- Lokalno, iza kancelarijskog proxy-ja, Node `fetch` ne dopire do Supabase-a. Korisnik je rekao da se to za sada ne dira.

Zaključci iz razgovora od 2026-10-12:

## Referenca

Uzor je **goldencat.eu**: Golden Cat 2027, magičarska konvencija u Gabrovu (Bugarska).
Jedna duga stranica, tamna pozadina sa zlatnim akcentima, serif naslovi, simboli karata (♣ ♠ ♦) u pozadini.

Sekcije redom: hero (datum, mesto, brojke, CTA) → programi (Gala Show / Gathering) → o konvenciji
→ video → predavači (kartice koje se okreću) → raspored (tabovi po danima) → žiri → paketi i cene
(early bird) → hoteli → mapa lokacija → prevoz sa aerodroma → registraciona forma sa obračunom
cene sa strane → partneri (traka koja se vrti) → footer → cookie banner (GA tek posle pristanka).

Greške koje smo kod njih videli i koje ne treba ponoviti:
- datumi se ne slažu između sekcija (18–21 vs 19–22, Gala 20. vs 21. mart);
- u biografiji predavača ostao tekst od AI asistenta („That's about 50 words…“);
- React hydration greška #418 u konzoli.

## Odluke

- **Stack:** Next.js + Supabase (Postgres) + Resend (mejlovi) + Cloudflare Turnstile (spam), deploy na Vercel.
  Angular (SSR/prerender + Supabase Edge Function za formu) je validna alternativa ako se ne uči React.
  NestJS je previše za ovo.
- **Tok forme:** POST `/api/register` → zod validacija → server računa cenu → upis u `registrations`
  (`status: 'pending'`) → mejl korisniku (rezime + plaćanje) i organizatoru.
- **Pravila:**
  - cena se računa ISKLJUČIVO na serveru, iznos iz browsera je samo za prikaz;
  - validacija na obe strane;
  - GDPR: čuvati pristanak i vreme pristanka, omogućiti brisanje na zahtev;
  - unique ograničenje na email (ili email + godina);
  - dnevni cron: `pending` stariji od 7 dana → `expired` + podsetnik;
  - ključevi samo u env varijablama na serveru.
- Supabase dashboard služi organizatoru kao admin: pregled prijava, status `paid`, CSV izvoz.

## Dizajn: da ne izgleda kao AI

- Na početku, pre koda, uključiti skill **`frontend-design`** i zajedno odrediti vizuelni pravac.
- Prave fotografije sa događaja umesto stock slika i ilustracija.
- Tekst piše čovek ili ga bar pažljivo pročita; nikad ne ostavljati AI ostatke.
- Konkretni, ljudski detalji umesto generičkih fraza.
- Jedan jak vizuelni motiv vezan za temu, a ne nasumični efekti.
- Manje sekcija i manje simetrije od šablona hero → 3 kartice → brojke → FAQ → CTA.

## Sledeći koraci

Urađeno: Next.js, vizuelni pravac, kostur (stranica, forma, migracija, API, cron), sadržaj Beogradskog festivala magije.
`SUPABASE_URL` i `SUPABASE_SECRET_KEY` su u `.env`.

1. Pokrenuti migraciju `supabase/migrations/0001_registrations.sql` u projektu `pnpylpzcgoulsivplhip`.
2. Placeholderi koje ni sajt ni flajer nemaju: kontakt mejl, podaci za uplatu, biografije i fotografije predavača.
   Sa flajera proveriti (slaba rezolucija): „Maxim Gladstein“, „Françoise Roshe“, maksimum 2 za dealer dodatke, termin Gala večere.
3. Resend domen + Turnstile ključevi.
4. Stranica `/privacy` (link u footeru već postoji).
5. Deploy na Vercel + env varijable.
