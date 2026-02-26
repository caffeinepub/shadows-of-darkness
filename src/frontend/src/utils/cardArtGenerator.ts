// Procedural card art generator using canvas 2D API
// Generates unique manga/anime styled art seeded by card ID

import { Attribute } from "../backend.d";

// Simple seeded pseudo-random number generator (mulberry32)
function createRng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ATTRIBUTE_PALETTES: Record<string, [string, string, string]> = {
  dark: ["#1a0028", "#4a0050", "#8b00ff"],
  fire: ["#1a0000", "#8b0000", "#ff4500"],
  wind: ["#001a10", "#004030", "#00c878"],
  earth: ["#1a1000", "#4a3000", "#c88020"],
  light: ["#001a3a", "#0040a0", "#ffffd0"],
  divine: ["#1a1a00", "#808000", "#ffffa0"],
  water: ["#00101a", "#002040", "#00a0c8"],
};

const DEFAULT_PALETTE: [string, string, string] = ["#1a0028", "#2d0050", "#8b44ff"];

function getAttributePalette(attribute?: Attribute | string): [string, string, string] {
  if (!attribute) return DEFAULT_PALETTE;
  const key = typeof attribute === "string" ? attribute : String(attribute);
  return ATTRIBUTE_PALETTES[key.toLowerCase()] ?? DEFAULT_PALETTE;
}

// Draw abstract geometric manga character
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rng: () => number,
  palette: [string, string, string]
) {
  ctx.save();
  
  // Aura glow
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.8);
  gradient.addColorStop(0, palette[2] + "99");
  gradient.addColorStop(0.5, palette[1] + "66");
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  // Central body shape
  const bodyType = Math.floor(rng() * 5);
  ctx.fillStyle = palette[1] + "cc";
  ctx.strokeStyle = palette[2];
  ctx.lineWidth = 2;
  
  if (bodyType === 0) {
    // Dragon-like silhouette
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.5);
    ctx.bezierCurveTo(cx + size * 0.3, cy - size * 0.3, cx + size * 0.4, cy + size * 0.1, cx + size * 0.3, cy + size * 0.5);
    ctx.bezierCurveTo(cx + size * 0.1, cy + size * 0.6, cx - size * 0.1, cy + size * 0.6, cx - size * 0.3, cy + size * 0.5);
    ctx.bezierCurveTo(cx - size * 0.4, cy + size * 0.1, cx - size * 0.3, cy - size * 0.3, cx, cy - size * 0.5);
    ctx.fill();
    ctx.stroke();
    
    // Wings
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx + size * 0.6, cy - size * 0.3, cx + size * 0.8, cy + size * 0.1, cx + size * 0.5, cy + size * 0.4);
    ctx.strokeStyle = palette[2] + "88";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx - size * 0.6, cy - size * 0.3, cx - size * 0.8, cy + size * 0.1, cx - size * 0.5, cy + size * 0.4);
    ctx.stroke();
  } else if (bodyType === 1) {
    // Humanoid warrior
    // Head
    ctx.fillStyle = palette[2] + "cc";
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.35, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = palette[1] + "cc";
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy - size * 0.2);
    ctx.lineTo(cx + size * 0.12, cy - size * 0.2);
    ctx.lineTo(cx + size * 0.15, cy + size * 0.15);
    ctx.lineTo(cx - size * 0.15, cy + size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Arms
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy - size * 0.1);
    ctx.lineTo(cx - size * 0.3, cy + size * 0.1);
    ctx.moveTo(cx + size * 0.12, cy - size * 0.1);
    ctx.lineTo(cx + size * 0.3, cy + size * 0.1);
    ctx.stroke();
    // Weapon glow
    const weapGrad = ctx.createLinearGradient(cx + size * 0.3, cy - size * 0.4, cx + size * 0.4, cy + size * 0.3);
    weapGrad.addColorStop(0, palette[2]);
    weapGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = weapGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.3, cy - size * 0.4);
    ctx.lineTo(cx + size * 0.4, cy + size * 0.3);
    ctx.stroke();
  } else if (bodyType === 2) {
    // Abstract crystal/gem entity
    const points = 6 + Math.floor(rng() * 4);
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
      const r = size * (0.3 + rng() * 0.2);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
    }
    ctx.closePath();
    const crystGrad = ctx.createRadialGradient(cx - size * 0.1, cy - size * 0.1, 0, cx, cy, size * 0.45);
    crystGrad.addColorStop(0, palette[2] + "ff");
    crystGrad.addColorStop(0.5, palette[1] + "cc");
    crystGrad.addColorStop(1, palette[0] + "88");
    ctx.fillStyle = crystGrad;
    ctx.fill();
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner facets
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const a1 = rng() * Math.PI * 2;
      const a2 = a1 + Math.PI * 0.5;
      ctx.lineTo(cx + Math.cos(a1) * size * 0.35, cy + Math.sin(a1) * size * 0.35);
      ctx.lineTo(cx + Math.cos(a2) * size * 0.35, cy + Math.sin(a2) * size * 0.35);
      ctx.closePath();
      ctx.fillStyle = palette[2] + "22";
      ctx.fill();
    }
  } else if (bodyType === 3) {
    // Serpent/coil
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.4, cy + size * 0.4);
    ctx.bezierCurveTo(
      cx + size * 0.4, cy + size * 0.2,
      cx - size * 0.3, cy - size * 0.2,
      cx + size * 0.3, cy - size * 0.4
    );
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = palette[2] + "55";
    ctx.stroke();
    // Head
    ctx.fillStyle = palette[2];
    ctx.beginPath();
    ctx.arc(cx + size * 0.3, cy - size * 0.4, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Energy entity
    for (let ring = 0; ring < 4; ring++) {
      const r = size * (0.1 + ring * 0.1);
      const ringGrad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
      ringGrad.addColorStop(0, palette[ring % 3] + "00");
      ringGrad.addColorStop(0.7, palette[ring % 3] + "88");
      ringGrad.addColorStop(1, palette[ring % 3] + "00");
      ctx.strokeStyle = palette[ring % 3] + "88";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Core
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.15);
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.5, palette[2]);
    coreGrad.addColorStop(1, "transparent");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

// Draw energy lines radiating from center
function drawEnergyLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  count: number,
  maxLen: number,
  rng: () => number,
  color: string
) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const len = maxLen * (0.3 + rng() * 0.7);
    const grad = ctx.createLinearGradient(
      cx, cy,
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len
    );
    grad.addColorStop(0, color + "cc");
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len
    );
    ctx.stroke();
  }
  ctx.restore();
}

// Draw background pattern
function drawBgPattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: () => number,
  palette: [string, string, string]
) {
  ctx.save();
  const patternType = Math.floor(rng() * 4);
  
  if (patternType === 0) {
    // Cross-hatch
    ctx.strokeStyle = palette[1] + "44";
    ctx.lineWidth = 0.5;
    const spacing = 12 + Math.floor(rng() * 12);
    for (let x = 0; x < w; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (patternType === 1) {
    // Scale/hex pattern
    const size = 16;
    for (let row = 0; row < h / size + 1; row++) {
      for (let col = 0; col < w / size + 1; col++) {
        const ox = col * size + (row % 2) * size * 0.5;
        const oy = row * size * 0.87;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = ox + Math.cos(a) * size * 0.5;
          const py = oy + Math.sin(a) * size * 0.5;
          if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
        }
        ctx.closePath();
        ctx.strokeStyle = palette[2] + "22";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  } else if (patternType === 2) {
    // Circuit board
    ctx.strokeStyle = palette[2] + "33";
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < w; x += gridSize) {
      for (let y = 0; y < h; y += gridSize) {
        if (rng() > 0.4) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          if (rng() > 0.5) {
            ctx.lineTo(x + gridSize, y);
          } else {
            ctx.lineTo(x, y + gridSize);
          }
          ctx.stroke();
        }
        if (rng() > 0.7) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = palette[2] + "66";
          ctx.fill();
        }
      }
    }
  } else {
    // Diagonal stripes
    ctx.strokeStyle = palette[1] + "33";
    ctx.lineWidth = 1;
    const step = 20;
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Draw particles
function drawParticles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  rng: () => number,
  color: string
) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const px = rng() * w;
    const py = rng() * h;
    const size = 1 + rng() * 3;
    ctx.fillStyle = color + Math.floor(rng() * 128 + 127).toString(16).padStart(2, "0");
    ctx.beginPath();
    if (rng() > 0.5) {
      // Star
      ctx.moveTo(px, py - size);
      ctx.lineTo(px + size * 0.3, py - size * 0.3);
      ctx.lineTo(px + size, py);
      ctx.lineTo(px + size * 0.3, py + size * 0.3);
      ctx.lineTo(px, py + size);
      ctx.lineTo(px - size * 0.3, py + size * 0.3);
      ctx.lineTo(px - size, py);
      ctx.lineTo(px - size * 0.3, py - size * 0.3);
      ctx.closePath();
    } else {
      ctx.arc(px, py, size, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
}

export function generateCardArt(
  canvas: HTMLCanvasElement,
  cardId: bigint,
  attribute?: Attribute | string
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  const w = canvas.width;
  const h = canvas.height;
  const seed = Number(cardId % BigInt(2147483647)) + 1;
  const rng = createRng(seed);
  
  const palette = getAttributePalette(attribute);
  
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, palette[0]);
  bgGrad.addColorStop(0.5, palette[1]);
  bgGrad.addColorStop(1, palette[0]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  
  // Pattern layer
  drawBgPattern(ctx, w, h, rng, palette);
  
  // Ambient radial glow from center
  const cx = w / 2;
  const cy = h * 0.42;
  const ambGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6);
  ambGrad.addColorStop(0, palette[2] + "44");
  ambGrad.addColorStop(0.5, palette[1] + "22");
  ambGrad.addColorStop(1, "transparent");
  ctx.fillStyle = ambGrad;
  ctx.fillRect(0, 0, w, h);
  
  // Energy lines
  drawEnergyLines(ctx, cx, cy, 12 + Math.floor(rng() * 8), w * 0.65, rng, palette[2]);
  
  // Main character/entity
  drawCharacter(ctx, cx, cy, w * 0.38, rng, palette);
  
  // Ground/base shadow
  const shadowGrad = ctx.createRadialGradient(cx, h * 0.75, 0, cx, h * 0.75, w * 0.35);
  shadowGrad.addColorStop(0, "rgba(0,0,0,0.6)");
  shadowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.75, w * 0.35, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Sparkle particles
  drawParticles(ctx, w, h, 20 + Math.floor(rng() * 15), rng, palette[2]);
  
  // Vignette
  const vigGrad = ctx.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 0.85);
  vigGrad.addColorStop(0, "transparent");
  vigGrad.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, w, h);
}

export function getRarityClass(rarity: number): string {
  if (rarity <= 9) return "rarity-common";
  if (rarity <= 19) return "rarity-rare";
  if (rarity <= 39) return "rarity-super";
  if (rarity <= 59) return "rarity-ultra";
  if (rarity <= 79) return "rarity-secret";
  if (rarity <= 99) return "rarity-prismatic";
  if (rarity <= 119) return "rarity-ghost";
  if (rarity <= 139) return "rarity-starlight";
  if (rarity <= 159) return "rarity-collectors";
  if (rarity <= 179) return "rarity-qc";
  if (rarity <= 194) return "rarity-ultimate";
  if (rarity <= 209) return "rarity-platinum";
  return "rarity-void";
}

export function getRarityName(rarity: number): string {
  if (rarity <= 9) return "Common";
  if (rarity <= 19) return "Rare";
  if (rarity <= 39) return "Super Rare";
  if (rarity <= 59) return "Ultra Rare";
  if (rarity <= 79) return "Secret Rare";
  if (rarity <= 99) return "Prismatic Secret";
  if (rarity <= 119) return "Ghost Rare";
  if (rarity <= 139) return "Starlight Rare";
  if (rarity <= 159) return "Collector's Rare";
  if (rarity <= 179) return "Quarter Century";
  if (rarity <= 194) return "Ultimate Rare";
  if (rarity <= 209) return "Platinum Rare";
  return "Void Rare";
}

export function getCardFrameClass(cardType: { __kind__: string; monster?: { xyz: boolean; link: boolean; ritual: boolean; effect: boolean; fusion: boolean; synchro: boolean } }): string {
  if (cardType.__kind__ === "spell") return "card-frame-spell";
  if (cardType.__kind__ === "trap") return "card-frame-trap";
  if (cardType.__kind__ === "monster") {
    const m = cardType.monster;
    if (!m) return "card-frame-normal";
    if (m.fusion) return "card-frame-fusion";
    if (m.synchro) return "card-frame-synchro";
    if (m.xyz) return "card-frame-xyz";
    if (m.link) return "card-frame-link";
    if (m.ritual) return "card-frame-ritual";
    if (m.effect) return "card-frame-effect";
  }
  return "card-frame-normal";
}

export function getAttributeSymbol(attr?: string): string {
  const symbols: Record<string, string> = {
    dark: "🌑",
    fire: "🔥",
    wind: "💨",
    earth: "⛰️",
    light: "✨",
    divine: "⚡",
    water: "💧",
  };
  return symbols[attr?.toLowerCase() ?? ""] ?? "◆";
}
