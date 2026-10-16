import { MapTiles } from "./MapTiles";

type Place = { name: string; address: string; lat: number; lng: number };

export function LocationMap({
  place,
  openHref,
  labels,
}: {
  place: Place;
  openHref: string;
  labels: { directions: string; openMap: string };
}) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  return (
    <figure className="map">
      <MapTiles lat={place.lat} lng={place.lng} />
      <span className="map__pin" aria-hidden="true">
        <span className="map__pin-head">
          <span>♦</span>
        </span>
      </span>
      <figcaption className="map__card">
        <b className="map__name">{place.name}</b>
        <span className="map__address">{place.address}</span>
        <span className="map__actions">
          <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn--small">
            {labels.directions}
          </a>
          <a href={openHref} target="_blank" rel="noopener noreferrer" className="link-arrow">
            {labels.openMap}
          </a>
        </span>
      </figcaption>
      <a className="map__credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
        © OpenStreetMap
      </a>
    </figure>
  );
}
