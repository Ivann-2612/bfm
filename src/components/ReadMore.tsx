"use client";

import { useId, useState } from "react";

export function ReadMore({ text, more, less, className }: { text: string; more: string; less: string; className: string }) {
  const [first, ...rest] = text.split("\n\n");
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <p className={className}>{first}</p>
      {rest.length > 0 && (
        <>
          <div id={id} className="read-more__rest" hidden={!open}>
            {rest.map((para) => (
              <p key={para} className={className}>
                {para}
              </p>
            ))}
          </div>
          <button type="button" className="read-more" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
            {open ? less : more}
          </button>
        </>
      )}
    </>
  );
}
