'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/**
 * DitherCanvas — the hero's ambient pixel cloud.
 *
 * A slow, domain-warped fluid field ("smoke") is computed on a low-resolution
 * grid, quantized with 8x8 ordered (Bayer) dithering, and upscaled
 * nearest-neighbour into crisp square pixels — the canvas-texture + pixel
 * aesthetic. The cloud is kept out of the top-left so the left-aligned heading
 * sits on clean background, and tinted by a selectable colour PALETTE.
 *
 * Rendering: each INKED cell is painted its palette colour at full opacity;
 * only truly-empty cells stay transparent, so the field still blends over the
 * Layout page gradient with no seam (the component never paints its own
 * background fill). The colour ramp's low stops carry the "darkness" — the
 * alpha must stay opaque, or the cloud body washes out to nothing on the dark
 * page (an alpha = dither-level port made it near-invisible).
 *
 * Performance: transform/opacity-free, single offscreen ImageData per frame,
 * devicePixelRatio-aware, freezes to a static frame under Reduce Motion.
 */

// 8x8 Bayer ordered-dither threshold matrix, normalised to (0,1).
const BAYER8 = (() => {
  const base = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
  ];
  const m = new Float32Array(64);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) m[y * 8 + x] = (base[y][x] + 0.5) / 64;
  return m;
})();

// ---------------------------------------------------------------------------
// Colour palettes. Each maps the dither value 0..1 onto a colour ramp, with
// separate stops for dark and light themes. 0 sits on the page background; 1
// is the brightest ink. 'mono' is grayscale. Colour ramps stay desaturated in
// the lows so dark regions read clean and only bloom in the bright cloud core.
// ---------------------------------------------------------------------------
export type PaletteName = 'mono' | 'aurora' | 'sunset' | 'plasma';
type Stop = [number, string];

const PALETTES: Record<PaletteName, { dark: Stop[]; light: Stop[] }> = {
  mono: {
    dark: [[0, '#0a0a0a'], [1, '#f5f5f5']],
    light: [[0, '#fafafa'], [1, '#171717']],
  },
  aurora: {
    dark: [[0, '#0a0a0a'], [0.28, '#10263f'], [0.44, '#123f63'], [0.58, '#0f6b70'], [0.71, '#168a5f'], [0.82, '#2fb866'], [0.92, '#7be0a6'], [1, '#e2fbef']],
    light: [[0, '#fafafa'], [0.32, '#bfe3dc'], [0.52, '#5fc3bb'], [0.7, '#2a9d8f'], [0.85, '#1f7a86'], [1, '#0c4f6a']],
  },
  sunset: {
    dark: [[0, '#0a0a0a'], [0.4, '#3a1330'], [0.68, '#c0432a'], [0.88, '#e8803a'], [1, '#f6b15f']],
    light: [[0, '#fafafa'], [0.45, '#f0b89a'], [0.72, '#d9542a'], [1, '#6e1f24']],
  },
  plasma: {
    dark: [[0, '#0a0a0a'], [0.42, '#241a4a'], [0.7, '#6a3fd6'], [0.9, '#9a5ce8'], [1, '#c08cf2']],
    light: [[0, '#fafafa'], [0.45, '#c9b6ef'], [0.75, '#6a3fd6'], [1, '#321a66']],
  },
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Build a 256-entry RGB lookup table from a list of [pos, hex] stops.
function buildLUT(stops: Stop[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 3);
  const pts = stops.map((s) => [s[0], hexToRgb(s[1])] as [number, [number, number, number]]);
  let seg = 0;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    while (seg < pts.length - 2 && t > pts[seg + 1][0]) seg++;
    const a = pts[seg];
    const b = pts[seg + 1];
    const span = b[0] - a[0] || 1;
    const f = clamp01((t - a[0]) / span);
    lut[i * 3] = a[1][0] + (b[1][0] - a[1][0]) * f;
    lut[i * 3 + 1] = a[1][1] + (b[1][1] - a[1][1]) * f;
    lut[i * 3 + 2] = a[1][2] + (b[1][2] - a[1][2]) * f;
  }
  return lut;
}

type Blob = {
  ax: number; ay: number; sx: number; sy: number;
  px: number; py: number; r: number; amp: number;
};

const BLOBS: Blob[] = [
  { ax: 0.3, ay: 0.18, sx: 0.31, sy: 0.23, px: 0.0, py: 1.7, r: 0.3, amp: 0.95 },
  { ax: 0.24, ay: 0.26, sx: -0.27, sy: 0.19, px: 2.1, py: 0.4, r: 0.24, amp: 0.85 },
  { ax: 0.34, ay: 0.14, sx: 0.21, sy: -0.29, px: 4.0, py: 3.2, r: 0.2, amp: 0.75 },
  { ax: 0.18, ay: 0.22, sx: -0.18, sy: -0.24, px: 5.5, py: 1.1, r: 0.16, amp: 0.65 },
];

// Drifting smoke field — domain-warped sum of moving gaussian blobs plus a
// sweeping diagonal streak. Returns an unbounded positive luminance for
// normalised (x, y) at time t.
function fieldValue(x: number, y: number, t: number): number {
  const wx = x + 0.14 * Math.sin(y * 5.3 + t * 0.45) + 0.06 * Math.sin(y * 11.0 - t * 0.7);
  const wy = y + 0.14 * Math.cos(x * 4.7 + t * 0.38) + 0.06 * Math.cos(x * 9.0 + t * 0.6);
  let v = 0;
  for (let i = 0; i < BLOBS.length; i++) {
    const b = BLOBS[i];
    const cx = 0.5 + b.ax * Math.sin(t * b.sx + b.px);
    const cy = 0.5 + b.ay * Math.sin(t * b.sy + b.py);
    const dx = wx - cx;
    const dy = wy - cy;
    v += b.amp * Math.exp(-(dx * dx + dy * dy) / (b.r * b.r));
  }
  const diag = wx * 0.7 + (1 - wy) * 0.3 - (0.35 + 0.18 * Math.sin(t * 0.3));
  v += 0.55 * Math.exp(-(diag * diag) / 0.045);
  return v;
}

export type DitherCanvasProps = {
  /** Logical pixel size of each dither cell, in CSS px. */
  pixelSize?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** 0..1 — lower is softer/airier, higher is punchier. */
  contrast?: number;
  /** Colour ramp for the cloud. */
  palette?: PaletteName;
  className?: string;
};

export default function DitherCanvas({
  pixelSize = 2,
  speed = 1.2,
  contrast = 0.3,
  palette = 'aurora',
  className,
}: DitherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();

  // Live config without restarting the animation loop.
  const cfg = useRef({ pixelSize, speed, contrast, palette, theme, reduceMotion });
  cfg.current = { pixelSize, speed, contrast, palette, theme, reduceMotion };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const off = document.createElement('canvas');
    const offctx = off.getContext('2d');
    if (!offctx) return;

    let raf = 0;
    let stopped = false;
    let dpr = 1;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const startT = performance.now();
    let lut = buildLUT(PALETTES.mono.dark);
    let lutKey = '';
    // Temporal smoothing buffer: each cell eases toward its previous value so
    // the ordered-dither pattern flows instead of popping as the field crosses
    // level thresholds. Reset on grid-size change.
    let smoothBuf: Float32Array | null = null;
    let smoothCols = 0;
    let smoothRows = 0;
    let smoothPrimed = false;

    const drawInner = () => {
      const c = cfg.current;
      const palDef = PALETTES[c.palette] || PALETTES.mono;
      const palKey = c.palette + (c.theme === 'dark' ? ':d' : ':l');
      if (lutKey !== palKey) {
        lut = buildLUT(c.theme === 'dark' ? palDef.dark : palDef.light);
        lutKey = palKey;
      }
      const cell = Math.max(1, Math.round(Math.max(2, c.pixelSize) * dpr));
      const cols = Math.max(1, Math.ceil(canvas.width / cell));
      const rows = Math.max(1, Math.ceil(canvas.height / cell));

      const t = c.reduceMotion ? 0 : ((performance.now() - startT) / 1000) * c.speed;
      const gamma = 0.5 + (1 - c.contrast) * 1.4; // lower contrast -> softer
      const levels = Math.max(2, Math.round(6 + c.contrast * 4));
      // ink-on-paper reads heavier than light-on-black, so damp the light theme
      const gain = c.theme === 'dark' ? 1 : 0.6;
      const L = levels - 1;

      if (off.width !== cols || off.height !== rows) {
        off.width = cols;
        off.height = rows;
      }
      if (!smoothBuf || smoothCols !== cols || smoothRows !== rows) {
        smoothBuf = new Float32Array(cols * rows);
        smoothCols = cols;
        smoothRows = rows;
        smoothPrimed = false;
      }
      // Ease factor: lower = smoother/more fluid, higher = more responsive.
      const A = c.reduceMotion ? 1 : 0.16;
      const img = offctx.createImageData(cols, rows);
      const data = img.data;

      for (let gy = 0; gy < rows; gy++) {
        const ny = gy / rows;
        for (let gx = 0; gx < cols; gx++) {
          const nx = gx / cols;
          // Keep the TOP-LEFT clean so the left-aligned heading sits on clear
          // background; the cloud builds toward the right and bottom.
          const m = 1.42 * nx + 0.6 * ny - 0.62;
          const mask = m < 0 ? 0 : m > 1 ? 1 : m;
          // Sample the field over the normalised 0..1 square, exactly as the
          // prototype's `engine.sample(state, nx, ny, t)` does. (The port passed
          // `nx * aspect`, which squished the cloud left and clipped its bright
          // core under the corner mask.)
          const raw = fieldValue(nx, ny, t) * gain * mask;
          // Soft (Reinhard) compression instead of a hard clamp: the field has a
          // broad flat top, so clamping painted a big white plateau. This keeps
          // only the very densest tip near-white and grades everything else down
          // through the colour ramp.
          let v = raw / (1 + 0.42 * raw);
          v = Math.pow(v < 0 ? 0 : v > 1 ? 1 : v, gamma);
          // temporal ease toward the previous frame's value
          const idx = gy * cols + gx;
          v = smoothPrimed ? smoothBuf[idx] + (v - smoothBuf[idx]) * A : v;
          smoothBuf[idx] = v;
          const thr = BAYER8[(gy & 7) * 8 + (gx & 7)];
          const scaled = v * L;
          const low = Math.floor(scaled);
          const lvl = Math.min(L, low + (scaled - low > thr ? 1 : 0));
          const gray = lvl / L;
          const li = (gray * 255) | 0;
          const o = (gy * cols + gx) * 4;
          data[o] = lut[li * 3];
          data[o + 1] = lut[li * 3 + 1];
          data[o + 2] = lut[li * 3 + 2];
          // Opaque where there's ink, transparent where there isn't: the ramp
          // colour already encodes brightness, so inked cells must be fully
          // opaque to read. Empty cells stay transparent and show the page.
          data[o + 3] = gray > 0 ? 255 : 0;
        }
      }
      offctx.putImageData(img, 0, 0);
      smoothPrimed = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, cols, rows, 0, 0, cols * cell, rows * cell);
    };

    const draw = () => {
      if (stopped) return;
      // Guard the per-frame work so a transient error (e.g. a 0-sized canvas
      // mid-resize) can't break the rAF chain and freeze the animation.
      try {
        drawInner();
      } catch (e) {
        // swallow — the next frame retries once dimensions are valid again
      }
      // Always keep the loop alive. Under Reduce Motion `t` is frozen to 0 in
      // drawInner, so this repaints an identical (cheap) static frame rather
      // than terminating. Terminating here was a regression: useReducedMotion()
      // resolves its value AFTER hydration, so the old `return` killed the loop
      // a moment after mount and froze the canvas (the "runs ~1s then stops" bug).
      raf = requestAnimationFrame(draw);
    };

    draw(); // first frame synchronously
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
}
