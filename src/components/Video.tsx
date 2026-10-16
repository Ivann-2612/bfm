"use client";

import { useState } from "react";
import { getContent } from "@/lib/content";
import type { LangProps } from "./ui";

export function Video({ lang }: LangProps) {
  const { video, ui } = getContent(lang);
  const [playing, setPlaying] = useState(false);
  if (!video.youtubeId) return null;

  return (
    <section className="section video" aria-labelledby="video-title">
      <div className="wrap">
        <h2 id="video-title" className="kicker">
          {video.title}
        </h2>
        <div className="video__frame">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className="video__play"
              onClick={() => setPlaying(true)}
              style={video.poster ? { backgroundImage: `url(${video.poster})` } : undefined}
            >
              <span className="video__icon" aria-hidden="true">
                ▶
              </span>
              <span>{ui.playVideo}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
