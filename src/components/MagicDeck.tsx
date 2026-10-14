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
  { rank: 'Q', suit: '♣' },
  { rank: 'K', suit: '♦' },
  { rank: 'A', suit: '♠' },
  { rank: 'K', suit: '♥' },
  { rank: 'Q', suit: '♠' },
  { rank: 'J', suit: '♦' },
  { rank: '10', suit: '♥' }
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
  g.addColorStop(0, '#f3ead6');
  g.addColorStop(1, '#dccdaa');
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
// middle (three-pointed cap with bells, smiling face, ruff collar) and the word under him.
export function drawJoker(font: string) {
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

  // The figure is drawn on a 360×504 grid; centre that grid on the actual card size.
  ctx.save();
  ctx.translate((TEX_W - 350) / 2, (TEX_H - 494) / 2);
  const cx = 180;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;

  // Cap: red, black, red points, each ending in a gold bell.
  const lobe = (
    x0: number,
    x1: number,
    ctrl: [number, number],
    tip: [number, number],
    fill: string
  ) => {
    ctx.beginPath();
    ctx.moveTo(x0, 236);
    ctx.quadraticCurveTo(ctrl[0], ctrl[1], tip[0], tip[1]);
    ctx.quadraticCurveTo((x0 + x1) / 2 + (tip[0] - cx) * 0.2, 200, x1, 236);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };
  lobe(112, 168, [92, 178], [66, 150], RED);
  lobe(252, 192, [268, 178], [294, 150], RED);
  lobe(148, 212, [160, 150], [cx, 98], INK);
  for (const [x, y] of [
    [66, 150],
    [294, 150],
    [cx, 98]
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.stroke();
  }
  // Band of the cap.
  roundRect(ctx, 108, 228, 144, 18, 6);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.stroke();

  // Face.
  ctx.beginPath();
  ctx.ellipse(cx, 292, 46, 52, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f8f1e1';
  ctx.fill();
  ctx.stroke();
  // Laughing eyes, a diamond on each cheek, a wide smile.
  ctx.lineWidth = 3.5;
  for (const x of [cx - 18, cx + 18]) {
    ctx.beginPath();
    ctx.arc(x, 282, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  ctx.fillStyle = RED;
  for (const x of [cx - 28, cx + 28]) {
    ctx.beginPath();
    ctx.moveTo(x, 296);
    ctx.lineTo(x + 5, 303);
    ctx.lineTo(x, 310);
    ctx.lineTo(x - 5, 303);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, 300, 20, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // Ruff collar: alternating red and black points.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  const points = 8;
  const left = cx - 72;
  const step = 144 / points;
  for (let i = 0; i < points; i++) {
    ctx.beginPath();
    ctx.moveTo(left + i * step, 344);
    ctx.lineTo(left + (i + 0.5) * step, 378);
    ctx.lineTo(left + (i + 1) * step, 344);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? INK : RED;
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(cx, 344, 74, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.stroke();

  // Name under the figure.
  ctx.fillStyle = INK;
  ctx.font = `500 34px ${font}`;
  if ('letterSpacing' in ctx)
    (
      ctx as CanvasRenderingContext2D & { letterSpacing: string }
    ).letterSpacing = '6px';
  ctx.fillText('JOKER', cx + 3, 420);
  ctx.restore();
  return c;
}

// Ivory face: gold inner frame, rank + suit in two corners, big pip in the middle.
function drawFront(rank: string, suit: Suit, font: string) {
  if (rank === 'JOKER') return drawJoker(font);
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
        const frontTex = toTexture(drawFront(rank, suit, font));
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
        const dir = from + dist < order.length && (from - dist < 0 || Math.random() < 0.5) ? 1 : -1;
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
      const updateMove = (t: number) => {
        if (!moving) return;
        const p = clamp01((t - moveStart) / MOVE_MS);
        // The others shift while the card is up; the card itself travels in the same window.
        const shift = easeInOut(clamp01((p - 0.22) / 0.56));
        for (const c of cards) c.slot = c.from + (c.to - c.from) * shift;
        moving.lift = easeOutCubic(clamp01(p / 0.22)) * (1 - easeInOut(clamp01((p - 0.78) / 0.22)));
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
          // A lifted card rides above the whole hand, so it passes over the others.
          c.holder.position.set(
            fit.pivot.x,
            fit.pivot.y - (1 - rise) * 6,
            fit.pivot.z + c.slot * gap + c.lift * gap * (DECK.length + 2)
          );
          c.holder.rotation.z =
            -angle - (fit.spread === SPREAD ? LEAN : 0) * open * fold;
          // Pulled out along its own length (out of the hand), with a slight tilt as fingers grab it.
          c.card.position.y = fit.radius + c.lift * fit.size * 0.42;
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
