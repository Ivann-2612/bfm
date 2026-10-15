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

// Schedule groups are left out on purpose: inactive tabs are hidden, so they would never
// intersect and would stay invisible after switching tabs.
// Fades sections in once as they scroll into view. Uses a data attribute (never className)
// so React re-renders of client components can't wipe it. Without JS, or with reduced
// motion, nothing is hidden.
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
      // Stagger siblings in the same row a little.
      const i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--reveal-delay", `${(i % 6) * 70}ms`);
      el.dataset.reveal = "pending";
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return null;
}
