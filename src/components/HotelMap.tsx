import { MapTiles } from "./MapTiles";

type Place = { name: string; address: string; lat: number; lng: number };

export function HotelMap({
  place,
  googleHref,
  labels,
}: {
  place: Place;
  googleHref: string;
  labels: { directions: string; openMap: string };
}) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  return (
    <figure className="hotel-map">
      <div className="hotel-map__chip">
        <MapTiles lat={place.lat} lng={place.lng} />
        <span className="hotel-map__pin" aria-hidden="true">
          ♥
        </span>
      </div>
      <figcaption className="hotel-map__text">
        <b className="hotel-map__name">{place.name}</b>
        <span className="hotel-map__address">{place.address}</span>
        <span className="hotel-map__actions">
          <a href={directions} target="_blank" rel="noopener noreferrer" className="link-arrow">
            {labels.directions}
          </a>
          <a href={googleHref} target="_blank" rel="noopener noreferrer" className="link-arrow">
            {labels.openMap}
          </a>
        </span>
        <a className="hotel-map__credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          © OpenStreetMap
        </a>
      </figcaption>
    </figure>
  );
}
