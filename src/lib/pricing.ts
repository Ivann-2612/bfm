import { getContent, type Lang } from "./content";

export type PriceInput = { packageId: string; companions: number; transfer: boolean };
export type PriceLine = { label: string; amount: number };
export type Tier = "early" | "regular";
export type Quote = { tier: Tier; lines: PriceLine[]; total: number };

export function tierAt(now: Date, lang: Lang): Tier {
  return now.getTime() <= new Date(getContent(lang).packages.earlyBirdUntil).getTime() ? "early" : "regular";
}

// Used by the browser for display and by /api/register as the source of truth.
// Amounts are identical in every language (enforced in content.ts); only labels differ.
export function computePrice(input: PriceInput, now: Date, lang: Lang): Quote {
  const cfg = getContent(lang).packages;
  const pkg = cfg.items.find((p) => p.id === input.packageId);
  if (!pkg) throw new Error(`Unknown package: ${input.packageId}`);

  const tier = tierAt(now, lang);
  const lines: PriceLine[] = [
    { label: `${pkg.name}${tier === "early" ? cfg.labels.earlySuffix : ""}`, amount: pkg.price[tier] },
  ];
  if (input.companions > 0) {
    lines.push({ label: `${cfg.companion.label} × ${input.companions}`, amount: cfg.companion.price * input.companions });
  }
  if (input.transfer) {
    const people = 1 + input.companions;
    lines.push({ label: `${cfg.transfer.label} × ${people}`, amount: cfg.transfer.price * people });
  }
  return { tier, lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
}
