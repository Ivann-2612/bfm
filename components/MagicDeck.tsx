'use client';

import { useEffect, useRef } from 'react';

// "Magic deck": a real 3D deck (three.js) behind the hero poster. On load the cards fly up
// into a stack and fan out around the poster; then the fan breathes, now and then a card is
// moved to another place in the hand (as when sorting cards), the whole deck leans towards
// the mouse, and it folds as the hero scrolls away.
// three.js is loaded only here, after the page; with reduced motion or no WebGL nothing
// starts and the hero simply has no cards.

type Suit = '♠' | '♥' | '♣' | '♦';
// rank "JOKER" draws the joker face (drawJoker); its suit is ignored.
const DECK: { rank: string; suit: Suit }[] = [
  { rank: 'JOKER', suit: '♥' },
  { rank: '10', suit: '♠' },
  { rank: 'J', suit: '♥' },
  { rank: '7', suit: '♦' },
  { rank: '4', suit: '♠' },
  { rank: 'Q', suit: '♣' },
  { rank: '2', suit: '♣' },
  { rank: 'K', suit: '♦' },
  { rank: 'A', suit: '♠' },
  { rank: 'K', suit: '♥' },
  { rank: 'Q', suit: '♠' },
  { rank: '8', suit: '♠' },
  { rank: 'J', suit: '♦' },
  { rank: '10', suit: '♥' },
  { rank: 'K', suit: '♠' }
];
const SPREAD = (124 * Math.PI) / 180; // total fan angle
// The fan leans right (clockwise) so it stays around the poster, away from the title on the left.
const LEAN = (18 * Math.PI) / 180;
// Card thickness as a share of its width: a little thicker than real card stock so the edge reads.
const CARD_DEPTH = 0.025;
const TEX_W = 350;
const TEX_H = 494;

const isRedSuit = (s: Suit) => s === '♥' || s === '♦';
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) =>
  1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A thin darker line right at the card's edge (same corner radius as the geometry), like the
// cut edge of a printed card; it keeps overlapping cards apart.
function outline(ctx: CanvasRenderingContext2D, color: string) {
  roundRect(ctx, 1.5, 1.5, TEX_W - 3, TEX_H - 3, 0.075 * TEX_W);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

// Ivory card stock with the edge line and gold inner frame; shared by every face.
function drawFace() {
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  g.addColorStop(0, '#efe1c0');
  g.addColorStop(1, '#d3bd8f');
  // Fill edge to edge: the card geometry rounds the corners, so the texture has no transparent pixels.
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  outline(ctx, 'rgba(90, 68, 36, 0.45)');
  roundRect(ctx, 16, 16, TEX_W - 32, TEX_H - 32, 16);
  ctx.strokeStyle = '#c8a04b';
  ctx.lineWidth = 3;
  ctx.stroke();
  return { c, ctx };
}

const RED = '#b01e2c';
const INK = '#16131a';
const GOLD = '#c8a04b';

// The joker as in a real deck: "JOKER" spelled down two corners with a star, a jester in the
// middle as a full-length figure drawn from JOKER_SVG.
export function drawJoker(font: string, figure: HTMLImageElement | null) {
  const { c, ctx } = drawFace();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const corner = () => {
    ctx.fillStyle = RED;
    ctx.font = `600 27px ${font}`;
    'JOKER'.split('').forEach((ch, i) => ctx.fillText(ch, 44, 54 + i * 29));
    ctx.font = `24px ${font}`;
    ctx.fillText('★', 44, 54 + 5 * 29 + 4);
  };
  corner();
  ctx.save();
  ctx.translate(TEX_W, TEX_H);
  ctx.rotate(Math.PI);
  corner();
  ctx.restore();

  // The full-length jester (see JOKER_SVG), centred between the corner indices.
  if (figure) {
    const h = TEX_H - 120;
    const w = (h * 200) / 320;
    ctx.drawImage(figure, (TEX_W - w) / 2, 58, w, h);
  }
  ageCard(ctx, 99, 'paper');
  return c;
}

// The jester, after the classic full-length joker: three-pointed cap with bells, ruff, a tunic
// split in two colours with the four suits, two-tone tights and curled shoes, but in the site's
// velvet, gold and ink, with a magician's face (domino mask, curled moustache) and a wand.
// viewBox 200 × 320. Loaded as an image once, then painted onto the card canvas.
const I = '#f4ead2';
const JOKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320">
<g stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
  <path d="M88 212 L84 262 Q83 280 76 288 L90 290 Q96 278 97 262 L99 212 Z" fill="${RED}"/>
  <path d="M101 212 L103 262 Q104 278 110 290 L124 288 Q117 280 116 262 L112 212 Z" fill="${INK}" stroke="#000"/>
  <path d="M90 286 L76 286 Q60 288 52 278 Q54 296 76 297 L92 296 Z" fill="${GOLD}"/>
  <path d="M110 286 L124 286 Q140 288 148 278 Q146 296 124 297 L108 296 Z" fill="${RED}"/>
  <path d="M100 128 L72 132 Q63 170 72 214 L100 214 Z" fill="${RED}"/>
  <path d="M100 128 L128 132 Q137 170 128 214 L100 214 Z" fill="${INK}" stroke="#000"/>
  <path d="M72 214 L79 228 L86 214 L93 228 L100 214 L107 228 L114 214 L121 228 L128 214 Z" fill="${GOLD}"/>
  <g stroke="none" font-family="Georgia, serif" font-size="19" text-anchor="middle">
    <text x="86" y="166" fill="${I}">♥</text><text x="114" y="166" fill="${GOLD}">♣</text>
    <text x="86" y="200" fill="${GOLD}">♦</text><text x="114" y="200" fill="${I}">♠</text>
  </g>
  <path d="M74 136 Q50 152 46 188 L60 192 Q63 164 82 152 Z" fill="${GOLD}"/>
  <path d="M46 188 L50 196 L54 189 L58 197 L61 191 Z" fill="${INK}"/>
  <circle cx="54" cy="200" r="6" fill="${I}"/>
  <path d="M126 136 Q152 150 158 124 L147 119 Q142 140 124 150 Z" fill="${RED}"/>
  <path d="M147 119 L150 112 L153 120 L157 114 L159 124 Z" fill="${GOLD}"/>
  <line x1="138" y1="142" x2="180" y2="62" stroke-width="5"/>
  <line x1="176" y1="70" x2="180" y2="62" stroke="${I}" stroke-width="5"/>
  <line x1="138" y1="142" x2="141" y2="136" stroke="${I}" stroke-width="5"/>
  <circle cx="153" cy="116" r="6" fill="${I}"/>
  <g fill="${GOLD}" stroke="none">
    <path d="M186 50 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/>
    <path d="M170 46 l1.2 3.6 3.6 1.2 -3.6 1.2 -1.2 3.6 -1.2 -3.6 -3.6 -1.2 3.6 -1.2z"/>
    <path d="M192 72 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1z"/>
  </g>
  <path d="M64 128 L71 118 L78 128 L85 117 L92 128 L100 116 L108 128 L115 117 L122 128 L129 118 L136 128 Q100 142 64 128 Z" fill="${GOLD}"/>
  <ellipse cx="100" cy="100" rx="17" ry="20" fill="${I}"/>
  <path d="M81 96 Q91 86 100 94 Q109 86 119 96 Q113 105 104 101 Q100 99 96 101 Q87 105 81 96 Z" fill="${INK}" stroke="${GOLD}" stroke-width="1.4"/>
  <ellipse cx="92" cy="96" rx="3.6" ry="2.2" fill="${I}" stroke="none"/>
  <ellipse cx="108" cy="96" rx="3.6" ry="2.2" fill="${I}" stroke="none"/>
  <path d="M100 108 Q92 103 85 108 Q83 113 88 112 Q93 108 100 110 Q107 108 112 112 Q117 113 115 108 Q108 103 100 108 Z" fill="${INK}" stroke="none"/>
  <path d="M94 114 Q100 118 106 114" fill="none" stroke="${RED}" stroke-width="2.2"/>
  <path d="M97.5 118 L100 125 L102.5 118 Z" fill="${INK}" stroke="none"/>
  <path d="M84 86 Q64 56 42 78 Q60 74 76 94 Z" fill="${GOLD}"/>
  <path d="M86 84 Q88 40 112 32 Q102 50 112 82 Z" fill="${RED}"/>
  <path d="M110 82 Q134 54 158 74 Q140 72 122 92 Z" fill="${INK}" stroke="#000"/>
  <path d="M79 92 Q100 78 121 92 L119 98 Q100 87 81 98 Z" fill="${GOLD}"/>
  <circle cx="42" cy="79" r="5" fill="${GOLD}"/><circle cx="112" cy="32" r="5" fill="${GOLD}"/><circle cx="158" cy="75" r="5" fill="${GOLD}"/>
  <g stroke="${GOLD}" stroke-width="1.6" fill="none">
    <path d="M60 302 l4 -8 M70 302 l1 -9 M128 302 l-1 -9 M138 302 l-4 -8"/>
  </g>
</g></svg>`;

function loadJokerFigure(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(JOKER_SVG)}`;
  });
}

// Small seeded random, so every card ages the same way on every visit.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Old card stock: fine grain, a few faint stains, darker worn corners and edges. On the backs
// the print is rubbed lighter along the edge, as on a deck that has been played a lot.
function ageCard(
  ctx: CanvasRenderingContext2D,
  seed: number,
  kind: 'paper' | 'back'
) {
  const rand = rng(seed);
  ctx.save();
  roundRect(ctx, 0, 0, TEX_W, TEX_H, 0.075 * TEX_W);
  ctx.clip();
  for (let i = 0; i < 2600; i++) {
    const dark = rand() < 0.6;
    ctx.fillStyle = dark
      ? `rgba(70, 48, 20, ${0.03 + rand() * 0.07})`
      : `rgba(255, 250, 235, ${0.03 + rand() * 0.06})`;
    ctx.fillRect(
      rand() * TEX_W,
      rand() * TEX_H,
      1 + rand() * 1.5,
      1 + rand() * 1.5
    );
  }
  for (let i = 0; i < (kind === 'paper' ? 4 : 2); i++) {
    const x = rand() * TEX_W;
    const y = rand() * TEX_H;
    const r = 25 + rand() * 60;
    const st = ctx.createRadialGradient(x, y, 0, x, y, r);
    st.addColorStop(
      0,
      kind === 'paper' ? 'rgba(130, 90, 35, 0.07)' : 'rgba(0, 0, 0, 0.12)'
    );
    st.addColorStop(1, 'rgba(130, 90, 35, 0)');
    ctx.fillStyle = st;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const v = ctx.createRadialGradient(
    TEX_W / 2,
    TEX_H / 2,
    TEX_H * 0.32,
    TEX_W / 2,
    TEX_H / 2,
    TEX_H * 0.62
  );
  v.addColorStop(0, 'rgba(80, 52, 20, 0)');
  v.addColorStop(
    1,
    kind === 'paper' ? 'rgba(80, 52, 20, 0.22)' : 'rgba(0, 0, 0, 0.3)'
  );
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  roundRect(ctx, 3, 3, TEX_W - 6, TEX_H - 6, 0.075 * TEX_W - 2);
  ctx.strokeStyle =
    kind === 'paper' ? 'rgba(110, 76, 34, 0.22)' : 'rgba(255, 225, 190, 0.22)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle =
    kind === 'paper' ? 'rgba(90, 60, 25, 0.1)' : 'rgba(255, 230, 200, 0.08)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 6; i++) {
    const x = rand() * TEX_W;
    const y = rand() * TEX_H;
    const a = rand() * Math.PI;
    const l = 20 + rand() * 70;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  ctx.restore();
}

// Ivory face: gold inner frame, rank + suit in two corners, big pip in the middle.
function drawFront(
  rank: string,
  suit: Suit,
  font: string,
  figure: HTMLImageElement | null,
  seed: number
) {
  if (rank === 'JOKER') return drawJoker(font, figure);
  const { c, ctx } = drawFace();

  const ink = isRedSuit(suit) ? '#b01e2c' : '#16131a';
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const corner = () => {
    ctx.font = `500 58px ${font}`;
    ctx.fillText(rank, 56, 70);
    ctx.font = `46px ${font}`;
    ctx.fillText(suit, 56, 122);
  };
  corner();
  ctx.save();
  ctx.translate(TEX_W, TEX_H);
  ctx.rotate(Math.PI);
  corner();
  ctx.restore();

  ctx.font = `${rank === 'A' ? 230 : 170}px ${font}`;
  ctx.fillText(suit, TEX_W / 2, TEX_H / 2 + 8);
  ageCard(ctx, seed, 'paper');
  return c;
}

// Velvet-red back with a gold lattice and a gold spade medallion.
function drawBack(font: string) {
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  g.addColorStop(0, '#7d1a25');
  g.addColorStop(1, '#4a0d15');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  outline(ctx, 'rgba(20, 4, 8, 0.6)');
  ctx.save();
  roundRect(ctx, 22, 22, TEX_W - 44, TEX_H - 44, 12);
  ctx.clip();
  ctx.strokeStyle = 'rgba(226, 190, 110, 0.38)';
  ctx.lineWidth = 1.5;
  for (let i = -TEX_H; i < TEX_W + TEX_H; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + TEX_H, TEX_H);
    ctx.moveTo(i, TEX_H);
    ctx.lineTo(i + TEX_H, 0);
    ctx.stroke();
  }
  ctx.restore();
  roundRect(ctx, 22, 22, TEX_W - 44, TEX_H - 44, 12);
  ctx.strokeStyle = '#d9b25e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(TEX_W / 2, TEX_H / 2, 62, 0, Math.PI * 2);
  ctx.fillStyle = '#4a0d15';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e6c375';
  ctx.font = `86px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♠', TEX_W / 2, TEX_H / 2 + 4);
  ageCard(ctx, 7, 'back');
  return c;
}

export function MagicDeck() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      await document.fonts.ready;
      const figure = await loadJokerFigure();
      if (disposed) return;

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
      } catch {
        return; // no WebGL: hero without cards
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // Filmic tone mapping keeps the ivory faces from blowing out to white.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 10);

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const key = new THREE.DirectionalLight(0xfff1d6, 1.1);
      key.position.set(2, 3, 6);
      scene.add(key);
      const sheen = new THREE.PointLight(0xffd88a, 14, 0, 2); // follows the mouse
      sheen.position.set(0, 0, 3);
      scene.add(sheen);
      const rimL = new THREE.PointLight(0xc0303d, 14, 0, 2);
      rimL.position.set(-6, -1, 2);
      const rimR = rimL.clone();
      rimR.position.set(6, -1, 2);
      scene.add(rimL, rimR);

      const font =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--font-display')
          .trim() || 'Georgia, serif';
      const toTexture = (c: HTMLCanvasElement) => {
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return t;
      };
      // Real shadows: the key light casts them from the cards onto each other and onto an invisible
      // surface behind the fan, so the shadow moves with every fan, rearrangement and tilt.
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.radius = 5; // soft edge
      Object.assign(key.shadow.camera, {
        left: -8,
        right: 8,
        top: 8,
        bottom: -8,
        near: 1,
        far: 20
      });
      key.shadow.bias = -0.0008;
      key.shadow.normalBias = 0.03;
      const shadowMat = new THREE.ShadowMaterial({ opacity: 0.5 });
      const catcher = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        shadowMat
      );
      catcher.receiveShadow = true;
      scene.add(catcher);

      // A card is a rounded rectangle with real thickness: a cream paper edge (extruded body)
      // with the printed faces on both sides. Geometry rounds the corners, so edges stay smooth.
      const CARD_H = TEX_H / TEX_W;
      const shape = new THREE.Shape();
      const hw = 0.5;
      const hh = CARD_H / 2;
      const r = 0.075;
      shape.moveTo(-hw + r, -hh);
      shape.lineTo(hw - r, -hh);
      shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
      shape.lineTo(hw, hh - r);
      shape.quadraticCurveTo(hw, hh, hw - r, hh);
      shape.lineTo(-hw + r, hh);
      shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
      shape.lineTo(-hw, -hh + r);
      shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      const body = new THREE.ExtrudeGeometry(shape, {
        depth: CARD_DEPTH,
        bevelEnabled: false,
        curveSegments: 10
      });
      body.translate(0, 0, -CARD_DEPTH / 2);
      const face = new THREE.ShapeGeometry(shape, 10);
      // ShapeGeometry's UVs are the shape's coordinates; map them onto the 0–1 texture.
      const uv = face.attributes.uv;
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, uv.getX(i) + 0.5, (uv.getY(i) + hh) / CARD_H);
      const edgeMat = new THREE.MeshStandardMaterial({
        color: 0xe6dac0,
        roughness: 0.75,
        metalness: 0
      });
      const hiddenMat = new THREE.MeshBasicMaterial({ visible: false }); // the body's own caps sit under the faces

      const backTex = toTexture(drawBack(font));
      const backMat = new THREE.MeshStandardMaterial({
        map: backTex,
        roughness: 0.35,
        metalness: 0.25
      });

      // Each card: holder (rotates around the fan pivot) > card (offset by the radius; pulled out along it when moved).
      const deck = new THREE.Group();
      scene.add(deck);
      const disposables: { dispose(): void }[] = [
        backTex,
        backMat,
        body,
        face,
        edgeMat,
        hiddenMat,
        shadowMat,
        catcher.geometry
      ];
      const cards = DECK.map(({ rank, suit }, i) => {
        const frontTex = toTexture(
          drawFront(rank, suit, font, figure, 11 + i * 17)
        );
        const frontMat = new THREE.MeshStandardMaterial({
          map: frontTex,
          roughness: 0.5,
          metalness: 0.05
        });
        disposables.push(frontTex, frontMat);
        const card = new THREE.Group();
        const edge = new THREE.Mesh(body, [hiddenMat, edgeMat]);
        const front = new THREE.Mesh(face, frontMat);
        front.position.z = CARD_DEPTH / 2 + 0.0005;
        const back = new THREE.Mesh(face, backMat);
        back.rotation.y = Math.PI;
        back.position.z = -CARD_DEPTH / 2 - 0.0005;
        for (const m of [edge, front, back]) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
        card.add(edge, front, back);
        const holder = new THREE.Group();
        holder.add(card);
        deck.add(holder);
        // slot: where the card sits in the fan right now (animated, can be fractional);
        // from/to: the slots of the current rearrangement; lift: 0–1, pulled up out of the hand.
        return { holder, card, index: i, slot: i, from: i, to: i, lift: 0 };
      });

      // Fit the fan to the poster: pivot just below its centre, cards peeking out around it.
      const fit = {
        radius: 2,
        size: 1.2,
        spread: SPREAD,
        pivot: new THREE.Vector3(1.5, 0, -0.6)
      };
      const layout = () => {
        const hr = hero.getBoundingClientRect();
        const w = hr.width;
        const h = hr.height;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const unit =
          (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / h;
        const poster = hero
          .querySelector('.hero__poster')
          ?.getBoundingClientRect();
        const pw = poster ? poster.height : h * 0.6;
        const cx = poster ? poster.left - hr.left + poster.width / 2 : w * 0.72;
        const cy = poster ? poster.top - hr.top + poster.height / 2 : h * 0.45;
        const posterH = pw * unit;
        fit.pivot.set(
          (cx - w / 2) * unit,
          -(cy - h / 2) * unit - posterH * 0.12,
          -0.6
        );
        // Shadow surface a little behind the fan, so the shadow sits offset from the cards.
        catcher.position.z = fit.pivot.z - 0.9;
        // Narrow layouts (poster under the text): a smaller, tighter fan that stays on screen.
        const narrow = w < 960;
        fit.size = posterH * (narrow ? 0.42 : 0.52) * (TEX_W / TEX_H);
        fit.radius = posterH * (narrow ? 0.53 : 0.54);
        fit.spread = narrow ? (100 * Math.PI) / 180 : SPREAD;
        for (const c of cards) c.card.scale.setScalar(fit.size);
      };
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(hero);

      // Mouse (window-wide) → lean + light; scroll → fold.
      const mouse = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener('pointermove', onMove, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(
        ([e]) => (visible = e.isIntersecting)
      );
      io.observe(hero);

      // Phones and tablets: the poster sits below the title, often under the fold, so the cards
      // wait until it is actually on screen instead of flying in where nobody sees them.
      const posterEl = hero.querySelector('.hero__poster');
      let posterSeen = !posterEl || hero.getBoundingClientRect().width >= 960;
      const pio = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          posterSeen = true;
          pio.disconnect();
        },
        { threshold: 0.4 }
      );
      if (!posterSeen && posterEl) pio.observe(posterEl);

      let start = -1;
      let raf = 0;
      let shown = false;
      const mid = (DECK.length - 1) / 2;

      // Rearranging, like a player sorting a hand: one card is pulled up out of the fan, carried
      // over to another place while the cards in between slide aside, then pushed back in.
      const MOVE_MS = 1700;
      const order = cards.map((c) => c); // order[slot] = card
      let moving: (typeof cards)[number] | null = null;
      let moveStart = -1;
      let nextMove = 4200;
      const startMove = (t: number) => {
        const from = Math.floor(Math.random() * order.length);
        // Two to four places away, in whichever direction fits inside the hand.
        const dist = 2 + Math.floor(Math.random() * 3);
        const dir =
          from + dist < order.length && (from - dist < 0 || Math.random() < 0.5)
            ? 1
            : -1;
        const to = Math.min(order.length - 1, Math.max(0, from + dir * dist));
        const [card] = order.splice(from, 1);
        order.splice(to, 0, card);
        order.forEach((c, slot) => {
          c.from = c.slot;
          c.to = slot;
        });
        moving = card;
        moveStart = t;
      };
      // Depth in the hand, in card gaps (in a fan the card to the right lies on top).
      // The moved card goes straight to the depth of its new place, half a gap off to the side
      // the shifting cards are not on, so it never cuts through them; as it is pushed back in it
      // settles to its exact place, sliding under the card that will lie on top of it.
      const depthOf = (c: (typeof cards)[number], t: number) => {
        if (c !== moving) return c.slot;
        const p = clamp01((t - moveStart) / MOVE_MS);
        const travel = c.to + 0.5 * Math.sign(c.to - c.from);
        const out = easeInOut(clamp01((p - 0.14) / 0.12)); // only once it is almost out of the hand
        const back = easeInOut(clamp01((p - 0.76) / 0.24));
        return c.from + (travel - c.from) * out + (c.to - travel) * back;
      };
      const updateMove = (t: number) => {
        if (!moving) return;
        const p = clamp01((t - moveStart) / MOVE_MS);
        // The others shift while the card is up; the card itself travels in the same window.
        const shift = easeInOut(clamp01((p - 0.27) / 0.49));
        for (const c of cards) c.slot = c.from + (c.to - c.from) * shift;
        moving.lift =
          easeOutCubic(clamp01(p / 0.2)) *
          (1 - easeInOut(clamp01((p - 0.76) / 0.24)));
        if (p >= 1) {
          for (const c of cards) c.slot = c.to;
          moving.lift = 0;
          moving = null;
        }
      };

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden || !posterSeen) return;
        if (start < 0) start = now;
        const t = now - start;
        // Fold as the hero scrolls away; on narrow layouts only once the poster itself starts leaving the top.
        const pr =
          fit.spread !== SPREAD ? posterEl?.getBoundingClientRect() : undefined;
        const gone = pr
          ? -pr.top / Math.max(1, pr.height)
          : window.scrollY / Math.max(1, hero.offsetHeight);
        const fold = 1 - 0.85 * clamp01(gone);

        // Rearrange only while the fan is fully open (not while it flies in or folds away).
        if (!moving && t > nextMove && gone < 0.15) {
          startMove(t);
          nextMove = t + MOVE_MS + 2600 + Math.random() * 2400;
        }
        updateMove(t);

        // Each card a bit more than its own thickness in front of the previous one, so overlapping cards never cut into each other.
        const gap = fit.size * CARD_DEPTH * 1.8;
        for (const c of cards) {
          const d = Math.abs(c.index - mid);
          // 1) rise into a stack, 2) fan out (outer cards a little later), 3) breathe.
          const rise = easeOutCubic(clamp01((t - c.index * 45) / 700));
          const open = easeOutBack(clamp01((t - 750 - d * 70) / 1100));
          const breathe = 1 + 0.035 * Math.sin(t / 1300 + c.index * 0.6);
          const angle =
            (c.slot - mid) *
            (fit.spread / (DECK.length - 1)) *
            open *
            breathe *
            fold;
          c.holder.position.set(
            fit.pivot.x,
            fit.pivot.y - (1 - rise) * 6,
            fit.pivot.z + depthOf(c, t) * gap
          );
          c.holder.rotation.z =
            -angle - (fit.spread === SPREAD ? LEAN : 0) * open * fold;
          // Pulled out along its own length (out of the hand), with a slight tilt as fingers grab it.
          c.card.position.y = fit.radius + c.lift * fit.size * 0.6;
          c.card.position.z = gap * 0.25 * Math.sin(t / 900 + c.index);
          c.card.rotation.z = c.lift * 0.06;
        }

        deck.rotation.y += (mouse.x * 0.32 - deck.rotation.y) * 0.05;
        deck.rotation.x += (mouse.y * 0.2 - deck.rotation.x) * 0.05;
        sheen.position.x += (mouse.x * 5 - sheen.position.x) * 0.08;
        sheen.position.y += (-mouse.y * 3 - sheen.position.y) * 0.08;

        renderer.render(scene, camera);
        if (!shown) {
          shown = true;
          document.documentElement.classList.add('deck-ready');
        }
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        pio.disconnect();
        window.removeEventListener('pointermove', onMove);
        for (const d of disposables) d.dispose();
        renderer.dispose();
        document.documentElement.classList.remove('deck-ready');
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas ref={canvasRef} className="magic-deck" aria-hidden="true" />;
}
