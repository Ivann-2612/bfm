"use client";

import { useEffect, useState } from "react";

// Phones only (see CSS): the header has no Register button there, so once the hero's own
// button has scrolled away, a floating one takes over, until the form itself is on screen.
export function StickyCta({ label }: { label: string }) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const form = document.getElementById("prijava");
    if (!hero || !form) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setHeroVisible(e.isIntersecting);
        if (e.target === form) setFormVisible(e.isIntersecting);
      }
    });
    io.observe(hero);
    io.observe(form);
    return () => io.disconnect();
  }, []);

  if (heroVisible || formVisible) return null;
  return (
    <a href="#prijava" className="sticky-cta">
      {label}
    </a>
  );
}
