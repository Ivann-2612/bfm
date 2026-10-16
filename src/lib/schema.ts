import { z } from "zod";
import { getContent, LANGS, type Lang } from "./content";

const cache = new Map<Lang, ReturnType<typeof build>>();

function build(lang: Lang) {
  const c = getContent(lang);
  const e = c.registration.errors;
  const packageIds = c.packages.items.map((p) => p.id);
  const extraIds = c.packages.extras.map((x) => x.id) as [string, ...string[]];
  const maxExtra = Math.max(...c.packages.extras.map((x) => x.max));
  const required = (error: string) => z.string({ error }).trim().min(1, { error });

  return z.object({
    lang: z.enum(LANGS).catch(lang),
    firstName: required(e.firstName).max(80),
    lastName: required(e.lastName).max(80),
    email: z
      .string({ error: e.email })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: e.emailFormat }))
      .pipe(z.string().max(200)),
    phone: z.string().trim().max(40).optional().default(""),
    country: required(e.country).max(80),
    packageId: z.string({ error: e.package }).refine((id) => packageIds.includes(id), { error: e.package }),
    extras: z
      .partialRecord(z.enum(extraIds), z.coerce.number({ error: e.invalid }).int().min(0).max(maxExtra), { error: e.invalid })
      .optional()
      .default({}),
    notes: z.string().trim().max(1000, { error: e.notesLength }).optional().default(""),
    consent: z.literal(true, { error: e.consent }),
    turnstileToken: z.string().optional(),
  });
}

export function registrationSchema(lang: Lang) {
  let s = cache.get(lang);
  if (!s) cache.set(lang, (s = build(lang)));
  return s;
}

export type Registration = z.output<ReturnType<typeof build>>;

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
