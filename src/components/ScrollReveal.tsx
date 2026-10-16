"use client";

import { useEffect } from "react";

const TARGETS = [
  ".section-head",
  ".program",
  ".artist",
  ".lecturers__grid > li",
  ".gallery__item",
  ".pricelist",
  ".hotels__rooms",
  ".organizers__orgs > li",
  ".vision__grid > *",
  ".history__grid > *",
  ".closing__inner",
].join(",");

export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(TARGETS));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.reveal = "in";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const el of els) {
      const i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--reveal-delay", `${(i % 6) * 70}ms`);
      el.dataset.reveal = "pending";
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return null;
}
