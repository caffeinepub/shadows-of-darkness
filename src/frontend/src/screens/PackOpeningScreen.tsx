import React, { useState, useCallback } from "react";
import { useGame } from "../context/GameContext";
import { Card, Attribute } from "../backend.d";
import { useBackend } from "../hooks/useBackend";
import CardDisplay from "../components/CardDisplay";
import { getRarityName, getRarityClass } from "../utils/cardArtGenerator";
import SoundEngine from "../utils/soundEngine";
import { toast } from "sonner";
import { Package, Sparkles, Star, Zap } from "lucide-react";

const PACK_TYPES = [
  {
    id: "standard",
    name: "Shadow Pack",
    description: "Standard cards with rare chance",
    cards: 5,
    rarityBonus: 0,
    gradient: "linear-gradient(135deg, #1a0028, #2d0050, #4a0080)",
    glow: "rgba(150,50,255,0.5)",
    icon: "🌑",
  },
  {
    id: "elite",
    name: "Darkness Elite",
    description: "Higher chance of rare cards",
    cards: 8,
    rarityBonus: 30,
    gradient: "linear-gradient(135deg, #1a0000, #3d0000, #600020)",
    glow: "rgba(220,20,60,0.5)",
    icon: "🔥",
  },
  {
    id: "legendary",
    name: "Void Legend Pack",
    description: "Guaranteed ultra-rare or above",
    cards: 5,
    rarityBonus: 80,
    gradient: "linear-gradient(135deg, #1a1500, #3d3000, #605000)",
    glow: "rgba(255,215,0,0.6)",
    icon: "⚡",
  },
];

// Generate procedural cards for pack reveal (simulated)
function generatePackCards(count: number, rarityBonus: number, allCards: Card[]): Card[] {
  if (allCards.length === 0) {
    // Generate placeholder cards if collection is empty
    return Array.from({ length: count }, (_, i): Card => ({
      id: BigInt(Date.now() + i),
      name: ["Shadow Dragon", "Void Knight", "Dark Sorceress", "Cursed Warrior", "Abyss Mage"][i % 5],
      card_type: { __kind__: "monster", monster: { xyz: false, link: false, ritual: false, effect: true, fusion: false, synchro: false } },
      rarity: BigInt(Math.max(0, Math.min(209, Math.floor(Math.random() * 100) + rarityBonus))),
      is_custom: false,
      atk: BigInt(1500 + Math.floor(Math.random() * 1500)),
      def: BigInt(1000 + Math.floor(Math.random() * 1000)),
      level_rank: BigInt(3 + Math.floor(Math.random() * 5)),
      attribute: [Attribute.dark, Attribute.fire, Attribute.light, Attribute.water, Attribute.wind][Math.floor(Math.random() * 5)],
      effect_text: "This card was born from the shadows. Its power is immeasurable.",
    }));
  }

  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);

  // Override rarities with bonus
  return picked.map(card => ({
    ...card,
    rarity: BigInt(Math.max(Number(card.rarity), rarityBonus > 0 ? Math.floor(Math.random() * rarityBonus) + rarityBonus : Number(card.rarity))),
  }));
}

export default function PackOpeningScreen() {
  const { userProfile, cards: allCards, refreshProfile } = useGame();
  const { actor } = useBackend();
  const [phase, setPhase] = useState<"select" | "opening" | "reveal" | "done">("select");
  const [selectedPack, setSelectedPack] = useState(PACK_TYPES[0]);
  const [revealedCards, setRevealedCards] = useState<Card[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isOpening, setIsOpening] = useState(false);

  const packCount = Number(userProfile?.pack_count ?? 0);

  const openPack = useCallback(async () => {
    if (packCount <= 0) {
      toast.error("No packs available!");
      return;
    }

    setIsOpening(true);
    setPhase("opening");

    // Play pack open sound
    if (!document.querySelector('[data-muted="true"]')) {
      SoundEngine.packOpen();
    }

    // Simulate pack opening delay
    await new Promise(r => setTimeout(r, 1500));

    const newCards = generatePackCards(selectedPack.cards, selectedPack.rarityBonus, allCards);
    setRevealedCards(newCards);
    setVisibleCount(0);
    setPhase("reveal");

    // Reveal cards one by one
    for (let i = 0; i < newCards.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setVisibleCount(i + 1);
      const rarity = Number(newCards[i].rarity);
      if (!document.querySelector('[data-muted="true"]')) {
        SoundEngine.rarityReveal(rarity);
      }
    }

    setPhase("done");
    setIsOpening(false);

    // Try to add cards to collection
    try {
      if (actor) {
        await Promise.all(newCards.map(c => actor.addUserCard(c.id)));
      }
      await refreshProfile();
      toast.success(`${newCards.length} cards added to your collection!`);
    } catch (e) {
      // Cards may already be in collection
    }
  }, [packCount, selectedPack, allCards, refreshProfile]);

  const reset = () => {
    setPhase("select");
    setRevealedCards([]);
    setVisibleCount(0);
  };

  const getRarityBurstColor = (rarity: number): string => {
    if (rarity >= 180) return "#ffffff";
    if (rarity >= 160) return "#ffd700";
    if (rarity >= 120) return "rgba(200,100,255,0.8)";
    if (rarity >= 80) return "rgba(100,200,255,0.8)";
    if (rarity >= 40) return "rgba(255,215,0,0.8)";
    if (rarity >= 20) return "rgba(100,150,255,0.8)";
    return "rgba(255,255,255,0.5)";
  };

  return (
    <div className="h-full flex flex-col" style={{ minHeight: 0 }}>
      {/* Header */}
      <div
        className="px-6 py-4 shrink-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-3xl font-bold glow-gold"
            style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
          >
            Pack Opening
          </h2>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{
              background: "rgba(150,50,255,0.2)",
              border: "1px solid rgba(150,50,255,0.4)",
            }}
          >
            <Package className="w-5 h-5" style={{ color: "#a855f7" }} />
            <span className="font-ui text-lg" style={{ color: "#a855f7" }}>
              {packCount} packs
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {phase === "select" && (
          <div className="max-w-4xl mx-auto">
            {packCount === 0 ? (
              <div
                className="text-center p-12 rounded-2xl"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,215,0,0.15)",
                }}
              >
                <Package className="w-20 h-20 mx-auto mb-6 opacity-30" style={{ color: "#ffd700" }} />
                <h3 className="text-2xl font-heading mb-3" style={{ color: "rgba(255,215,0,0.7)" }}>
                  No Packs Available
                </h3>
                <p className="text-white/50 mb-6">
                  Earn packs by winning duels and leveling up your duelist rank.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-white/50">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255,215,0,0.05)" }}>
                    <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: "#ffd700" }} />
                    Win a duel
                    <br />+1 pack
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255,215,0,0.05)" }}>
                    <Star className="w-5 h-5 mx-auto mb-1" style={{ color: "#ffd700" }} />
                    Level up
                    <br />+2 packs
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255,215,0,0.05)" }}>
                    <Sparkles className="w-5 h-5 mx-auto mb-1" style={{ color: "#ffd700" }} />
                    Daily login
                    <br />+1 pack
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-center mb-8 text-lg" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Rajdhani, sans-serif" }}>
                  Choose your pack type — higher packs guarantee rarer cards
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  {PACK_TYPES.map(pack => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedPack(pack)}
                      className="relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 text-left"
                      style={{
                        background: pack.gradient,
                        border: selectedPack.id === pack.id
                          ? `2px solid ${pack.glow}`
                          : "2px solid rgba(255,255,255,0.1)",
                        boxShadow: selectedPack.id === pack.id
                          ? `0 0 30px ${pack.glow}, 0 0 60px ${pack.glow}`
                          : "0 8px 32px rgba(0,0,0,0.5)",
                      }}
                    >
                      {/* Pack art */}
                      <div className="text-5xl text-center mb-4">{pack.icon}</div>
                      <h3
                        className="text-lg font-bold mb-1"
                        style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
                      >
                        {pack.name}
                      </h3>
                      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {pack.description}
                      </p>
                      <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Orbitron, sans-serif" }}>
                        <span>{pack.cards} cards</span>
                        <span>{pack.rarityBonus > 0 ? `+${pack.rarityBonus} rarity` : "Standard"}</span>
                      </div>
                      {selectedPack.id === pack.id && (
                        <div
                          className="absolute top-2 right-2 w-3 h-3 rounded-full"
                          style={{ background: pack.glow, boxShadow: `0 0 8px ${pack.glow}` }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={openPack}
                    disabled={isOpening}
                    className="btn-game px-16 py-5 text-xl rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #4a0080, #8b44ff, #4a0080)",
                      backgroundSize: "200% 100%",
                      color: "#ffd700",
                      border: "2px solid rgba(255,215,0,0.5)",
                      boxShadow: "0 0 40px rgba(150,50,255,0.5)",
                      fontFamily: "Cinzel, serif",
                      letterSpacing: "0.2em",
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      OPEN PACK
                      <Sparkles className="w-6 h-6" />
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {phase === "opening" && (
          <div className="flex flex-col items-center justify-center h-64">
            <div
              className="w-40 h-56 rounded-xl flex items-center justify-center text-6xl"
              style={{
                background: selectedPack.gradient,
                boxShadow: `0 0 60px ${selectedPack.glow}`,
                animation: "energy-wave 0.5s ease-in-out infinite",
                border: `2px solid ${selectedPack.glow}`,
              }}
            >
              {selectedPack.icon}
            </div>
            <p
              className="mt-6 text-lg animate-pulse"
              style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
            >
              Opening {selectedPack.name}...
            </p>
          </div>
        )}

        {(phase === "reveal" || phase === "done") && (
          <div className="max-w-5xl mx-auto">
            <h3
              className="text-center text-2xl font-bold mb-8"
              style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
            >
              {phase === "done" ? "Cards Revealed!" : "Revealing Cards..."}
            </h3>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {revealedCards.map((card, idx) => (
                <div key={String(card.id)} className="relative">
                  {idx < visibleCount ? (
                    <div className="relative">
                      {/* Rarity burst effect */}
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none rarity-burst"
                        style={{
                          background: `radial-gradient(circle, ${getRarityBurstColor(Number(card.rarity))} 0%, transparent 70%)`,
                          zIndex: 20,
                        }}
                      />
                      <CardDisplay card={card} size="md" animate />
                      <div
                        className="mt-1 text-center text-xs font-ui"
                        style={{ color: getRarityBurstColor(Number(card.rarity)) }}
                      >
                        {getRarityName(Number(card.rarity))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-lg"
                      style={{
                        width: 120,
                        height: 175,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <img
                        src="/assets/generated/card-back.dim_400x580.png"
                        alt="Card"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {phase === "done" && (
              <div className="text-center space-y-4">
                <p className="text-white/60">All cards added to your collection!</p>
                <button
                  type="button"
                  onClick={reset}
                  className="btn-game px-10 py-3 rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, #1a0028, #2d0050)",
                    color: "#ffd700",
                    border: "1px solid rgba(255,215,0,0.3)",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  Open Another Pack
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
