import React, { useState, useRef } from "react";
import { useBackend } from "../hooks/useBackend";
import { ExternalBlob, Card, CardType, Attribute } from "../backend.d";
import CardDisplay from "../components/CardDisplay";
import { getRarityName } from "../utils/cardArtGenerator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Upload, Music, Image } from "lucide-react";
import { useGame } from "../context/GameContext";

interface CardFormData {
  name: string;
  cardTypeKey: string;
  attribute: string;
  level: number;
  atk: number;
  def: number;
  monsterType: string;
  effectText: string;
  rarity: number;
}

const CARD_TYPE_OPTIONS = [
  { value: "normal_monster", label: "Normal Monster" },
  { value: "effect_monster", label: "Effect Monster" },
  { value: "fusion_monster", label: "Fusion Monster" },
  { value: "synchro_monster", label: "Synchro Monster" },
  { value: "xyz_monster", label: "XYZ Monster" },
  { value: "link_monster", label: "Link Monster" },
  { value: "ritual_monster", label: "Ritual Monster" },
  { value: "spell", label: "Spell Card" },
  { value: "trap", label: "Trap Card" },
];

function buildCardType(typeKey: string): CardType {
  if (typeKey === "spell") return { __kind__: "spell", spell: null };
  if (typeKey === "trap") return { __kind__: "trap", trap: null };
  return {
    __kind__: "monster",
    monster: {
      effect: typeKey === "effect_monster",
      fusion: typeKey === "fusion_monster",
      synchro: typeKey === "synchro_monster",
      xyz: typeKey === "xyz_monster",
      link: typeKey === "link_monster",
      ritual: typeKey === "ritual_monster",
    },
  };
}

function buildAttribute(attr: string): Attribute | null {
  const map: Record<string, Attribute> = {
    dark: Attribute.dark,
    fire: Attribute.fire,
    wind: Attribute.wind,
    earth: Attribute.earth,
    light: Attribute.light,
    divine: Attribute.divine,
    water: Attribute.water,
  };
  return map[attr] ?? null;
}

export default function CustomCardCreatorScreen() {
  const { refreshCards } = useGame();
  const { actor } = useBackend();
  const [form, setForm] = useState<CardFormData>({
    name: "Shadow Dragon",
    cardTypeKey: "effect_monster",
    attribute: "dark",
    level: 7,
    atk: 2500,
    def: 2000,
    monsterType: "Dragon",
    effectText: "When this card is Normal or Special Summoned: you can add 1 DARK monster from your Deck to your hand.",
    rarity: 60,
  });
  const [artFile, setArtFile] = useState<File | null>(null);
  const [artPreviewUrl, setArtPreviewUrl] = useState<string | null>(null);
  const [summonSoundFile, setSummonSoundFile] = useState<File | null>(null);
  const [attackSoundFile, setAttackSoundFile] = useState<File | null>(null);
  const [effectSoundFile, setEffectSoundFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCard, setCreatedCard] = useState<Card | null>(null);

  const artRef = useRef<HTMLInputElement>(null);
  const summonRef = useRef<HTMLInputElement>(null);
  const attackRef = useRef<HTMLInputElement>(null);
  const effectRef = useRef<HTMLInputElement>(null);

  const previewCard: Card = {
    id: BigInt(Date.now()),
    name: form.name || "My Card",
    card_type: buildCardType(form.cardTypeKey),
    attribute: buildAttribute(form.attribute) ?? undefined,
    rarity: BigInt(form.rarity),
    is_custom: true,
    atk: BigInt(form.atk),
    def: BigInt(form.def),
    level_rank: BigInt(form.level),
    monster_type: form.monsterType,
    effect_text: form.effectText,
  };

  const handleArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArtFile(file);
    const url = URL.createObjectURL(file);
    setArtPreviewUrl(url);
  };

  const fileToExternalBlob = async (file: File): Promise<ExternalBlob> => {
    const buffer = await file.arrayBuffer();
    return ExternalBlob.fromBytes(new Uint8Array(buffer));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Card name is required!");
      return;
    }
    setIsSubmitting(true);
    try {
      const [artBlob, summonBlob, attackBlob, effectBlob] = await Promise.all([
        artFile ? fileToExternalBlob(artFile) : Promise.resolve(null),
        summonSoundFile ? fileToExternalBlob(summonSoundFile) : Promise.resolve(null),
        attackSoundFile ? fileToExternalBlob(attackSoundFile) : Promise.resolve(null),
        effectSoundFile ? fileToExternalBlob(effectSoundFile) : Promise.resolve(null),
      ]);

      const cardType = buildCardType(form.cardTypeKey);
      const attribute = buildAttribute(form.attribute);

      if (!actor) throw new Error("Not connected");
      const newCard = await actor.createCustomCard(
        cardType,
        attribute,
        BigInt(form.rarity),
        artBlob,
        summonBlob,
        attackBlob,
        effectBlob,
      );

      setCreatedCard(newCard);
      await refreshCards();
      toast.success(`${newCard.name} created and added to your collection!`);
    } catch (e) {
      toast.error("Failed to create card. Please try again.");
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "bg-black/40 border-white/20 text-white placeholder:text-white/30";
  const labelStyle = {
    fontFamily: "Cinzel, serif",
    color: "rgba(255,215,0,0.7)",
    fontSize: "11px",
    letterSpacing: "0.1em",
  };

  if (createdCard) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-6 animate-bounce">✨</div>
        <h2
          className="text-4xl font-bold mb-4 glow-gold"
          style={{ fontFamily: "Cinzel Decorative, serif", color: "#ffd700" }}
        >
          Card Created!
        </h2>
        <p className="text-white/60 mb-8">{createdCard.name} has been added to your collection.</p>
        <div className="mb-8">
          <CardDisplay card={createdCard} size="xl" animate />
        </div>
        <button
          type="button"
          onClick={() => setCreatedCard(null)}
          className="btn-game px-10 py-3 rounded-lg"
          style={{
            background: "linear-gradient(135deg, #1a0028, #2d0050)",
            color: "#ffd700",
            border: "1px solid rgba(255,215,0,0.3)",
            fontFamily: "Cinzel, serif",
          }}
        >
          Create Another Card
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="px-6 py-4 shrink-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        <h2
          className="text-3xl font-bold glow-gold"
          style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
        >
          Custom Card Creator
        </h2>
      </div>

      <div className="flex-1 flex gap-0 overflow-hidden min-h-0">
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Name */}
            <div className="sm:col-span-2">
              <Label style={labelStyle}>CARD NAME</Label>
              <Input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className={inputStyle}
                placeholder="Enter card name..."
              />
            </div>

            {/* Card Type */}
            <div>
              <Label style={labelStyle}>CARD TYPE</Label>
              <Select
                value={form.cardTypeKey}
                onValueChange={v => setForm(prev => ({ ...prev, cardTypeKey: v }))}
              >
                <SelectTrigger className={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {CARD_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attribute */}
            <div>
              <Label style={labelStyle}>ATTRIBUTE</Label>
              <Select
                value={form.attribute}
                onValueChange={v => setForm(prev => ({ ...prev, attribute: v }))}
              >
                <SelectTrigger className={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {["dark", "light", "fire", "water", "wind", "earth", "divine"].map(a => (
                    <SelectItem key={a} value={a}>{a.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            {form.cardTypeKey !== "spell" && form.cardTypeKey !== "trap" && (
              <div>
                <Label style={labelStyle}>LEVEL / RANK / LINK</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={form.level}
                  onChange={e => setForm(prev => ({ ...prev, level: Number(e.target.value) }))}
                  className={inputStyle}
                />
              </div>
            )}

            {/* ATK */}
            {form.cardTypeKey !== "spell" && form.cardTypeKey !== "trap" && (
              <div>
                <Label style={labelStyle}>ATK</Label>
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  value={form.atk}
                  onChange={e => setForm(prev => ({ ...prev, atk: Number(e.target.value) }))}
                  className={inputStyle}
                />
              </div>
            )}

            {/* DEF */}
            {form.cardTypeKey !== "spell" && form.cardTypeKey !== "trap" && form.cardTypeKey !== "link_monster" && (
              <div>
                <Label style={labelStyle}>DEF</Label>
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  value={form.def}
                  onChange={e => setForm(prev => ({ ...prev, def: Number(e.target.value) }))}
                  className={inputStyle}
                />
              </div>
            )}

            {/* Monster Type */}
            {form.cardTypeKey !== "spell" && form.cardTypeKey !== "trap" && (
              <div>
                <Label style={labelStyle}>MONSTER TYPE</Label>
                <Input
                  value={form.monsterType}
                  onChange={e => setForm(prev => ({ ...prev, monsterType: e.target.value }))}
                  className={inputStyle}
                  placeholder="Dragon, Warrior, Spellcaster..."
                />
              </div>
            )}
          </div>

          {/* Effect text */}
          <div>
            <Label style={labelStyle}>EFFECT TEXT</Label>
            <Textarea
              value={form.effectText}
              onChange={e => setForm(prev => ({ ...prev, effectText: e.target.value }))}
              className={`${inputStyle} resize-none`}
              rows={3}
              placeholder="Card effect description..."
            />
          </div>

          {/* Rarity */}
          <div>
            <div className="flex justify-between mb-2">
              <Label style={labelStyle}>RARITY</Label>
              <span
                className="text-xs font-ui"
                style={{ color: "#ffd700" }}
              >
                {getRarityName(form.rarity)} ({form.rarity})
              </span>
            </div>
            <Slider
              min={0}
              max={209}
              step={1}
              value={[form.rarity]}
              onValueChange={([v]) => setForm(prev => ({ ...prev, rarity: v }))}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Orbitron, sans-serif" }}>
              <span>Common</span>
              <span>Legendary</span>
            </div>
          </div>

          {/* Art Upload */}
          <div>
            <Label style={labelStyle}>CARD ART</Label>
            <button
              type="button"
              className="mt-1 p-4 rounded-lg border-dashed border-2 text-center cursor-pointer hover:bg-white/5 transition-colors w-full bg-transparent"
              style={{ borderColor: "rgba(255,215,0,0.3)" }}
              onClick={() => artRef.current?.click()}
            >
              <input ref={artRef} type="file" accept="image/*" onChange={handleArtUpload} className="hidden" />
              {artPreviewUrl ? (
                <img src={artPreviewUrl} alt="Art preview" className="h-32 mx-auto object-contain rounded" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/40">
                  <Image className="w-8 h-8" />
                  <span className="text-sm">Click to upload card art</span>
                  <span className="text-xs">PNG, JPG, GIF supported</span>
                </div>
              )}
            </button>
          </div>

          {/* Sound uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "SUMMON SOUND", ref: summonRef, file: summonSoundFile, set: setSummonSoundFile },
              { label: "ATTACK SOUND", ref: attackRef, file: attackSoundFile, set: setAttackSoundFile },
              { label: "EFFECT SOUND", ref: effectRef, file: effectSoundFile, set: setEffectSoundFile },
            ].map(({ label, ref, file, set }) => (
              <div key={label}>
                <Label style={labelStyle}>{label}</Label>
                <button
                  type="button"
                  onClick={() => ref.current?.click()}
                  className="w-full mt-1 p-3 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-colors"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: file ? "1px solid rgba(0,200,100,0.4)" : "1px dashed rgba(255,255,255,0.2)",
                  }}
                >
                  <input ref={ref} type="file" accept="audio/*" onChange={e => set(e.target.files?.[0] ?? null)} className="hidden" />
                  <Music className="w-4 h-4" style={{ color: file ? "#00ff88" : "rgba(255,255,255,0.3)" }} />
                  <span className="text-xs" style={{ color: file ? "#00ff88" : "rgba(255,255,255,0.4)" }}>
                    {file ? file.name.slice(0, 15) + "..." : "Upload audio..."}
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full btn-game py-4 rounded-xl text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #4a0080, #8b44ff, #4a0080)",
                backgroundSize: "200% 100%",
                color: "#ffd700",
                border: "2px solid rgba(255,215,0,0.4)",
                boxShadow: "0 0 40px rgba(150,50,255,0.4)",
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.15em",
              }}
            >
              <Sparkles className="w-6 h-6" />
              {isSubmitting ? "CREATING..." : "CREATE CARD"}
              <Sparkles className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div
          className="w-64 shrink-0 flex flex-col items-center justify-center p-6 gap-4"
          style={{
            borderLeft: "1px solid rgba(255,215,0,0.15)",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: "rgba(255,215,0,0.6)", fontFamily: "Cinzel, serif" }}
          >
            Live Preview
          </p>
          <CardDisplay
            key={`${form.name}-${form.cardTypeKey}-${form.rarity}-${artPreviewUrl}`}
            card={{ ...previewCard, art_blob: artPreviewUrl ? ExternalBlob.fromURL(artPreviewUrl) : undefined }}
            size="lg"
            showDetails
          />
          <div
            className="w-full p-3 rounded-lg text-center"
            style={{
              background: "rgba(255,215,0,0.05)",
              border: "1px solid rgba(255,215,0,0.1)",
            }}
          >
            <p className="text-xs" style={{ color: "rgba(255,215,0,0.6)", fontFamily: "Orbitron, sans-serif" }}>
              {getRarityName(form.rarity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
