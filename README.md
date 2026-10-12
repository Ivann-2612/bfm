# Beogradski festival magije 2027

Sajt festivala sa registracionom formom (struktura po uzoru na goldencat.eu). Next.js 16 + Supabase + Resend + Turnstile, deploy na Vercel.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

## Sadržaj

Sajt je dvojezičan: engleski je podrazumevan, na `/`, a srpski na `/sr` (privatnost: `/privacy`, `/sr/privacy`).
Podrazumevani jezik je `DEFAULT_LANG` u `src/lib/content.ts` (uz rewrite/redirect u `next.config.ts`). Mejl organizatoru i `/karte` su uvek na srpskom (`ORGANIZER_LANG`).

Sav tekst (dugmići, forma, mejlovi, poruke grešaka, politika privatnosti), datumi, cene, galerija, organizatori:
**`content/sr.json`** i **`content/en.json`**. Oba fajla imaju istu strukturu.
Podaci koji nisu tekst (datumi, satnice, cene, `id`, slike, koordinate, linkovi) moraju biti isti u oba fajla, inače build pada sa porukom šta se ne slaže.
Kad menjaš cenu ili datum, menjaj ga u oba fajla.
Slike su u `public/images/`, a u JSON se upisuje putanja `"/images/ime.jpg"`.
Prazno polje `src` prikazuje prugasti okvir sa natpisom.

Sekcije čija je lista prazna se ne prikazuju: `lecturers.items`, `jury.items`, `hotels.items`, `partners`, kao i `video.youtubeId`.
Kad ih popuniš, pojaviće se same.

Build pada ako se datumi ne slažu: prvi i poslednji dan u `schedule.days` moraju biti `event.startDate` / `event.endDate`, a svaki datum u `programs.items[].shows` mora postojati u rasporedu.
Svaki dan dobija znak po redu ♠ ♥ ♣ ♦.

## Env varijable (`.env.local`, i na Vercelu)

| Varijabla | Odakle |
|---|---|
| `SUPABASE_URL` | `https://pnpylpzcgoulsivplhip.supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → **Secret key** (`sb_secret_…`). Nikad publishable. |
| `RESEND_API_KEY`, `RESEND_FROM` | Resend; `RESEND_FROM` sa verifikovanog domena, npr. `Golden Cat <registration@domen.com>` |
| `ORGANIZER_EMAIL` | kome stiže obaveštenje o novoj prijavi |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `CRON_SECRET` | proizvoljan dugačak string; Vercel ga šalje cron ruti |
| `NEXT_PUBLIC_GA_ID` | Google Analytics; bez njega nema ni cookie banera |
| `NEXT_PUBLIC_SITE_URL` | opciono, npr. `https://bfm.rs` kad bude sopstveni domen; inače se koristi Vercel adresa (za slike pri deljenju linka) |

Bez Supabase ključeva forma u dev modu radi „na suvo“ (prijava i mejlovi se loguju u terminal). U produkciji vraća 503.

Na kancelarijskoj mreži (proxy `HTTPS_PROXY`) Node-ov `fetch` lokalno ne može do Supabase-a (`fetch failed`), pa prijava vraća 500. To nije greška u kodu; na Vercelu radi.

## Šta je obavezno

Dovoljna su tri ključa: `RESEND_API_KEY`, `RESEND_FROM`, `ORGANIZER_EMAIL`. Tada svaka prijava stiže
organizatoru mejlom (sa svim podacima; „Odgovori“ ide učesniku), a učesnik dobija potvrdu.
- Supabase je opcion: ako su `SUPABASE_*` podešeni, prijava se i upisuje u tabelu (plus provera duplikata i podsetnik posle 7 dana).
- Turnstile je opcion: bez njega botove hvata skriveno polje u formi.
- Bez Resend-a i bez Supabase-a produkcija odbija prijave (503), da se ne bi izgubile.

## Slika pri deljenju linka

`public/og-sr.png` i `public/og-en.png` (1200×630). Kad se promene naziv, datumi ili mesto: izmeni `scripts/og-text.json`
i pokreni `powershell -ExecutionPolicy Bypass -File scripts/make-og.ps1` (Windows).

## Pregled prijava za organizatora (karte)

`/karte/<ADMIN_KEY>`: ukupan broj prijava, iznosi, filter po statusu (čeka uplatu / plaćeno / isteklo / otkazano),
sortiranje klikom na naslov kolone, promena statusa iz padajućeg menija u tabeli (odmah se čuva u bazi) i CSV za Excel. Nema logovanja, ključ u adresi je lozinka (najmanje 16 znakova;
bez `ADMIN_KEY` stranica u produkciji ne postoji, pogrešan ključ daje 404). Čita iz Supabase-a.
Lokalno (`npm run dev`, bez `ADMIN_KEY` u `.env`): http://localhost:3000/karte/lokalno, sa primer podacima ako baza nije dostupna.

## Deploy na Vercel

1. Kod na GitHub (`.env` je u `.gitignore` i ne ide gore).
2. vercel.com → Add New → Project → Import repozitorijum. Next.js se prepoznaje sam.
3. Settings → Environment Variables (vidi „Šta je obavezno“). Posle svake izmene: Redeploy
   (`NEXT_PUBLIC_*` se ugrađuju pri buildu).
4. Dok Resend domen nije verifikovan: `RESEND_FROM="Beogradski festival magije <onboarding@resend.dev>"`,
   a mejlovi stižu samo na adresu Resend naloga (i `ORGANIZER_EMAIL` mora biti ta adresa).

## Baza

Pokrenuti redom u Supabase SQL Editoru: `supabase/migrations/0001_registrations.sql`, pa `0002_lang_and_extras.sql`
(0002 dopunjuje tabelu napravljenu starijom verzijom 0001; na novoj tabeli ne menja ništa, može se pokretati više puta).
Organizator menja status na `/karte` (ili u Table Editoru); kad postane `paid`, `paid_at` se upiše sam.
Brisanje na zahtev (GDPR): obrisati red u Table Editoru.

## Tok prijave

`POST /api/register` → zod → Turnstile → cena se računa na serveru (`src/lib/pricing.ts`) → insert (`status: pending`) → mejl korisniku i organizatoru.
`GET /api/cron/expire` (svaki dan u 06:00 UTC, `vercel.json`): `pending` stariji od 7 dana → `expired` + mejl.
