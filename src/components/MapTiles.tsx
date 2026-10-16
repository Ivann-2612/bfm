
const ZOOM = 17;
const TILE = 256;
const COLS = 5;
const ROWS = 3;

function project(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  return { x, y };
}

export function MapTiles({ lat, lng }: { lat: number; lng: number }) {
  const { x, y } = project(lat, lng, ZOOM);
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const px = (x - tx) * TILE;
  const py = (y - ty) * TILE;
  const halfC = Math.floor(COLS / 2);
  const halfR = Math.floor(ROWS / 2);

  const tiles = [];
  for (let r = -halfR; r <= halfR; r++) {
    for (let c = -halfC; c <= halfC; c++) {
      tiles.push({ x: tx + c, y: ty + r, left: (c + halfC) * TILE, top: (r + halfR) * TILE });
    }
  }

  return (
    <div className="map__viewport" aria-hidden="true">
      <div
        className="map__tiles"
        style={{
          width: COLS * TILE,
          height: ROWS * TILE,
          left: `calc(50% - ${halfC * TILE + px}px)`,
          top: `calc(50% - ${halfR * TILE + py}px)`,
        }}
      >
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element -- third-party tiles, no optimisation wanted
          <img
            key={`${t.x}-${t.y}`}
            src={`https://tile.openstreetmap.org/${ZOOM}/${t.x}/${t.y}.png`}
            alt=""
            width={TILE}
            height={TILE}
            loading="lazy"
            decoding="async"
            style={{ left: t.left, top: t.top }}
          />
        ))}
      </div>
    </div>
  );
}
