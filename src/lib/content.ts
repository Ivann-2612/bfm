import sr from "@content/sr.json";
import en from "@content/en.json";

export type Content = typeof sr;
export const LANGS = ["sr", "en"] as const;
export type Lang = (typeof LANGS)[number];
/** Language of the site root "/" (the other language lives under its own prefix). */
export const DEFAULT_LANG: Lang = "en";
/** The organisers work in Serbian: their emails and the /karte page use this, whatever the site default. */
export const ORGANIZER_LANG: Lang = "sr";

const all: Record<Lang, Content> = { sr, en };
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);
export const getContent = (lang: Lang) => all[lang];

/** The default language lives at "/", every other language under its own prefix. */
export const homePath = (lang: Lang) => (lang === DEFAULT_LANG ? "/" : `/${lang}`);
export const privacyPath = (lang: Lang) => (lang === DEFAULT_LANG ? "/privacy" : `/${lang}/privacy`);
export const otherLang = (lang: Lang): Lang => (lang === "sr" ? "en" : "sr");

// Lists that may be empty in the JSON need explicit shapes (an empty JSON array infers never[]).
export type Lecturer = { name: string; country: string; specialty: string; photo: string; bio: string };
export type JuryMember = { name: string; country: string; code?: string; role: string; photo: string; bio: string };
/** Set "hidden": true in the JSON to keep an entry without showing it (e.g. until a photo arrives). */
/** code: ISO country code, shown as /flags/<code>.svg next to the country. */
export type Artist = { name: string; country: string; code?: string; photo: string; bio: string; hidden?: boolean };
export type Partner = { name: string; logo: string; url: string };
export type ScheduleItem = { time: string; title: string; place?: string; text?: string; highlight?: boolean };

export type Suit = "clubs" | "spades" | "hearts" | "diamonds";
// Alternating black/red so even a two-day event shows both colours.
export const SUITS: Suit[] = ["spades", "hearts", "clubs", "diamonds"];
export const SUIT_GLYPH: Record<Suit, string> = { clubs: "♣", spades: "♠", hearts: "♥", diamonds: "♦" };
export const isRed = (s: Suit) => s === "hearts" || s === "diamonds";

/** Replaces {key} placeholders in copy from the JSON. */
export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? `{${k}}`));

export const firstWord = (s: string) => s.split(" ")[0];
export const restWords = (s: string) => s.split(" ").slice(1).join(" ");

function build(c: Content) {
  // Every date on the page comes from schedule.days; each day gets a suit in order,
  // and that suit follows the day everywhere it is mentioned.
  const days = c.schedule.days.map((d, i) => ({ ...d, suit: SUITS[i % SUITS.length] }));

  // Dates are calendar days, not instants: always format in UTC so server and
  // browser render the same string (no hydration mismatch).
  const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(c.site.locale, { timeZone: "UTC", ...opts }).format(new Date(`${date}T00:00:00Z`));

  const dayNum = (date: string) => fmt(date, { day: "numeric" });
  const longDate = (date: string) => fmt(date, { day: "numeric", month: "long" });

  return {
    c,
    days,
    dayFor(date: string) {
      const day = days.find((d) => d.date === date);
      if (!day) throw new Error(`${c.site.lang}.json: ${date} is not a day in schedule.days`);
      return day;
    },
    dayNum,
    longDate,
    weekday: (date: string) => fmt(date, { weekday: "long" }),
    shortWeekday: (date: string) => fmt(date, { weekday: "short" }),
    monthYear: (date: string) => fmt(date, { month: "long", year: "numeric" }),
    /** "27–28. februar 2027." / "27–28 February 2027" — built from event dates, never typed by hand. */
    dateRange: () => {
      const { startDate, endDate, year } = c.event;
      return c.site.lang === "en"
        ? `${dayNum(startDate)}–${longDate(endDate)} ${year}`
        : `${dayNum(startDate)}–${longDate(endDate)} ${year}.`;
    },
    formatInstant: (iso: string) =>
      new Intl.DateTimeFormat(c.site.locale, { day: "numeric", month: "long", year: "numeric", timeZone: c.site.timeZone }).format(
        new Date(iso),
      ),
    money: (amount: number) =>
      new Intl.NumberFormat(c.site.locale, { style: "currency", currency: c.site.currency, maximumFractionDigits: 0 }).format(amount),
    lecturers: c.lecturers.items as Lecturer[],
    jury: c.jury.items as JuryMember[],
    partners: c.partners as Partner[],
  };
}

export type Site = ReturnType<typeof build>;
const sites: Record<Lang, Site> = { sr: build(sr), en: build(en) };
/** Content plus locale-aware helpers for one language. */
export const site = (lang: Lang) => sites[lang];

// ---- Build-time checks: fail the build instead of shipping inconsistent data. ----

// Keys whose values are data, not text: they must be identical in every language.
const DATA_KEYS = new Set([
  "date", "startDate", "endDate", "time", "year", "early", "regular", "price", "priceFrom", "max",
  "id", "src", "width", "height", "lat", "lng", "earlyBirdUntil", "youtubeId", "href", "url", "logo",
  "highlight", "hidden", "allowExtras", "copy", "code", "currency", "timeZone", "contactEmail", "instagram", "startsAt", "iban", "swift",
]);

function compare(a: unknown, b: unknown, path: string) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      throw new Error(`sr.json / en.json: ${path} has a different number of entries`);
    }
    a.forEach((x, i) => compare(x, b[i], `${path}[${i}]`));
    return;
  }
  if (a && typeof a === "object") {
    const bo = (b ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(a)) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in bo)) throw new Error(`en.json is missing ${p}`);
      if (DATA_KEYS.has(k) && (typeof v !== "object" || v === null || Array.isArray(v))) {
        if (JSON.stringify(v) !== JSON.stringify(bo[k])) throw new Error(`sr.json / en.json disagree on ${p}: ${String(v)} vs ${String(bo[k])}`);
      } else {
        compare(v, bo[k], p);
      }
    }
  }
}

(function checkConsistency() {
  compare(sr, en, "");
  for (const lang of LANGS) {
    const s = sites[lang];
    const { event } = s.c;
    const first = s.days[0]?.date;
    const last = s.days[s.days.length - 1]?.date;
    if (first !== event.startDate || last !== event.endDate) {
      throw new Error(`${lang}.json: event runs ${event.startDate}–${event.endDate} but schedule covers ${first}–${last}`);
    }
    if (Number(event.startDate.slice(0, 4)) !== event.year) {
      throw new Error(`${lang}.json: event.year ${event.year} does not match startDate ${event.startDate}`);
    }
    for (const p of s.c.programs.items) for (const show of p.shows) s.dayFor(show.date);
    if (!event.countdown.startsAt.startsWith(event.startDate)) {
      throw new Error(`${lang}.json: countdown starts ${event.countdown.startsAt}, festival on ${event.startDate}`);
    }
    const ids = s.c.packages.items.map((p) => p.id);
    if (new Set(ids).size !== ids.length) throw new Error(`${lang}.json: duplicate package id`);
  }
})();
