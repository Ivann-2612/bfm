import Image from "next/image";
import { fill, firstWord, restWords, site } from "@/lib/content";
import { SuitMark, type LangProps } from "./ui";
import { MagicDeck } from "./MagicDeck";
import { Countdown } from "./Countdown";

export function Hero({ lang }: LangProps) {
  const s = site(lang);
  const { event, ui } = s.c;

  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <MagicDeck />
      <div className="wrap hero__inner">
        <div className="hero__text">
          <Countdown
            startsAt={event.countdown.startsAt}
            label={event.countdown.label}
            when={`${s.longDate(event.startDate)}, ${event.countdown.startsAt.slice(11, 16)}`}
            units={event.countdown.units}
            done={event.countdown.done}
          />

          <p className="kicker hero__kicker">
            {event.city} · {event.venue} · {event.year}
          </p>

          <h1 id="hero-title" className="hero__title">
            <span className="hero__line hero__line--a">{firstWord(event.name)}</span>
            <span className="hero__line hero__line--b">{restWords(event.name)}</span>
          </h1>

          <p className="hero__tagline">{event.tagline}</p>

          <p className="hero__dates">
            <span className="visually-hidden">{s.dateRange()}</span>
            {/* Each card jumps to that day's column in the schedule (#tab-<date>). */}
            <span className="hero__deal">
              {s.days.map((d, i) => (
                <a
                  key={d.date}
                  href={`#tab-${d.date}`}
                  className="hero__card"
                  style={{ "--i": i } as React.CSSProperties}
                  aria-label={fill(ui.dayLink, { date: `${s.weekday(d.date)}, ${s.longDate(d.date)}` })}
                >
                  <SuitMark suit={d.suit} />
                  {s.dayNum(d.date)}
                </a>
              ))}
            </span>
            <span aria-hidden="true" className="hero__month">
              {s.monthYear(event.endDate)}
            </span>
          </p>

          <p className="hero__intro">{event.intro}</p>

          <div className="hero__actions">
            <a href="#program" className="btn">
              {ui.seeProgramme}
            </a>
            <a href="#prijava" className="link-arrow">
              {ui.register}
            </a>
          </div>

          <ul className="hero__stats">
            {event.stats.map((st) => (
              <li key={st.label}>
                <b>{st.value}</b> {st.label}
              </li>
            ))}
          </ul>
        </div>

        {event.poster.translatedTitle ? (
          // The poster lettering is baked into the image; a language whose poster text doesn't match can
          // set translatedTitle to show the text-free stage crop with the title and slogan as real text.
          <figure className="hero__poster">
            <div className="poster" role="img" aria-label={`${event.poster.translatedTitle.replace("|", " ")} ${event.year} — ${event.tagline}`}>
              <div className="poster__top" aria-hidden="true">
                <p className="poster__title">
                  {event.poster.translatedTitle.split("|").map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
                <p className="poster__year">
                  <span />
                  {event.year}
                  <span />
                </p>
                <p className="poster__tagline">{event.tagline}</p>
              </div>
              <Image
                src={event.poster.scene.src}
                alt=""
                width={event.poster.scene.width}
                height={event.poster.scene.height}
                sizes="(min-width: 960px) 34vw, 80vw"
                priority
                className="poster__scene"
              />
            </div>
          </figure>
        ) : (
          <figure className="hero__poster">
            <Image
              src={event.poster.src}
              alt={event.poster.alt}
              width={event.poster.width}
              height={event.poster.height}
              sizes="(min-width: 960px) 34vw, 80vw"
              priority
            />
          </figure>
        )}
      </div>
    </section>
  );
}
