"use client";

import { useEffect, useState } from "react";

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
