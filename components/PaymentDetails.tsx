"use client";

import { useState } from "react";
import { getContent, type Lang } from "@/lib/content";

type Row = { label: string; display: string; copy: string };

// navigator.clipboard needs a secure context; fall back to a hidden textarea otherwise.
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function PaymentDetails({
  lang,
  amount,
  amountDisplay,
  reference,
}: {
  lang: Lang;
  /** Plain number for the clipboard (banking apps reject "99 €"). */
  amount: number;
  amountDisplay: string;
  reference: string;
}) {
  const r = getContent(lang).registration;
  const L = r.labels;
  const methods = r.payment.methods;
  const [methodId, setMethodId] = useState(methods[0].id);
  const [copied, setCopied] = useState<string | null>(null);
  const method = methods.find((m) => m.id === methodId) ?? methods[0];

  const rows: Row[] = [
    ...method.fields.map((f) => ({ label: f.label, display: f.copy, copy: f.copy })),
    { label: L.amount, display: amountDisplay, copy: String(amount) },
    { label: L.reference, display: reference, copy: reference },
  ];

  async function onCopy(row: Row) {
    if (await copyText(row.copy)) {
      setCopied(row.label);
      setTimeout(() => setCopied((c) => (c === row.label ? null : c)), 2000);
    }
  }

  return (
    <div className="pay">
      <h4 className="pay__title">{L.payTitle}</h4>

      {methods.length > 1 && (
        <fieldset className="pay__methods">
          <legend>{L.payChoose}</legend>
          {methods.map((m) => (
            <label key={m.id} className={`pay__method ${m.id === methodId ? "is-active" : ""}`}>
              <input type="radio" name="payMethod" value={m.id} checked={m.id === methodId} onChange={() => setMethodId(m.id)} />
              {m.label}
            </label>
          ))}
        </fieldset>
      )}

      <dl className="pay__rows">
        {rows.map((row) => (
          <div key={row.label} className="pay__row">
            <dt>{row.label}</dt>
            <dd>
              <span className="pay__value">{row.display}</span>
              <button type="button" className="pay__copy" onClick={() => onCopy(row)} aria-label={`${L.copyButton}: ${row.label}`}>
                {copied === row.label ? `✓ ${L.copied}` : L.copyButton}
              </button>
            </dd>
          </div>
        ))}
      </dl>
      {method.note && <p className="pay__note">{method.note}</p>}
      <p className="visually-hidden" aria-live="polite">
        {copied ? `${L.copied}: ${copied}` : ""}
      </p>
    </div>
  );
}
