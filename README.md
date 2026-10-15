# Beogradski festival magije 2027

Sajt festivala sa registracionom formom. Next.js 16 (statički izvoz) na AdriaHost-u, serverski deo kao
Supabase Edge Functions, mejlovi preko Resend-a.

```bash
npm install
npm run dev              # http://localhost:3000 (organizator: http://localhost:3000/karte/#lokalno)
npm run build            # statički sajt u out/
npm run sync-functions   # kopira deljeni kod u supabase/functions/_shared (deploy ga radi sam)
```

## Kako je složeno

```
belgrademagicfestival.rs  ── AdriaHost: samo fajlovi iz out/ (HTML, JS, CSS, slike, mp3) + public/.htaccess
        │ fetch
        ▼
Supabase Edge Functions   ── register (forma) · tickets (stranica /karte)
        │
        ├─► Supabase baza (tabele registrations, register_attempts)
        └─► Resend (mejl posetiocu i organizatoru)
```

- `next.config.ts`: za build `output: "export"`; u `npm run dev` iste rewrite/redirect putanje kao na AdriaHost-u.
- `public/.htaccess`: engleski na `/` (pravljen kao `/en/`), srpski na `/sr/`, `/en/…` → bez prefiksa, https bez www, keš.
- `supabase/functions/register`: honeypot → poreklo → ograničenje slanja (429) → zod → Turnstile → cena (samo ovde) → upis → mejlovi.
- `supabase/functions/tickets`: lista prijava, promena statusa, CSV; ključ stiže u zaglavlju `x-admin-key`.
  `?ping=1` samo dodirne bazu (za nedeljno buđenje, vidi dole).
- Cena, validacija, tekstovi i formatiranje prijava postoje na jednom mestu (`src/lib/pricing.ts`, `schema.ts`, `content.ts`,
  `tickets.ts`); `scripts/sync-functions.mjs` ih kopira funkcijama. Ne menjati fajlove u `supabase/functions/_shared/`.

## Sadržaj

Sajt je dvojezičan: engleski je podrazumevan, na `/`, a srpski na `/sr/` (privatnost: `/privacy/`, `/sr/privacy/`).
Mejl organizatoru i `/karte` su uvek na srpskom (`ORGANIZER_LANG`).

Sav tekst (dugmići, forma, mejlovi, poruke grešaka, politika privatnosti), datumi, cene, galerija, organizatori:
**`content/sr.json`** i **`content/en.json`**. Oba fajla imaju istu strukturu.
Podaci koji nisu tekst (datumi, satnice, cene, `id`, slike, koordinate, linkovi) moraju biti isti u oba fajla, inače build pada sa porukom šta se ne slaže.
Slike su u `public/images/`, a u JSON se upisuje putanja `"/images/ime.jpg"`. Nema servera za slike: novu fotografiju
pre dodavanja smanjiti na najviše 1600 px širine (JPG, kvalitet oko 82).

Sekcije čija je lista prazna se ne prikazuju: `lecturers.items`, `jury.items`, `partners`, kao i `video.youtubeId`.

Build pada ako se datumi ne slažu: prvi i poslednji dan u `schedule.days` moraju biti `event.startDate` / `event.endDate`,
svaki datum u `programs.items[].shows` mora postojati u rasporedu, a brojač (`event.countdown.startsAt`) mora počinjati prvog dana.

## Podešavanja

**Supabase → Edge Functions → Secrets** (samo ovde su tajni ključevi):

| Ime | Šta |
|---|---|
| `RESEND_API_KEY` | Resend API ključ |
| `RESEND_FROM` | pošiljalac sa verifikovanog domena, npr. `Belgrade Magic Festival <prijave@belgrademagicfestival.rs>` |
| `ORGANIZER_EMAIL` | kome stiže obaveštenje o prijavi; više adresa odvojiti zarezom |
| `ADMIN_KEY` | ključ za `/karte/#…`, najmanje 16 nasumičnih znakova; služi i kao so za heš IP adrese |
| `ALLOWED_ORIGINS` | `https://belgrademagicfestival.rs,https://www.belgrademagicfestival.rs` (za lokalni test dodati `,http://localhost:3000`) |
| `TURNSTILE_SECRET_KEY` | opciono, Cloudflare Turnstile |

`SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` Supabase daje funkcijama sam.

**GitHub → Settings → Secrets and variables → Actions** (za `.github/workflows/deploy.yml`):
- Secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `SUPABASE_ACCESS_TOKEN`.
- Variables: `FTP_DIR`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FUNCTIONS_URL`
  (`https://pnpylpzcgoulsivplhip.supabase.co/functions/v1`), `SUPABASE_PROJECT_REF` (`pnpylpzcgoulsivplhip`),
  opciono `NEXT_PUBLIC_TURNSTILE_SITE_KEY` i `NEXT_PUBLIC_GA_ID`.

Lokalno (`.env.local`): `NEXT_PUBLIC_FUNCTIONS_URL` (ista adresa) da bi forma slala na funkcije.

## Objavljivanje

Push na `main` pokreće `.github/workflows/deploy.yml`: prvo objavi funkcije na Supabase, pa napravi `out/` i preko FTP-a
ga postavi na AdriaHost. Može i ručno: GitHub → Actions → Deploy → Run workflow.

## Supabase da ne zaspi

Besplatan Supabase projekat se pauzira posle 7 dana bez ijednog zahteva. U AdriaHost panelu → **Cron Jobs** dodati
jedan posao jednom nedeljno (npr. ponedeljkom u 07:00):

```
curl -s "https://pnpylpzcgoulsivplhip.supabase.co/functions/v1/tickets?ping=1" > /dev/null
```

## Pregled prijava za organizatora (karte)

`https://belgrademagicfestival.rs/karte/#<ADMIN_KEY>`: ukupan broj prijava, iznosi, filter po statusu, sortiranje,
promena statusa (odmah se čuva u bazi) i CSV za Excel. Nema logovanja, ključ posle `#` je lozinka; deo posle `#`
pretraživač nikad ne šalje serveru. Pogrešan ključ: „Pogrešan ključ.“ i nikakvi podaci.
Status prijave menja organizator (nema automatskog isteka neplaćenih prijava).

## Slika pri deljenju linka

`public/og-sr.png` i `public/og-en.png` (1200×630). Kad se promene naziv, datumi ili mesto: izmeni `scripts/og-text.json`
i pokreni `powershell -ExecutionPolicy Bypass -File scripts/make-og.ps1` (Windows).

## Baza

Pokrenuti redom u Supabase SQL Editoru: `supabase/migrations/0001_registrations.sql`, `0002_lang_and_extras.sql`,
`0003_register_attempts.sql`. Kad status postane `paid`, `paid_at` se upiše sam.
Heš IP adrese (za ograničenje slanja) se briše posle dva dana. Brisanje prijave na zahtev (GDPR): obrisati red u Table Editoru.
