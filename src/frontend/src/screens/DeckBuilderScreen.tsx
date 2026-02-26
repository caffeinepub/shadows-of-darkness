import React, { useState, useMemo } from "react";
import { useGame } from "../context/GameContext";
import { Card } from "../backend.d";
import { useBackend } from "../hooks/useBackend";
import CardDisplay from "../components/CardDisplay";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Minus, Save, Trash2, Search, BarChart2 } from "lucide-react";

interface DeckCard {
  card: Card;
  count: number;
}

export default function DeckBuilderScreen() {
  const { cards } = useGame();
  const { actor } = useBackend();
  const [search, setSearch] = useState("");
  const [deckName, setDeckName] = useState("My Deck");
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const mainDeck = deck.filter(dc => {
    const m = dc.card.card_type;
    if (m.__kind__ !== "monster") return true;
    const lvl = Number(dc.card.level_rank ?? 0);
    return !m.monster?.fusion && !m.monster?.synchro && !m.monster?.xyz && !m.monster?.link;
  });

  const extraDeck = deck.filter(dc => {
    const m = dc.card.card_type;
    if (m.__kind__ !== "monster") return false;
    return m.monster?.fusion || m.monster?.synchro || m.monster?.xyz || m.monster?.link;
  });

  const mainCount = mainDeck.reduce((s, dc) => s + dc.count, 0);
  const extraCount = extraDeck.reduce((s, dc) => s + dc.count, 0);

  const filtered = useMemo(() => {
    if (!search) return cards;
    return cards.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [cards, search]);

  const addCard = (card: Card) => {
    setDeck(prev => {
      const existing = prev.find(dc => String(dc.card.id) === String(card.id));
      if (existing) {
        if (existing.count >= 3) {
          toast.error("Maximum 3 copies per card!");
          return prev;
        }
        return prev.map(dc =>
          String(dc.card.id) === String(card.id)
            ? { ...dc, count: dc.count + 1 }
            : dc
        );
      }
      return [...prev, { card, count: 1 }];
    });
  };

  const removeCard = (cardId: bigint) => {
    setDeck(prev => {
      const existing = prev.find(dc => dc.card.id === cardId);
      if (!existing) return prev;
      if (existing.count <= 1) {
        return prev.filter(dc => dc.card.id !== cardId);
      }
      return prev.map(dc =>
        dc.card.id === cardId ? { ...dc, count: dc.count - 1 } : dc
      );
    });
  };

  const clearDeck = () => setDeck([]);

  const saveDeck = async () => {
    if (mainCount < 40) {
      toast.error(`Deck needs at least 40 cards (currently ${mainCount})`);
      return;
    }
    if (mainCount > 60) {
      toast.error(`Main deck cannot exceed 60 cards (currently ${mainCount})`);
      return;
    }
    setIsSaving(true);
    try {
      if (!actor) throw new Error("Not connected");
      await actor.createDeck(deckName);
      toast.success("Deck saved successfully!");
    } catch (e) {
      toast.error("Failed to save deck.");
    } finally {
      setIsSaving(false);
    }
  };

  // Type distribution for chart
  const typeDistribution = useMemo(() => {
    const dist = { monster: 0, spell: 0, trap: 0 };
    deck.forEach(dc => {
      const type = dc.card.card_type.__kind__;
      dist[type] = (dist[type] || 0) + dc.count;
    });
    return dist;
  }, [deck]);

  const totalCards = mainCount + extraCount;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="px-6 py-4 shrink-0 flex items-center justify-between"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        <h2 className="text-3xl font-bold glow-gold" style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}>
          Deck Builder
        </h2>
        <div className="flex items-center gap-3">
          <Input
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            className="w-48 bg-black/40 border-white/20 text-white font-heading"
            placeholder="Deck name..."
          />
          <button
            type="button"
            onClick={saveDeck}
            disabled={isSaving}
            className="btn-game flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #1a5000, #2d8000)",
              color: "#ffd700",
              border: "1px solid rgba(0,200,0,0.3)",
              fontFamily: "Cinzel, serif",
            }}
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Deck"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Card pool */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ borderRight: "1px solid rgba(255,215,0,0.15)" }}
        >
          <div className="p-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cards..."
                className="pl-9 bg-black/40 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-wrap gap-3">
              {filtered.map(card => (
                <button
                  key={String(card.id)}
                  type="button"
                  onClick={() => addCard(card)}
                  className="relative group"
                  title={`Add ${card.name}`}
                >
                  <CardDisplay card={card} size="sm" />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    style={{ background: "rgba(0,255,0,0.2)" }}
                  >
                    <Plus className="w-8 h-8 text-green-400" />
                  </div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-white/40 py-10">No cards found</p>
            )}
          </div>
        </div>

        {/* Deck panel */}
        <div className="w-80 flex flex-col" style={{ background: "rgba(0,0,0,0.3)" }}>
          {/* Stats */}
          <div
            className="p-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,215,0,0.15)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm" style={{ color: "#ffd700" }}>
                DECK ({mainCount}/60)
              </h3>
              <div className="flex gap-2">
                <span className="text-xs font-ui" style={{ color: mainCount >= 40 ? "#00ff88" : "rgba(255,100,0,0.8)" }}>
                  {mainCount < 40 ? `Need ${40 - mainCount} more` : "Valid"}
                </span>
                <button
                  type="button"
                  onClick={clearDeck}
                  className="text-red-400 hover:text-red-300"
                  title="Clear deck"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Type distribution mini chart */}
            <div className="space-y-1">
              {[
                { label: "Monster", key: "monster", color: "#ff8822" },
                { label: "Spell", key: "spell", color: "#22ff88" },
                { label: "Trap", key: "trap", color: "#cc22ff" },
              ].map(({ label, key, color }) => {
                const count = typeDistribution[key as keyof typeof typeDistribution] || 0;
                const pct = totalCards > 0 ? (count / totalCards) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-white/50">{label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="w-6 text-right" style={{ color }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {extraCount > 0 && (
              <p className="text-xs mt-2" style={{ color: "rgba(150,100,255,0.8)", fontFamily: "Orbitron, sans-serif" }}>
                Extra Deck: {extraCount}/15
              </p>
            )}
          </div>

          {/* Deck cards list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {deck.length === 0 ? (
              <div className="text-center py-8">
                <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "#ffd700" }} />
                <p className="text-sm text-white/30">Click cards to add them</p>
              </div>
            ) : (
              deck.map(dc => (
                <div
                  key={String(dc.card.id)}
                  className="flex items-center gap-2 p-2 rounded-lg group"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="shrink-0">
                    <CardDisplay card={dc.card} size="xs" showDetails={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold truncate"
                      style={{
                        color: dc.card.card_type.__kind__ === "spell"
                          ? "#22ff88"
                          : dc.card.card_type.__kind__ === "trap"
                          ? "#cc22ff"
                          : "#ff8822",
                        fontFamily: "Cinzel, serif",
                      }}
                    >
                      {dc.card.name}
                    </p>
                    <p className="text-xs text-white/30 font-ui">
                      {dc.card.card_type.__kind__ === "monster"
                        ? `${Number(dc.card.atk ?? 0)}/${Number(dc.card.def ?? 0)}`
                        : dc.card.card_type.__kind__.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => removeCard(dc.card.id)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/30"
                    >
                      <Minus className="w-3 h-3 text-red-400" />
                    </button>
                    <span className="w-5 text-center font-ui text-xs" style={{ color: "#ffd700" }}>
                      {dc.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => addCard(dc.card)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-green-500/30"
                    >
                      <Plus className="w-3 h-3 text-green-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
