import { site } from "@/lib/content";
import { MapTiles } from "./MapTiles";
import { SectionHead, type LangProps } from "./ui";

export function Travel({ lang }: LangProps) {
  const s = site(lang);
  const { travel, ui } = s.c;
  const { transport } = travel;
  const venue = travel.locations[0];
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;
  const osm = `https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=17/${venue.lat}/${venue.lng}`;

  return (
    <section id="lokacija" className="section travel" aria-labelledby="travel-title">
      <div className="wrap">
        <SectionHead id="travel-title" kicker={travel.kicker} title={travel.title} />
        <div className="travel__grid">
          <figure className="map">
            <MapTiles lat={venue.lat} lng={venue.lng} />
            <span className="map__pin" aria-hidden="true">
              <span className="map__pin-head">
                <span>♦</span>
              </span>
            </span>
            <figcaption className="map__card">
              <b className="map__name">{venue.name}</b>
              <span className="map__address">{venue.address}</span>
              <span className="map__actions">
                <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn--small">
                  {ui.directions}
                </a>
                <a href={osm} target="_blank" rel="noopener noreferrer" className="link-arrow">
                  {ui.openMap}
                </a>
              </span>
            </figcaption>
            <a className="map__credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              © OpenStreetMap
            </a>
          </figure>
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
