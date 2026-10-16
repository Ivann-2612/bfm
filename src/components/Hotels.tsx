import { site } from "@/lib/content";
import { HotelMap } from "./HotelMap";
import { SectionHead, type LangProps } from "./ui";

export function Hotels({ lang }: LangProps) {
  const s = site(lang);
  const h = s.c.hotels;
  if (h.rooms.length === 0) return null;
  const place = h.location;
  const google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address}`)}`;
  const fmt = new Intl.NumberFormat(s.c.site.locale, {
    style: "currency",
    currency: h.priceCurrency,
    maximumFractionDigits: 0,
  });

  return (
    <section id="smestaj" className="section hotels" aria-labelledby="hotels-title">
      <div className="wrap hotels__grid">
        <div>
          <SectionHead id="hotels-title" kicker={h.kicker} title={h.title} intro={h.intro} />
          <HotelMap place={place} googleHref={google} labels={{ directions: s.c.ui.directions, openMap: s.c.ui.openGoogleMaps }} />
        </div>
        <div>
          <ul className="hotels__rooms">
            {h.rooms.map((r) => {
              const soldOut = "soldOut" in r && r.soldOut === true;
              return (
                <li key={r.label} className={soldOut ? "is-sold-out" : undefined}>
                  <span className="hotels__room">
                    {r.label}
                    {r.note && <small>{r.note}</small>}
                  </span>
                  {soldOut ? (
                    <span className="hotels__sold">{s.c.ui.soldOutLabel}</span>
                  ) : (
                    <span className="hotels__price">
                      {fmt.format(r.price)} <small>/ {s.c.ui.perNight}</small>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="hotels__note">{h.note}</p>
        </div>
      </div>
    </section>
  );
}
