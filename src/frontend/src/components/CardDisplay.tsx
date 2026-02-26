import React, { useRef, useEffect, useCallback, useState } from "react";
import { Card, Attribute } from "../backend.d";
import {
  generateCardArt,
  getRarityClass,
  getRarityName,
  getCardFrameClass,
  getAttributeSymbol,
} from "../utils/cardArtGenerator";

interface CardDisplayProps {
  card: Card;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
  animate?: boolean;
  position?: "ATK" | "DEF" | "SET";
  isAttacking?: boolean;
}

const SIZES = {
  xs: { w: 60, h: 88, nameSize: "8px", statSize: "7px" },
  sm: { w: 90, h: 131, nameSize: "9px", statSize: "8px" },
  md: { w: 120, h: 175, nameSize: "10px", statSize: "9px" },
  lg: { w: 180, h: 262, nameSize: "12px", statSize: "11px" },
  xl: { w: 280, h: 408, nameSize: "14px", statSize: "13px" },
};

function getCardTypeLabel(card: Card): string {
  if (card.card_type.__kind__ === "spell") return "SPELL";
  if (card.card_type.__kind__ === "trap") return "TRAP";
  const m = card.card_type.monster;
  if (!m) return "NORMAL";
  if (m.fusion) return "FUSION";
  if (m.synchro) return "SYNCHRO";
  if (m.xyz) return "XYZ";
  if (m.link) return "LINK";
  if (m.ritual) return "RITUAL";
  if (m.effect) return "EFFECT";
  return "NORMAL";
}

export default function CardDisplay({
  card,
  size = "md",
  faceDown = false,
  selected = false,
  onClick,
  className = "",
  showDetails = true,
  animate = false,
  position = "ATK",
  isAttacking = false,
}: CardDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const { w, h, nameSize, statSize } = SIZES[size];
  const rarityClass = getRarityClass(Number(card.rarity));
  const rarityName = getRarityName(Number(card.rarity));
  const frameClass = getCardFrameClass(card.card_type);
  const cardTypeLabel = getCardTypeLabel(card);
  const attrSymbol = getAttributeSymbol(card.attribute);
  const isMonster = card.card_type.__kind__ === "monster";
  const isDefPos = position === "DEF";

  // Generate or load art
  useEffect(() => {
    if (faceDown) return;

    // Check if card has custom art blob
    if (card.art_blob) {
      const url = card.art_blob.getDirectURL();
      setArtUrl(url);
      return;
    }

    // Generate procedural art
    const canvas = document.createElement("canvas");
    canvas.width = w - 16;
    canvas.height = Math.floor((h - 16) * 0.5);
    generateCardArt(canvas, card.id, card.attribute);
    setArtUrl(canvas.toDataURL());
  }, [card.id, card.attribute, card.art_blob, faceDown, w, h]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setTilt({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const cardStyle: React.CSSProperties = {
    width: `${w}px`,
    height: `${h}px`,
    transform: isDefPos
      ? `rotate(90deg) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`
      : `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
    transition: isHovered ? "transform 0.08s ease-out" : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
    boxShadow: selected
      ? "0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)"
      : isAttacking
      ? "0 0 30px rgba(255,50,0,0.9), 0 0 60px rgba(255,100,0,0.5)"
      : isHovered
      ? "0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,215,0,0.3)"
      : "0 8px 32px rgba(0,0,0,0.6)",
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);

  if (faceDown) {
    return (
      <button
        ref={containerRef}
        type="button"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={`card-3d-container cursor-pointer select-none bg-transparent border-0 p-0 ${animate ? "animate-scale-in" : ""} ${className}`}
        style={cardStyle}
      >
        <div
          className="w-full h-full rounded-lg overflow-hidden"
          style={{ border: "2px solid rgba(255,215,0,0.3)" }}
        >
          <img
            src="/assets/generated/card-back.dim_400x580.png"
            alt="Card Back"
            className="w-full h-full object-cover"
          />
        </div>
      </button>
    );
  }

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={`card-3d-container card-display-wrapper cursor-pointer select-none relative bg-transparent border-0 p-0 ${rarityClass} ${animate ? "animate-scale-in" : ""} ${className}`}
      style={cardStyle}
    >
      {/* Card frame */}
        <div
          className={`w-full h-full rounded-lg overflow-hidden relative ${frameClass}`}
          style={{
            border: selected ? "2px solid #ffd700" : "2px solid rgba(255,255,255,0.2)",
            padding: "3px",
            boxShadow: selected
              ? "inset 0 0 8px rgba(255,215,0,0.3)"
              : "inset 0 0 6px rgba(0,0,0,0.6), inset 1px 1px 0 rgba(255,255,255,0.08)",
          }}
        >
        {/* Card name banner */}
        <div
          className="w-full flex items-center justify-between px-1"
          style={{
            background: "rgba(0,0,0,0.7)",
            borderRadius: "3px 3px 0 0",
            height: `${Math.floor(h * 0.1)}px`,
            marginBottom: "2px",
          }}
        >
          <span
            className="font-heading text-white truncate flex-1"
            style={{ fontSize: nameSize, fontWeight: 700, lineHeight: 1.1 }}
          >
            {card.name}
          </span>
          {card.attribute && (
            <span style={{ fontSize: nameSize }}>{attrSymbol}</span>
          )}
        </div>

        {/* Card art */}
        <div
          className="w-full overflow-hidden bg-black"
          style={{
            height: `${Math.floor(h * 0.42)}px`,
            margin: "0 2px",
            width: `calc(100% - 4px)`,
            borderRadius: "2px",
          }}
        >
          {artUrl ? (
            <img
              src={artUrl}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full skeleton" />
          )}
        </div>

        {/* Type line */}
        <div
          className="flex items-center justify-between px-1"
          style={{ height: `${Math.floor(h * 0.07)}px`, background: "rgba(0,0,0,0.4)" }}
        >
          <span style={{ fontSize: statSize, color: "rgba(255,255,255,0.8)", fontFamily: "Cinzel, serif" }}>
            [{cardTypeLabel}]
          </span>
          {isMonster && card.level_rank && (
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(Number(card.level_rank), 12) }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: star icons are positional
                <span key={`star-${i}`} style={{ fontSize: statSize, color: "#ffd700" }}>★</span>
              ))}
            </div>
          )}
        </div>

        {/* Effect text */}
        {showDetails && (
          <div
            className="px-1 overflow-hidden"
            style={{
              height: `${Math.floor(h * 0.22)}px`,
              background: "rgba(230,220,190,0.12)",
              borderRadius: "2px",
            }}
          >
            <p
              className="text-white/80"
              style={{
                fontSize: statSize,
                lineHeight: 1.3,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: size === "xl" ? 8 : size === "lg" ? 5 : 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {card.effect_text || "No effect text."}
            </p>
          </div>
        )}

        {/* ATK/DEF */}
        {isMonster && showDetails && (
          <div
            className="flex items-center justify-end px-1 gap-2"
            style={{
              height: `${Math.floor(h * 0.09)}px`,
              background: "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(10,5,0,0.75) 40%, rgba(0,0,0,0.85) 100%)",
              borderRadius: "0 0 3px 3px",
              borderTop: "1px solid rgba(255,150,50,0.2)",
              boxShadow: "inset 0 1px 0 rgba(255,200,100,0.08)",
            }}
          >
            <span
              className="font-ui"
              style={{
                fontSize: statSize,
                color: "#ffaa44",
                textShadow: "0 0 6px rgba(255,120,0,0.6)",
                fontWeight: 700,
              }}
            >
              ATK/{Number(card.atk ?? 0)}
            </span>
            {card.card_type.__kind__ === "monster" && !card.card_type.monster?.link && (
              <span
                className="font-ui"
                style={{
                  fontSize: statSize,
                  color: "#99aaff",
                  textShadow: "0 0 6px rgba(100,120,255,0.6)",
                  fontWeight: 700,
                }}
              >
                DEF/{Number(card.def ?? 0)}
              </span>
            )}
          </div>
        )}

        {/* Rarity badge */}
        {Number(card.rarity) >= 10 && (
          <div
            className="absolute top-1 right-1"
            style={{
              fontSize: "5px",
              padding: "1px 3px",
              background: "rgba(0,0,0,0.7)",
              color: "#ffd700",
              borderRadius: "2px",
              fontFamily: "Orbitron, sans-serif",
              border: "1px solid rgba(255,215,0,0.4)",
            }}
          >
            {size !== "xs" ? rarityName.split(" ").map(w2 => w2[0]).join("") : ""}
          </div>
        )}

        {/* Custom badge */}
        {card.is_custom && (
          <div
            className="absolute top-1 left-1"
            style={{
              fontSize: "5px",
              padding: "1px 3px",
              background: "rgba(220,20,60,0.8)",
              color: "white",
              borderRadius: "2px",
              fontFamily: "Cinzel, serif",
            }}
          >
            CUSTOM
          </div>
        )}
      </div>
    </button>
  );
}
