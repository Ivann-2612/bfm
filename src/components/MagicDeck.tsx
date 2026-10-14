"use client";

import { useEffect, useRef } from "react";

// "Magic deck": a real 3D deck (three.js) behind the hero poster. On load the cards fly up
// into a stack and fan out around the poster; then the fan breathes, a card turns now and
// then, the whole deck leans towards the mouse, and it folds as the hero scrolls away.
// three.js is loaded only here, after the page; with reduced motion or no WebGL nothing
// starts and the hero simply has no cards.

type Suit = "♠" | "♥" | "♣" | "♦";
const DECK: { rank: string; suit: Suit }[] = [
  { rank: "10", suit: "♠" },
  { rank: "J", suit: "♥" },
  { rank: "Q", suit: "♣" },
  { rank: "K", suit: "♦" },
  { rank: "A", suit: "♠" },
  { rank: "K", suit: "♥" },
  { rank: "Q", suit: "♠" },
  { rank: "J", suit: "♦" },
  { rank: "10", suit: "♥" },
];
const SPREAD = (124 * Math.PI) / 180; // total fan angle
// The fan leans right (clockwise) so it stays around the poster, away from the title on the left.
const LEAN = (18 * Math.PI) / 180;
const TEX_W = 360;
const TEX_H = 504;

const isRedSuit = (s: Suit) => s === "♥" || s === "♦";
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Ivory face: gold inner frame, rank + suit in two corners, big pip in the middle.
function drawFront(rank: string, suit: Suit, font: string) {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  g.addColorStop(0, "#f3ead6");
  g.addColorStop(1, "#dccdaa");
  roundRect(ctx, 2, 2, TEX_W - 4, TEX_H - 4, 26);
  ctx.fillStyle = g;
  ctx.fill();
  roundRect(ctx, 16, 16, TEX_W - 32, TEX_H - 32, 16);
  ctx.strokeStyle = "#c8a04b";
  ctx.lineWidth = 3;
  ctx.stroke();

  const ink = isRedSuit(suit) ? "#b01e2c" : "#16131a";
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
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

  ctx.font = `${rank === "A" ? 230 : 170}px ${font}`;
  ctx.fillText(suit, TEX_W / 2, TEX_H / 2 + 8);
  return c;
}

// Velvet-red back with a gold lattice and a gold spade medallion.
function drawBack(font: string) {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  g.addColorStop(0, "#7d1a25");
  g.addColorStop(1, "#4a0d15");
  roundRect(ctx, 2, 2, TEX_W - 4, TEX_H - 4, 26);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  roundRect(ctx, 22, 22, TEX_W - 44, TEX_H - 44, 12);
  ctx.clip();
  ctx.strokeStyle = "rgba(226, 190, 110, 0.38)";
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
  ctx.strokeStyle = "#d9b25e";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(TEX_W / 2, TEX_H / 2, 62, 0, Math.PI * 2);
  ctx.fillStyle = "#4a0d15";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#e6c375";
  ctx.font = `86px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♠", TEX_W / 2, TEX_H / 2 + 4);
  return c;
}

export function MagicDeck() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      await document.fonts.ready;
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
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

      const font = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "Georgia, serif";
      const toTexture = (c: HTMLCanvasElement) => {
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return t;
      };
      const backTex = toTexture(drawBack(font));
      const backMat = new THREE.MeshStandardMaterial({ map: backTex, transparent: true, alphaTest: 0.5, roughness: 0.35, metalness: 0.25 });
      const plane = new THREE.PlaneGeometry(1, TEX_H / TEX_W);

      // Each card: holder (rotates around the fan pivot) > card (offset by the radius; flips on Y).
      const deck = new THREE.Group();
      scene.add(deck);
      const disposables: { dispose(): void }[] = [backTex, backMat, plane];
      const cards = DECK.map(({ rank, suit }, i) => {
        const frontTex = toTexture(drawFront(rank, suit, font));
        const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, transparent: true, alphaTest: 0.5, roughness: 0.5, metalness: 0.05 });
        disposables.push(frontTex, frontMat);
        const card = new THREE.Group();
        const front = new THREE.Mesh(plane, frontMat);
        const back = new THREE.Mesh(plane, backMat);
        back.rotation.y = Math.PI;
        card.add(front, back);
        const holder = new THREE.Group();
        holder.add(card);
        deck.add(holder);
        return { holder, card, index: i, flipStart: -1 };
      });

      // Fit the fan to the poster: pivot just below its centre, cards peeking out around it.
      const fit = { radius: 2, size: 1.2, spread: SPREAD, pivot: new THREE.Vector3(1.5, 0, -0.6) };
      const layout = () => {
        const hr = hero.getBoundingClientRect();
        const w = hr.width;
        const h = hr.height;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const unit = (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / h;
        const poster = hero.querySelector(".hero__poster")?.getBoundingClientRect();
        const pw = poster ? poster.height : h * 0.6;
        const cx = poster ? poster.left - hr.left + poster.width / 2 : w * 0.72;
        const cy = poster ? poster.top - hr.top + poster.height / 2 : h * 0.45;
        const posterH = pw * unit;
        fit.pivot.set((cx - w / 2) * unit, -(cy - h / 2) * unit - posterH * 0.12, -0.6);
        // Narrow layouts (poster under the text): a smaller, tighter fan that stays on screen.
        const narrow = w < 960;
        fit.size = posterH * (narrow ? 0.42 : 0.52) * (TEX_W / TEX_H);
        fit.radius = posterH * (narrow ? 0.53 : 0.54);
        fit.spread = narrow ? (100 * Math.PI) / 180 : SPREAD;
        for (const c of cards) {
          c.card.scale.setScalar(fit.size);
          c.card.position.y = fit.radius;
        }
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
      window.addEventListener("pointermove", onMove, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(hero);

      // Phones and tablets: the poster sits below the title, often under the fold, so the cards
      // wait until it is actually on screen instead of flying in where nobody sees them.
      const posterEl = hero.querySelector(".hero__poster");
      let posterSeen = !posterEl || hero.getBoundingClientRect().width >= 960;
      const pio = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          posterSeen = true;
          pio.disconnect();
        },
        { threshold: 0.4 },
      );
      if (!posterSeen && posterEl) pio.observe(posterEl);

      let start = -1;
      let nextFlip = 4200;
      let raf = 0;
      let shown = false;
      const mid = (DECK.length - 1) / 2;

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden || !posterSeen) return;
        if (start < 0) start = now;
        const t = now - start;
        // Fold as the hero scrolls away; on narrow layouts only once the poster itself starts leaving the top.
        const pr = fit.spread !== SPREAD ? posterEl?.getBoundingClientRect() : undefined;
        const gone = pr ? -pr.top / Math.max(1, pr.height) : window.scrollY / Math.max(1, hero.offsetHeight);
        const fold = 1 - 0.85 * clamp01(gone);

        for (const c of cards) {
          const d = Math.abs(c.index - mid);
          // 1) rise into a stack, 2) fan out (outer cards a little later), 3) breathe.
          const rise = easeOutCubic(clamp01((t - c.index * 45) / 700));
          const open = easeOutBack(clamp01((t - 750 - d * 70) / 1100));
          const breathe = 1 + 0.035 * Math.sin(t / 1300 + c.index * 0.6);
          const angle = (c.index - mid) * (fit.spread / (DECK.length - 1)) * open * breathe * fold;
          c.holder.position.set(fit.pivot.x, fit.pivot.y - (1 - rise) * 6, fit.pivot.z + c.index * 0.012);
          c.holder.rotation.z = -angle - (fit.spread === SPREAD ? LEAN : 0) * open * fold;
          c.card.position.z = 0.04 * Math.sin(t / 900 + c.index);

          // Now and then one card does a full turn, showing its back for a moment.
          if (c.flipStart >= 0) {
            const p = clamp01((t - c.flipStart) / 1100);
            c.card.rotation.y = easeInOut(p) * Math.PI * 2;
            if (p >= 1) {
              c.flipStart = -1;
              c.card.rotation.y = 0;
            }
          }
        }
        if (t > nextFlip) {
          const pick = cards[Math.floor(Math.random() * cards.length)];
          if (pick.flipStart < 0) pick.flipStart = t;
          nextFlip = t + 3200 + Math.random() * 2600;
        }

        deck.rotation.y += (mouse.x * 0.32 - deck.rotation.y) * 0.05;
        deck.rotation.x += (mouse.y * 0.2 - deck.rotation.x) * 0.05;
        sheen.position.x += (mouse.x * 5 - sheen.position.x) * 0.08;
        sheen.position.y += (-mouse.y * 3 - sheen.position.y) * 0.08;

        renderer.render(scene, camera);
        if (!shown) {
          shown = true;
          document.documentElement.classList.add("deck-ready");
        }
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        pio.disconnect();
        window.removeEventListener("pointermove", onMove);
        for (const d of disposables) d.dispose();
        renderer.dispose();
        document.documentElement.classList.remove("deck-ready");
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas ref={canvasRef} className="magic-deck" aria-hidden="true" />;
}
