import React, { useState, useMemo } from "react";
import { useGame } from "../context/GameContext";
import { Card } from "../backend.d";
import CardDisplay from "../components/CardDisplay";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRarityName } from "../utils/cardArtGenerator";
import { Search, Filter, SortAsc, Layers } from "lucide-react";

export default function CollectionScreen() {
  const { cards, isLoadingCards } = useGame();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAttribute, setFilterAttribute] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const filtered = useMemo(() => {
    let result = [...cards];

    if (search) {
      result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }

    if (filterType !== "all") {
      result = result.filter(c => c.card_type.__kind__ === filterType);
    }

    if (filterAttribute !== "all") {
      result = result.filter(c => c.attribute === filterAttribute);
    }

    if (filterRarity !== "all") {
      const rarityRanges: Record<string, [number, number]> = {
        common: [0, 9],
        rare: [10, 39],
        ultra: [40, 79],
        secret: [80, 139],
        legendary: [140, 209],
      };
      const range = rarityRanges[filterRarity];
      if (range) {
        result = result.filter(c => Number(c.rarity) >= range[0] && Number(c.rarity) <= range[1]);
      }
    }

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "atk") return Number(b.atk ?? 0) - Number(a.atk ?? 0);
      if (sortBy === "def") return Number(b.def ?? 0) - Number(a.def ?? 0);
      if (sortBy === "rarity") return Number(b.rarity) - Number(a.rarity);
      if (sortBy === "level") return Number(b.level_rank ?? 0) - Number(a.level_rank ?? 0);
      return 0;
    });

    return result;
  }, [cards, search, filterType, filterAttribute, filterRarity, sortBy]);

  const labelStyle = {
    fontFamily: "Cinzel, serif",
    color: "rgba(255,215,0,0.8)",
    fontSize: "11px",
    letterSpacing: "0.15em",
    marginBottom: "4px",
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "rgba(0,0,0,0.3)" }}>
      {/* Header */}
      <div
        className="px-6 py-4 shrink-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        <h2
          className="text-3xl font-bold mb-4 glow-gold"
          style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
        >
          My Collection
          <span className="ml-3 text-lg font-normal" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Orbitron, sans-serif" }}>
            {cards.length} cards
          </span>
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-40">
            <p style={labelStyle}>SEARCH</p>
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

          <div className="min-w-32">
            <p style={labelStyle}>TYPE</p>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="monster">Monster</SelectItem>
                <SelectItem value="spell">Spell</SelectItem>
                <SelectItem value="trap">Trap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-36">
            <p style={labelStyle}>ATTRIBUTE</p>
            <Select value={filterAttribute} onValueChange={setFilterAttribute}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="dark">DARK</SelectItem>
                <SelectItem value="light">LIGHT</SelectItem>
                <SelectItem value="fire">FIRE</SelectItem>
                <SelectItem value="water">WATER</SelectItem>
                <SelectItem value="wind">WIND</SelectItem>
                <SelectItem value="earth">EARTH</SelectItem>
                <SelectItem value="divine">DIVINE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-36">
            <p style={labelStyle}>RARITY</p>
            <Select value={filterRarity} onValueChange={setFilterRarity}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20">
                <SelectItem value="all">All Rarities</SelectItem>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="rare">Rare/Super</SelectItem>
                <SelectItem value="ultra">Ultra/Secret</SelectItem>
                <SelectItem value="secret">Prismatic/Ghost</SelectItem>
                <SelectItem value="legendary">Legendary+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-32">
            <p style={labelStyle}>SORT BY</p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20">
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="atk">ATK</SelectItem>
                <SelectItem value="def">DEF</SelectItem>
                <SelectItem value="rarity">Rarity</SelectItem>
                <SelectItem value="level">Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoadingCards ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Array.from({ length: 16 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: loading skeleton
              <div key={i} className="skeleton rounded-lg" style={{ width: 90, height: 131 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Layers className="w-16 h-16 mb-4" style={{ color: "rgba(255,215,0,0.3)" }} />
            <p className="text-xl font-heading" style={{ color: "rgba(255,215,0,0.6)" }}>
              {cards.length === 0 ? "No cards yet!" : "No cards match your filters"}
            </p>
            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              {cards.length === 0
                ? "Open packs to start your collection"
                : "Try different filter settings"}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {filtered.map(card => (
              <div key={String(card.id)} className="relative group">
                <CardDisplay
                  card={card}
                  size="sm"
                  onClick={() => setSelectedCard(card)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card detail modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent
          className="max-w-2xl"
          style={{
            background: "linear-gradient(135deg, #0a0010, #1a0028)",
            border: "1px solid rgba(255,215,0,0.3)",
            boxShadow: "0 0 60px rgba(255,215,0,0.2)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}>
              {selectedCard?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="flex gap-6">
              <div className="shrink-0">
                <CardDisplay card={selectedCard} size="lg" showDetails />
              </div>
              <div className="flex-1 space-y-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.1)" }}
                >
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.6)", fontFamily: "Cinzel, serif" }}>
                    Rarity
                  </p>
                  <p className="text-lg font-bold" style={{ color: "#ffd700" }}>
                    {getRarityName(Number(selectedCard.rarity))}
                  </p>
                  <p className="text-xs text-white/40">Index: {Number(selectedCard.rarity)}</p>
                </div>

                {selectedCard.card_type.__kind__ === "monster" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="p-3 rounded-lg text-center"
                      style={{ background: "rgba(255,100,0,0.1)", border: "1px solid rgba(255,100,0,0.2)" }}
                    >
                      <p className="text-xs text-white/50 font-ui">ATK</p>
                      <p className="text-2xl font-bold font-ui" style={{ color: "#ff8822" }}>
                        {Number(selectedCard.atk ?? 0)}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-lg text-center"
                      style={{ background: "rgba(100,100,255,0.1)", border: "1px solid rgba(100,100,255,0.2)" }}
                    >
                      <p className="text-xs text-white/50 font-ui">DEF</p>
                      <p className="text-2xl font-bold font-ui" style={{ color: "#8888ff" }}>
                        {Number(selectedCard.def ?? 0)}
                      </p>
                    </div>
                  </div>
                )}

                {selectedCard.effect_text && (
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Cinzel, serif" }}>
                      Effect
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {selectedCard.effect_text}
                    </p>
                  </div>
                )}

                {selectedCard.attribute && (
                  <Badge
                    style={{
                      background: "rgba(255,215,0,0.15)",
                      border: "1px solid rgba(255,215,0,0.3)",
                      color: "#ffd700",
                      fontFamily: "Cinzel, serif",
                    }}
                  >
                    {String(selectedCard.attribute).toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
