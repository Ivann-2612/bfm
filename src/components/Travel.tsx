import { site } from "@/lib/content";
import { SectionHead, type LangProps } from "./ui";

export function Travel({ lang }: LangProps) {
  const s = site(lang);
  const { travel, ui } = s.c;
  const { transport } = travel;
  const { lat, lng } = travel.center;
  // The bbox is centred on the venue, so the venue is always the centre of the iframe
  // and our own pin can sit there without knowing the map's projection.
  const d = 0.0035;
  const bbox = [lng - d * 1.6, lat - d, lng + d * 1.6, lat + d].join(",");
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  const venue = travel.locations[0];

  return (
    <section id="lokacija" className="section travel" aria-labelledby="travel-title">
      <div className="wrap">
        <SectionHead id="travel-title" kicker={travel.kicker} title={travel.title} />
        <div className="travel__grid">
          <div className="travel__map">
            <div className="travel__frame">
              <iframe src={mapSrc} title={travel.title} loading="lazy" />
              <span className="travel__pin" aria-hidden="true">
                <span className="travel__pin-label">{venue.name}</span>
                <span className="travel__pin-head">
                  <span>♦</span>
                </span>
              </span>
            </div>
            <ul className="travel__places">
              {travel.locations.map((l) => (
                <li key={l.name}>
                  <b>{l.name}</b>
                  <span>{l.address}</span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=17/${l.lat}/${l.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-arrow"
                  >
                    {ui.openMap}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="travel__transport">
            <h3>{transport.title}</h3>
            <p>{transport.text}</p>
            <dl className="travel__airports">
              {transport.airports.map((a) => (
                <div key={a.name}>
                  <dt>{a.name}</dt>
                  <dd>
                    {a.distance} · {a.duration}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
