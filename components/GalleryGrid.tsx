"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Item = { src: string; alt: string };
type Labels = { open: string; close: string; prev: string; next: string };

// Native <dialog> gives focus trapping, Esc to close and a backdrop for free.
export function GalleryGrid({ items, labels }: { items: Item[]; labels: Labels }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : items[index];

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (d: number) => setIndex((i) => (i === null ? i : (i + d + items.length) % items.length));

  return (
    <>
      <ul className="gallery__grid">
        {items.map((it, i) => (
          <li key={it.src} className={`gallery__item gallery__item--${i % 6}`}>
            <figure>
              <button type="button" className="gallery__img" onClick={() => open(i)} aria-label={`${labels.open}: ${it.alt}`}>
                <Image src={it.src} alt="" fill sizes="(min-width: 900px) 33vw, 50vw" />
              </button>
              <figcaption>{it.alt}</figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={current?.alt}
        onClose={() => setIndex(null)}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {current && index !== null && (
          <figure className="lightbox__figure">
            <div className="lightbox__img">
              <Image src={current.src} alt={current.alt} fill sizes="100vw" />
            </div>
            <figcaption>
              <span>{current.alt}</span>
              <span className="lightbox__count">
                {index + 1} / {items.length}
              </span>
            </figcaption>
          </figure>
        )}
        <button type="button" className="lightbox__btn lightbox__close" onClick={() => dialog.current?.close()} aria-label={labels.close}>
          ×
        </button>
        <button type="button" className="lightbox__btn lightbox__prev" onClick={() => step(-1)} aria-label={labels.prev}>
          ‹
        </button>
        <button type="button" className="lightbox__btn lightbox__next" onClick={() => step(1)} aria-label={labels.next}>
          ›
        </button>
      </dialog>
    </>
  );
}
