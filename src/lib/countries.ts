// ISO 3166-1 alpha-2 codes; names come from Intl.DisplayNames in the visitor's language,
// so the list needs no translations of its own.
const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
  "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG " +
  "UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW";

// XK is left out deliberately (sensitive for a Serbian organiser); anyone can still type any value.
// Serbia and the region first: most registrations come from here.
const FIRST = ["RS", "BA", "HR", "ME", "MK", "SI"];

/** Name of a country code from our list (anything else, including XK, gives null). */
export function countryFromCode(code: string | null | undefined, locale: string): string | null {
  const c = code?.toUpperCase();
  if (!c || !/^[A-Z]{2}$/.test(c) || !CODES.split(" ").includes(c)) return null;
  return new Intl.DisplayNames([locale], { type: "region" }).of(c) ?? null;
}

/** Region from the browser's language settings ("sr-RS" → "RS"); a fallback when the server can't tell. */
export function browserRegion(): string | null {
  for (const tag of navigator.languages ?? [navigator.language]) {
    try {
      const region = new Intl.Locale(tag).maximize().region;
      if (region) return region;
    } catch {}
  }
  return null;
}

/** Country names in the given locale, region first, then alphabetical. Call in the browser only
 *  (ICU data can differ between Node and browsers, which would cause hydration mismatches). */
export function countryNames(locale: string): string[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const name = (code: string) => names.of(code) ?? code;
  const rest = CODES.split(" ")
    .filter((c) => !FIRST.includes(c))
    .map(name)
    .sort((a, b) => a.localeCompare(b, locale));
  return [...FIRST.map(name), ...rest];
}
