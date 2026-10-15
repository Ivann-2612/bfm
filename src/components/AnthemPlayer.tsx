"use client";

import { useEffect, useRef, useState } from "react";

// A small player in the site's style: gold play button, seekable progress line, elapsed and
// total time, and five equaliser bars that move only while the song plays. The file is not
// downloaded until someone presses play (preload="none").
const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "–:––";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function AnthemPlayer({ src, title, labels }: { src: string; title: string; labels: { play: string; pause: string; seek: string } }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(NaN);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
    };
  }, []);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const pct = Number.isFinite(duration) && duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div className={`anthem__player ${playing ? "is-playing" : ""}`}>
      <audio ref={audio} src={src} preload="none" />
      <button type="button" className="anthem__play" onClick={toggle} aria-label={playing ? labels.pause : labels.play}>
        {playing ? (
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className="anthem__body">
        <div className="anthem__head">
          <b className="anthem__title">{title}</b>
          <span className="anthem__eq" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
        <input
          type="range"
          className="anthem__seek"
          min={0}
          max={Number.isFinite(duration) ? duration : 0}
          step={0.1}
          value={time}
          onChange={(e) => {
            const a = audio.current;
            if (a) a.currentTime = Number(e.target.value);
          }}
          aria-label={labels.seek}
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
          disabled={!Number.isFinite(duration)}
        />
        <p className="anthem__time">
          <span>{fmt(time)}</span>
          <span>{fmt(duration)}</span>
        </p>
      </div>
    </div>
  );
}
