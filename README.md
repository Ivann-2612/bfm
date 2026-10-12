# Beogradski festival magije 2027

Sajt festivala sa registracionom formom (struktura po uzoru na goldencat.eu). Next.js 16 + Supabase + Resend + Turnstile, deploy na Vercel.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

## Sadržaj

Sajt je dvojezičan: srpski na `/`, engleski na `/en` (privatnost: `/privacy`, `/en/privacy`).

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

Bez Supabase ključeva forma u dev modu radi „na suvo“ (prijava i mejlovi se loguju u terminal). U produkciji vraća 503.

Na kancelarijskoj mreži (proxy `HTTPS_PROXY`) Node-ov `fetch` lokalno ne može do Supabase-a (`fetch failed`), pa prijava vraća 500. To nije greška u kodu; na Vercelu radi.

## Baza

Pokrenuti `supabase/migrations/0001_registrations.sql` u Supabase SQL Editoru.
Organizator u Table Editoru menja `status` u `paid` (`paid_at` se upiše sam) i izvozi CSV.
Brisanje na zahtev (GDPR): obrisati red u Table Editoru.

## Tok prijave

`POST /api/register` → zod → Turnstile → cena se računa na serveru (`src/lib/pricing.ts`) → insert (`status: pending`) → mejl korisniku i organizatoru.
`GET /api/cron/expire` (svaki dan u 06:00 UTC, `vercel.json`): `pending` stariji od 7 dana → `expired` + mejl.
