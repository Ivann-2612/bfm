import { getContent, type Lang } from "./content";

export type PriceInput = { packageId: string; extras: Partial<Record<string, number>> };
export type PriceLine = { label: string; amount: number };
export type Tier = "early" | "regular";
export type Quote = { tier: Tier; lines: PriceLine[]; total: number; extras: Record<string, number> };

export function tierAt(now: Date, lang: Lang): Tier {
  return now.getTime() <= new Date(getContent(lang).packages.earlyBirdUntil).getTime() ? "early" : "regular";
}

export function computePrice(input: PriceInput, now: Date, lang: Lang): Quote {
  const cfg = getContent(lang).packages;
  const pkg = cfg.items.find((p) => p.id === input.packageId);
  if (!pkg) throw new Error(`Unknown package: ${input.packageId}`);

  const tier = tierAt(now, lang);
  const lines: PriceLine[] = [
    { label: `${pkg.name}${tier === "early" ? cfg.labels.earlySuffix : ""}`, amount: pkg.price[tier] },
  ];
  const extras: Record<string, number> = {};
  for (const x of cfg.extras) {
    const allowed = (pkg.allowExtras as string[]).includes(x.id);
    const qty = Math.min(Math.max(Math.trunc(input.extras[x.id] ?? 0), 0), x.max);
    if (!allowed || qty === 0) continue;
    extras[x.id] = qty;
    lines.push({ label: `${x.label} × ${qty}`, amount: x.price * qty });
  }
  return { tier, lines, total: lines.reduce((sum, l) => sum + l.amount, 0), extras };
}
