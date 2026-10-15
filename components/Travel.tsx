import { site } from "@/lib/content";
import { LocationMap } from "./LocationMap";
import { SectionHead, type LangProps } from "./ui";

export function Travel({ lang }: LangProps) {
  const s = site(lang);
  const { travel, ui } = s.c;
  const { transport } = travel;
  const venue = travel.locations[0];
  const osm = `https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=17/${venue.lat}/${venue.lng}`;

  return (
    <section id="lokacija" className="section travel" aria-labelledby="travel-title">
      <div className="wrap">
        <SectionHead id="travel-title" kicker={travel.kicker} title={travel.title} />
        <div className="travel__grid">
          <LocationMap place={venue} openHref={osm} labels={ui} />
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
