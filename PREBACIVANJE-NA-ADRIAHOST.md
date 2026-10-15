# Prebacivanje sajta na AdriaHost (opcija B)

Stanje 15. 10. 2026: **kod je gotov na grani `adriahost`.** Ostali su koraci koji traže tvoje naloge i internet bez
kancelarijskog proxy-ja. Ovaj dokument je lista tih koraka. Može se dati i ChatGPT-u kao kontekst (odeljak 6).

Sajt na Vercel-u (grana `main`) radi sve vreme. Ništa se ne menja dok `adriahost` ne spojiš u `main`.

---

## 1. Šta je urađeno na grani `adriahost`

| Šta | Gde |
|---|---|
| Sajt se pravi kao statički fajlovi (`npm run build` → `out/`) | `next.config.ts` |
| Engleski na `/`, srpski na `/sr/`, `/en` → `/`, https bez www, keš | `public/.htaccess` |
| Funkcija za formu (ista pravila kao pre: honeypot, poreklo, 429, zod, Turnstile, cena samo na serveru, upis, 2 mejla) | `supabase/functions/register/` |
| Funkcija za `/karte` (lista, status, CSV) + `?ping=1` za buđenje baze | `supabase/functions/tickets/` |
| Zajednički delovi funkcija (CORS, baza, mejlovi, rate limit, Turnstile) | `supabase/functions/_lib/` |
| Cena, validacija, tekstovi i formatiranje prijava na jednom mestu; skripta ih kopira funkcijama | `scripts/sync-functions.mjs` → `supabase/functions/_shared/` (generiše se, nije u Git-u) |
| Stranica za organizatora sada `/karte/#ključ` (ključ posle `#` se ne šalje serveru) | `src/app/karte/page.tsx`, `src/components/TicketsTable.tsx`, `src/lib/tickets.ts` |
| Forma šalje na funkciju; država se popunjava iz jezika pretraživača | `src/components/Registration.tsx` |
| Objavljivanje: GitHub Actions objavi funkcije, pa preko FTP-a pošalje `out/` na AdriaHost | `.github/workflows/deploy.yml` |
| Slike smanjene (8,2 → 3,8 MB), plakati iz PNG u JPG (1,8 MB → 227 KB) | `public/images/` |
| Politika privatnosti: AdriaHost kao hosting | `content/*.json` |
| README prepisan za novi način rada | `README.md` |
| **Obrisano:** `src/app/api/*`, `src/app/karte/[key]/*`, `src/lib/server/*`, `vercel.json`, `keepalive.yml` | |
| **Izbačeno po dogovoru:** automatski istek neplaćenih prijava posle 7 dana i mejl podsetnik | statuse menjaš ručno na `/karte` |

Provereno ovde: type-check prolazi, `npm run build` pravi sve stranice (`/`, `/sr/`, privatnost, `/karte/`, `404`) i
`.htaccess`; lokalni pregled `/karte/#lokalno` radi sa primer podacima.
**Nije provereno ovde** (proxy blokira Supabase): same funkcije. To je korak 5.

---

## 2. Na tvom računaru, redom

### Korak 1 — Kod
```bash
git switch adriahost
git pull
npm install
npm uninstall @supabase/supabase-js resend server-only   # više ih koriste samo funkcije (Deno), ne sajt
npm run build                                             # mora proći bez greške
```
Posle `npm uninstall` commit-uj `package.json` i `package-lock.json`.

U `.env.local` dodaj (za lokalni test forme):
```
NEXT_PUBLIC_FUNCTIONS_URL=https://pnpylpzcgoulsivplhip.supabase.co/functions/v1
```

### Korak 2 — AdriaHost panel (DirectAdmin)
1. Dodaj `belgrademagicfestival.rs` kao **dodatni domen** (Basic dozvoljava 2 sajta).
2. Uključi besplatan SSL (Let's Encrypt) za domen i `www`.
3. Napravi **FTP nalog** ograničen na folder novog domena. Zapiši host, korisnika, lozinku i putanju foldera.
4. Napravi mejl sanduče (npr. `info@belgrademagicfestival.rs`) ili prosleđivanje na magic.piksi@gmail.com.

### Korak 3 — Supabase
1. **Edge Functions → Secrets**, dodaj:
   - `RESEND_API_KEY`
   - `RESEND_FROM` (dok domen u Resend-u nije verifikovan: `Beogradski festival magije <onboarding@resend.dev>`)
   - `ORGANIZER_EMAIL` (više adresa odvojiti zarezom)
   - `ADMIN_KEY` (najmanje 16 nasumičnih znakova; to je lozinka za `/karte`)
   - `ALLOWED_ORIGINS=https://belgrademagicfestival.rs,https://www.belgrademagicfestival.rs,http://localhost:3000`
   - `TURNSTILE_SECRET_KEY` samo ako uključuješ Turnstile
2. Avatar → **Access Tokens** → napravi token (za GitHub, sledeći korak).
3. Ako tabela `register_attempts` ne postoji: SQL Editor → pokreni `supabase/migrations/0003_register_attempts.sql`.

### Korak 4 — GitHub (Settings → Secrets and variables → Actions)
- **Secrets:** `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `SUPABASE_ACCESS_TOKEN`
- **Variables:**
  - `FTP_DIR` (npr. `domains/belgrademagicfestival.rs/public_html/`, ili `/` ako FTP nalog vidi samo taj folder)
  - `NEXT_PUBLIC_SITE_URL=https://belgrademagicfestival.rs`
  - `NEXT_PUBLIC_FUNCTIONS_URL=https://pnpylpzcgoulsivplhip.supabase.co/functions/v1`
  - `SUPABASE_PROJECT_REF=pnpylpzcgoulsivplhip`
  - opciono `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_GA_ID`
- Stari secret `CRON_SECRET` više ne treba (može se obrisati).

### Korak 5 — Prvo objavljivanje i test (još uvek pre spajanja u `main`)
1. Commit i push grane: `git push -u origin adriahost`. Push sam pokreće GitHub → Actions → **Deploy**
   (objavljuje samo na Supabase i AdriaHost; Vercel ne dira). Ako je neki secret ili variable falio, posle dopune:
   Actions → Deploy → poslednji run → **Re-run all jobs**.
2. Oba posla moraju biti zelena: „Supabase functions“ i „Site to AdriaHost“.
3. Proveri na `https://belgrademagicfestival.rs` (ako DNS još ne pokazuje na AdriaHost, na privremenoj adresi iz panela):
   - [ ] `/` engleski, `/sr/` srpski, `/en` preusmerava na `/`, `http://` i `www.` na `https://belgrademagicfestival.rs`
   - [ ] forma: ispravna prijava → poruka o uspehu, prijava u Supabase tabeli, mejl organizatoru (srpski) i posetiocu
   - [ ] isti email dva puta → poruka o duplikatu; prazna polja → crvene poruke
   - [ ] `/karte/#<ADMIN_KEY>`: lista, filteri, promena statusa (ostaje posle osvežavanja), CSV se otvara u Excel-u sa č/ć/ž
   - [ ] `/karte/#pogresan` → „Pogrešan ključ.“
   - [ ] `https://pnpylpzcgoulsivplhip.supabase.co/functions/v1/tickets?ping=1` u pretraživaču piše `ok`
   - [ ] telefon: hero, brojač, forma, `/karte`

### Korak 6 — Buđenje baze (AdriaHost → Cron Jobs)
Jednom nedeljno, npr. ponedeljkom u 07:00:
```
curl -s "https://pnpylpzcgoulsivplhip.supabase.co/functions/v1/tickets?ping=1" > /dev/null
```

### Korak 7 — Resend domen (da potvrde stižu svima)
1. Resend → Domains → Add `belgrademagicfestival.rs`.
2. Zapise koje Resend pokaže (DKIM `resend._domainkey`, MX i SPF na poddomenu za slanje) unesi u AdriaHost DNS.
   Glavni MX i glavni SPF domena **ne dirati** (na njima je AdriaHost mejl).
3. Kad piše „Verified“, u Supabase secrets promeni `RESEND_FROM` na npr. `Belgrade Magic Festival <prijave@belgrademagicfestival.rs>`.
4. Kad sanduče proradi, `site.contactEmail` u oba JSON-a promeni na novu adresu (isto u oba).

### Korak 8 — Prebacivanje
Kad sve iz koraka 5 prolazi:
```bash
git switch main
git merge adriahost
git push
```
Push na `main` sam objavi sajt i funkcije. Vercel projekat ostavi još nedelju dana kao rezervu, pa ga ugasi
(posle spajanja Vercel build na `main` više ne prolazi, i to je očekivano).

---

## 3. Šta se promenilo za posetioce i za tebe

- Država u formi se popunjava iz jezika pretraživača (ranije iz IP adrese). Za Srbiju i region obično isto.
- Stranica za organizatora: **`/karte/#ključ`** umesto `/karte/ključ`. Sačuvaj novi link.
- Neplaćene prijave više ne ističu same posle 7 dana i nema mejla podsetnika. Status menjaš na `/karte`.
  Tekst u formi i mejlu koji pominje da se mesto čuva 7 dana (`doneHold` i `emails.confirmation.hold` u JSON-u)
  i dalje važi kao pravilo, samo ga ti sprovodiš ručno; po želji promeni tekst.
- Prvi poziv funkcije posle duže pauze traje oko pola sekunde duže.

---

## 4. Česte greške

- **Forma javlja mrežnu grešku**: u `ALLOWED_ORIGINS` nedostaje tačna adresa (sa `https://`, bez `/` na kraju), ili
  `NEXT_PUBLIC_FUNCTIONS_URL` nije postavljen u GitHub Variables (tada forma šalje na „undefined/register“).
- **401 od funkcije**: funkcija objavljena bez `supabase/config.toml` (`verify_jwt = false`). Ponovi Deploy.
- **Build pada „sr.json / en.json disagree“**: neka vrednost iz `DATA_KEYS` (datum, cena, slika…) nije ista u oba JSON-a.
- **`/` daje 404 na AdriaHost-u**: `.htaccess` nije stigao na server (FTP klijenti nekad sakrivaju fajlove sa tačkom).
- **Mejlovi stižu samo tebi**: Resend domen nije verifikovan ili je `RESEND_FROM` i dalje `onboarding@resend.dev`.
- **FTP korak pada**: u `deploy.yml` promeni `protocol: ftps` u `protocol: ftp`; proveri `FTP_DIR`.
- **Funkcija javlja grešku uvoza `_shared/…`**: deploy je preskočio `node scripts/sync-functions.mjs` (u workflow-u je
  pre deploy-a; lokalno ga pokreni ručno pre `supabase functions deploy`).
- **VS Code podvlači fajlove u `supabase/functions`**: to je Deno kod, a VS Code ga proverava kao Node. Bezopasno;
  ekstenzija „Deno“ to rešava.

---

## 5. Povratak nazad

Dok `adriahost` nije spojen u `main`, ništa se ne vraća: Vercel radi kao pre. Posle spajanja, ako nešto ne radi:
`git revert -m 1 <merge-commit>` na `main` i push. Vercel opet napravi stari sajt, a domen u AdriaHost DNS-u usmeri na Vercel
(`A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com`).

---

## 6. Ako radiš sa ChatGPT-om

Pošalji mu ovaj dokument i `README.md`. Pravila projekta koja ne sme da prekrši:
- sav tekst je u `content/sr.json` i `content/en.json` (izmena uvek u oba; vrednosti iz `DATA_KEYS` u `src/lib/content.ts` moraju biti iste);
- cena se računa samo u funkciji `register` (`computePrice`), validacija je ista šema (`src/lib/schema.ts`) na sajtu i u funkciji;
- deljeni kod se menja samo u `src/lib/…`, nikad u `supabase/functions/_shared/` (generiše se);
- tajni ključevi samo u Supabase secrets i GitHub secrets, nikad u kodu ni u chatu;
- ništa što zavisi od trenutnog vremena se ne renderuje pri buildu (inače React greška #418);
- `src/app/globals.css` i `src/components/Hero.tsx` imaju CRLF kraj reda.
