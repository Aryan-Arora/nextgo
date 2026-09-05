'use client';

// A NEXGO-themed hash-seeded canvas particle field: particles are sampled
// from the rendered "NEXGO" wordmark, start scattered (like unsynced data),
// and assemble into the letterforms on mount. A thin constellation mesh
// connects nearby particles (courier-network texture), a scanline sweeps
// brightness across the word once assembled, then the whole overlay fades
// to reveal the app. Canvas 2D, requestAnimationFrame, no external libs.

import { useEffect, useRef, useState } from 'react';
import { NAVY } from '@/lib/theme';

const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const smooth = (n) => { n = clamp(n); return n * n * (3 - 2 * n); };
const mix = (a, b, t) => a + (b - a) * t;
const hash = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

const WORD = 'NEXGO';
const BRIGHT_TONES = ['#00B3A4', '#3FD1C4', '#8BEFE4', '#FFFFFF'];
const MID_TONES = ['#0E5049', '#5F9E97', '#8298B8'];
const DIM_TONES = ['#5F779C', '#7189AE', '#3A5178'];

const TARGET_COUNT = 1700;
const MESH_RADIUS_FACTOR = 0.028; // fraction of text width

function sampleWordmark() {
  const cw = 1000, ch = 260;
  const off = document.createElement('canvas');
  off.width = cw; off.height = ch;
  const octx = off.getContext('2d', { willReadFrequently: true });
  octx.clearRect(0, 0, cw, ch);
  octx.fillStyle = '#fff';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.font = '900 190px "Arial Black", Arial, sans-serif';
  octx.fillText(WORD, cw / 2, ch / 2 + 8);
  const { data } = octx.getImageData(0, 0, cw, ch);

  const candidates = [];
  const stride = 3;
  for (let y = 0; y < ch; y += stride) {
    for (let x = 0; x < cw; x += stride) {
      if (data[(y * cw + x) * 4 + 3] > 120) candidates.push([x, y]);
    }
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of candidates) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const cx0 = (minX + maxX) / 2, cy0 = (minY + maxY) / 2;
  const textW = maxX - minX, textH = maxY - minY;

  const step = candidates.length > TARGET_COUNT ? candidates.length / TARGET_COUNT : 1;
  const points = [];
  for (let k = 0; k < Math.min(TARGET_COUNT, candidates.length); k++) {
    const [x, y] = candidates[Math.floor(k * step)];
    points.push([x - cx0, y - cy0]);
  }
  return { points, textW, textH };
}

function buildParticles() {
  const { points, textW, textH } = sampleWordmark();
  const particles = points.map((base, i) => {
    const seed = hash(i + 1), q = hash(i + 91);
    const tone = seed < 0.55 ? BRIGHT_TONES[Math.floor(hash(i + 4) * BRIGHT_TONES.length)]
      : seed < 0.85 ? MID_TONES[Math.floor(hash(i + 5) * MID_TONES.length)]
      : DIM_TONES[Math.floor(hash(i + 6) * DIM_TONES.length)];
    const size = 1.1 + q * 1.9;
    const fieldR = textW * (0.55 + hash(i + 555) * 0.7);
    const fieldA = hash(i + 777) * Math.PI * 2;
    const field = [Math.cos(fieldA) * fieldR, Math.sin(fieldA) * fieldR * 0.7];
    return { seed, base, field, size, color: tone, kx: 0, ky: 0, vx: 0, vy: 0 };
  });

  // constellation mesh: connect each particle to its 1-2 nearest neighbours,
  // built once from a coarse spatial grid over the static letterform layout.
  const cell = Math.max(6, textW * MESH_RADIUS_FACTOR);
  const grid = new Map();
  const key = (x, y) => `${Math.floor(x / cell)}:${Math.floor(y / cell)}`;
  particles.forEach((p, i) => {
    const k = key(p.base[0], p.base[1]);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(i);
  });
  const edges = [];
  const radius = cell * 1.4;
  particles.forEach((p, i) => {
    const gx = Math.floor(p.base[0] / cell), gy = Math.floor(p.base[1] / cell);
    let bestJ = -1, bestD = radius * radius;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(`${gx + dx}:${gy + dy}`);
        if (!bucket) continue;
        for (const j of bucket) {
          if (j <= i) continue;
          const q = particles[j];
          const d = (q.base[0] - p.base[0]) ** 2 + (q.base[1] - p.base[1]) ** 2;
          if (d < bestD) { bestD = d; bestJ = j; }
        }
      }
    }
    if (bestJ >= 0) edges.push([i, bestJ]);
  });

  return { particles, edges, textW, textH };
}

export default function LoadingScreen({ onFinish }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { particles, edges, textW, textH } = buildParticles();

    let width = 1, height = 1, ratio = 1, raf;
    let fadingStarted = false;
    const pointer = { x: -9999, y: -9999, active: false };
    const start = performance.now();
    const ASSEMBLE = reduced ? 1 : 1500;
    const HOLD = reduced ? 250 : 700;
    const FADE = 420;

    function resize() {
      width = host.offsetWidth; height = host.offsetHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
      canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    const onMove = (e) => { const rect = host.getBoundingClientRect(); pointer.x = e.clientX - rect.left; pointer.y = e.clientY - rect.top; pointer.active = true; };
    const onLeave = () => { pointer.active = false; };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    function draw(now) {
      const elapsed = now - start;
      const progress = smooth(clamp(elapsed / ASSEMBLE));
      const scale = Math.min((width * 0.8) / textW, (height * 0.34) / textH);
      const cx = width / 2, cy = height * 0.46;
      const drift = reduced ? 0 : now * 0.00006;

      ctx.clearRect(0, 0, width, height);

      if (!reduced) {
        for (let i = 0; i < 110; i++) {
          const x = (hash(i + 4000) * width + Math.sin(drift * 6 + i) * 6) % width;
          const y = hash(i + 5000) * height;
          const alpha = (0.04 + hash(i + 6000) * 0.1) * progress;
          ctx.fillStyle = `rgba(211,220,233,${alpha})`;
          const s = i % 13 === 0 ? 1.6 : 0.8;
          ctx.fillRect(x, y, s, s);
        }
      }

      const glowR = Math.max(textW, textH) * scale * 0.62;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(0,179,164,${0.24 * progress})`);
      glow.addColorStop(0.55, `rgba(0,179,164,${0.08 * progress})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

      const scanX = reduced ? -9999 : ((now * 0.00035) % 1.6 - 0.3) * textW * scale;

      const projected = new Map();
      for (const p of particles) {
        const bx = mix(p.field[0], p.base[0], progress);
        const by = mix(p.field[1], p.base[1], progress);
        const px = cx + bx * scale + Math.sin(drift + p.seed * 30) * (reduced ? 0 : 0.5);
        const py = cy + by * scale;
        const dx = px - pointer.x, dy = py - pointer.y, d = Math.hypot(dx, dy);
        const force = pointer.active ? Math.pow(clamp(1 - d / 90), 2) : 0;
        const inv = d > 0.01 ? 1 / d : 0;
        p.vx = (p.vx + dx * inv * force * 2 - p.kx * 0.15) * 0.8;
        p.vy = (p.vy + dy * inv * force * 2 - p.ky * 0.15) * 0.8;
        p.kx += p.vx; p.ky += p.vy;
        const x = px + p.kx, y = py + p.ky;
        const scanDist = Math.abs(x - cx - scanX);
        const scanBoost = progress > 0.85 ? Math.pow(clamp(1 - scanDist / 60), 2) : 0;
        const alpha = (0.55 + progress * 0.35) * progress + force * 0.25 + scanBoost * 0.4;
        projected.set(p, { x, y, alpha, scanBoost });
      }

      const meshAlpha = smooth(clamp((progress - 0.45) / 0.4));
      if (meshAlpha > 0.01) {
        for (const [i, j] of edges) {
          const a = projected.get(particles[i]), b = projected.get(particles[j]);
          if (!a || !b) continue;
          const la = Math.min(a.alpha, b.alpha) * 0.5 * meshAlpha;
          if (la < 0.02) continue;
          ctx.strokeStyle = '#3FD1C4';
          ctx.globalAlpha = la;
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      for (const p of particles) {
        const proj = projected.get(p); if (!proj) continue;
        ctx.globalAlpha = proj.alpha;
        ctx.fillStyle = proj.scanBoost > 0.3 ? '#FFFFFF' : p.color;
        ctx.beginPath(); ctx.arc(proj.x, proj.y, p.size * (1 + proj.scanBoost * 0.5), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (elapsed > ASSEMBLE + HOLD && !fadingStarted) {
        fadingStarted = true;
        setFading(true);
        setTimeout(() => { setHidden(true); onFinish && onFinish(); }, FADE);
      }
      if (elapsed < ASSEMBLE + HOLD + FADE + 60) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, [onFinish]);

  if (hidden) return null;

  return (
    <div
      ref={hostRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: NAVY,
        opacity: fading ? 0 : 1, transition: 'opacity 420ms ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', bottom: 54, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, letterSpacing: '.24em', color: '#7189AE', textTransform: 'uppercase' }}>Multi-courier shipping platform</div>
        <div style={{ width: 160, height: 2, background: 'rgba(211,220,233,.16)', overflow: 'hidden', borderRadius: 2 }}>
          <div className="nexgo-loading-bar" style={{ height: '100%', background: '#00B3A4' }} />
        </div>
      </div>
      <style jsx>{`
        .nexgo-loading-bar { animation: nexgoLoadBar 1.5s ease forwards; width: 0%; }
        @keyframes nexgoLoadBar { to { width: 100%; } }
      `}</style>
    </div>
  );
}
