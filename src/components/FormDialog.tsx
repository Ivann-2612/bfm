"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = { url: string; title: string; open: string; newTab: string; close: string; loading: string };

const embedUrl = (url: string) => {
  const u = new URL(url);
  u.searchParams.set("embedded", "true");
  return u.toString();
};

export function FormDialog({ url, title, open, newTab, close, loading }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [src, setSrc] = useState("");

  const show = useCallback(() => {
    setSrc(embedUrl(url));
    dialog.current?.showModal();
  }, [url]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href$="#prijava"]');
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      show();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [show]);

  return (
    <>
      <button type="button" className="btn register-link__btn" onClick={show}>
        {open}
      </button>
      <dialog ref={dialog} className="form-dialog" aria-label={title} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className="form-dialog__box">
          <div className="form-dialog__bar">
            <span className="form-dialog__title">
              <span aria-hidden="true">♦</span> {title}
            </span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="form-dialog__tab">
              {newTab} ↗
            </a>
            <button type="button" className="form-dialog__close" onClick={() => dialog.current?.close()} aria-label={close}>
              ×
            </button>
          </div>
          {src && (
            <iframe src={src} title={title}>
              {loading}
            </iframe>
          )}
        </div>
      </dialog>
    </>
  );
}
