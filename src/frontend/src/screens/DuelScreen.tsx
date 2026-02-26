import React, { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "../context/GameContext";
import { Card } from "../backend.d";
import CardDisplay from "../components/CardDisplay";
import {
  DuelState,
  DuelPhase,
  FieldCard,
  createDuelState,
  applyAction,
  runAITurn,
  generateAIDeck,
} from "../utils/gameEngine";
import SoundEngine from "../utils/soundEngine";
import { useBackend } from "../hooks/useBackend";
import { toast } from "sonner";
import { Swords, Shield, ChevronRight, RotateCcw, X } from "lucide-react";

interface DuelScreenProps {
  onExit: () => void;
}

const PHASES: DuelPhase[] = ["DRAW", "STANDBY", "MAIN1", "BATTLE", "MAIN2", "END"];
const PHASE_LABELS: Record<DuelPhase, string> = {
  DRAW: "DRAW",
  STANDBY: "STANDBY",
  MAIN1: "MAIN 1",
  BATTLE: "BATTLE",
  MAIN2: "MAIN 2",
  END: "END",
};

function LPBar({ current, max, name, isPlayer }: { current: number; max: number; name: string; isPlayer: boolean }) {
  const pct = Math.max(0, (current / max) * 100);
  const color = pct > 50 ? "#00ff88" : pct > 25 ? "#ffaa00" : "#ff2244";

  return (
    <div className="flex items-center gap-3">
      {!isPlayer && (
        <span className="text-sm font-heading truncate max-w-24" style={{ color: "rgba(255,255,255,0.8)" }}>
          {name}
        </span>
      )}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-ui" style={{ color: "rgba(255,255,255,0.5)" }}>LP</span>
          <span className="text-sm font-bold font-ui" style={{ color }}>
            {current.toLocaleString()}
          </span>
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
      </div>
      {isPlayer && (
        <span className="text-sm font-heading truncate max-w-24" style={{ color: "rgba(255,255,255,0.8)" }}>
          {name}
        </span>
      )}
    </div>
  );
}

function MonsterZoneSlot({
  fieldCard,
  zoneIndex,
  isPlayer,
  highlighted,
  onClick,
}: {
  fieldCard: FieldCard | null;
  zoneIndex: number;
  isPlayer: boolean;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`monster-zone rounded-lg flex items-center justify-center transition-all duration-200 ${highlighted ? "highlight" : ""}`}
      style={{
        width: 70,
        height: 100,
        cursor: highlighted || fieldCard ? "pointer" : "default",
        position: "relative",
      }}
    >
      {fieldCard ? (
        <CardDisplay
          card={fieldCard.card}
          size="xs"
          position={fieldCard.position === "FACEDOWN" ? "SET" : fieldCard.position}
          faceDown={!isPlayer && (fieldCard.position === "SET" || fieldCard.position === "FACEDOWN")}
          isAttacking={fieldCard.attackedThisTurn}
        />
      ) : (
        <span className="text-xs opacity-30 font-ui" style={{ color: "rgba(255,150,50,0.5)" }}>
          {zoneIndex + 1}
        </span>
      )}
    </button>
  );
}

function SpellTrapZoneSlot({
  fieldCard,
  zoneIndex,
  isPlayer,
  highlighted,
  onClick,
}: {
  fieldCard: FieldCard | null;
  zoneIndex: number;
  isPlayer: boolean;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`spell-zone rounded-lg flex items-center justify-center transition-all ${highlighted ? "highlight" : ""}`}
      style={{ width: 70, height: 60 }}
    >
      {fieldCard ? (
        fieldCard.position === "SET" || !isPlayer ? (
          <div
            className="w-full h-full rounded flex items-center justify-center"
            style={{ background: "rgba(0,80,50,0.5)", fontSize: "20px" }}
          >
            {isPlayer ? "🃏" : "?"}
          </div>
        ) : (
          <div className="w-full h-full rounded flex items-center justify-center text-xs"
            style={{ background: "rgba(0,80,50,0.5)", color: "#22ff88" }}>
            {fieldCard.card.card_type.__kind__ === "spell" ? "✦" : "⬡"}
          </div>
        )
      ) : (
        <span className="text-xs opacity-20 font-ui" style={{ color: "rgba(50,200,100,0.5)" }}>
          S/T
        </span>
      )}
    </button>
  );
}

export default function DuelScreen({ onExit }: DuelScreenProps) {
  const { cards, userProfile } = useGame();
  const { actor } = useBackend();
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [mode, setMode] = useState<"select" | "ai" | "pvp" | "result">("select");
  const [selectedHandIdx, setSelectedHandIdx] = useState<number | null>(null);
  const [actionMode, setActionMode] = useState<"none" | "summon" | "attack" | "set_monster" | "set_st">("none");
  const [logOpen, setLogOpen] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }); // runs every render — intentionally captures log updates

  const playerDeck = cards.length >= 20
    ? [...cards].sort(() => Math.random() - 0.5).slice(0, 40)
    : generateAIDeck(cards);

  const startAIDuel = useCallback(() => {
    const aiDeck = generateAIDeck(cards.length > 0 ? cards : playerDeck);
    const state = createDuelState(playerDeck, aiDeck);
    setDuelState(state);
    setMode("ai");
    setActionMode("none");
    setSelectedHandIdx(null);
  }, [cards, playerDeck]);

  const handlePhaseAdvance = () => {
    if (!duelState || duelState.activePlayer !== 0) return;

    let newState = duelState;

    if (duelState.phase === "DRAW") {
      newState = applyAction(duelState, "DRAW");
      SoundEngine.cardDraw();
    } else if (duelState.phase === "END") {
      newState = applyAction(duelState, "END_TURN");
      setActionMode("none");
      setSelectedHandIdx(null);
      // Run AI turn after brief delay
      if (mode === "ai") {
        setIsAIThinking(true);
        setTimeout(() => {
          const aiState = runAITurn(newState);
          setDuelState(aiState);
          setIsAIThinking(false);
          if (aiState.isOver) {
            setMode("result");
          }
        }, 1500);
        return;
      }
    } else {
      newState = applyAction(duelState, "ADVANCE_PHASE");
    }

    setDuelState(newState);
    if (newState.isOver) setMode("result");
    setActionMode("none");
    setSelectedHandIdx(null);
  };

  const handleHandCardClick = (idx: number) => {
    if (!duelState || duelState.activePlayer !== 0) return;
    if (duelState.phase !== "MAIN1" && duelState.phase !== "MAIN2") return;

    const card = duelState.players[0].hand[idx];
    if (!card) return;

    if (selectedHandIdx === idx) {
      setSelectedHandIdx(null);
      setActionMode("none");
      return;
    }

    setSelectedHandIdx(idx);

    if (card.card_type.__kind__ === "monster") {
      const m = card.card_type.monster;
      if (m?.fusion || m?.synchro || m?.xyz || m?.link) {
        // Extra deck stuff — simplified
        toast.info("Extra deck summoning coming soon!");
        return;
      }
      const level = Number(card.level_rank ?? 0);
      if (level <= 4) {
        setActionMode("summon");
      } else {
        toast.info("Tribute summon requires monsters on field");
        setActionMode("none");
      }
    } else if (card.card_type.__kind__ === "spell") {
      setActionMode("set_st");
    } else if (card.card_type.__kind__ === "trap") {
      setActionMode("set_st");
    }
  };

  const handlePlayerMonsterZoneClick = (zoneIdx: number) => {
    if (!duelState || duelState.activePlayer !== 0) return;

    if (actionMode === "summon" && selectedHandIdx !== null) {
      const newState = applyAction(duelState, "NORMAL_SUMMON", {
        handIndex: selectedHandIdx,
        zoneIndex: zoneIdx,
      });
      setDuelState(newState);
      SoundEngine.monsterSummon();
      setActionMode("none");
      setSelectedHandIdx(null);
      if (newState.isOver) setMode("result");
      return;
    }

    if (actionMode === "attack") return;

    const fieldCard = duelState.players[0].monsterZones[zoneIdx];
    if (fieldCard && duelState.phase === "BATTLE") {
      setActionMode("attack");
      setSelectedHandIdx(zoneIdx);
      toast.info("Select target or click empty field for direct attack");
    }
  };

  const handlePlayerSTZoneClick = (zoneIdx: number) => {
    if (!duelState || duelState.activePlayer !== 0) return;
    if (actionMode !== "set_st" || selectedHandIdx === null) return;

    const card = duelState.players[0].hand[selectedHandIdx];
    if (!card) return;

    if (card.card_type.__kind__ === "spell") {
      const newState = applyAction(duelState, "ACTIVATE_SPELL", { handIndex: selectedHandIdx });
      setDuelState(newState);
      SoundEngine.spellActivate();
    } else {
      const newState = applyAction(duelState, "SET_SPELL_TRAP", {
        handIndex: selectedHandIdx,
        zoneIndex: zoneIdx,
      });
      setDuelState(newState);
      SoundEngine.trapActivate();
    }
    setActionMode("none");
    setSelectedHandIdx(null);
  };

  const handleOpponentMonsterZoneClick = (zoneIdx: number) => {
    if (!duelState || duelState.activePlayer !== 0 || duelState.phase !== "BATTLE") return;
    if (actionMode !== "attack" || selectedHandIdx === null) return;

    const newState = applyAction(duelState, "ATTACK", {
      attackerZone: selectedHandIdx,
      targetZone: zoneIdx,
    });
    setDuelState(newState);
    SoundEngine.attack();
    setActionMode("none");
    setSelectedHandIdx(null);
    if (newState.isOver) setMode("result");
  };

  const handleDirectAttack = () => {
    if (!duelState || actionMode !== "attack" || selectedHandIdx === null) return;
    const hasOppMonsters = duelState.players[1].monsterZones.some(z => z !== null);
    if (hasOppMonsters) {
      toast.error("Cannot direct attack while opponent has monsters!");
      return;
    }
    const newState = applyAction(duelState, "ATTACK", {
      attackerZone: selectedHandIdx,
      targetZone: "direct",
    });
    setDuelState(newState);
    SoundEngine.attack();
    setActionMode("none");
    setSelectedHandIdx(null);
    if (newState.isOver) setMode("result");
  };

  if (mode === "select") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <h2
          className="text-4xl font-bold mb-12 glow-gold"
          style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}
        >
          Choose Duel Mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl w-full">
          <button
            type="button"
            onClick={startAIDuel}
            className="group p-8 rounded-2xl text-left transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #1a0000, #3d0010)",
              border: "2px solid rgba(220,20,60,0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 40px rgba(220,20,60,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)"; }}
          >
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}>
              VS Computer
            </h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Battle against the AI opponent. Earn XP and packs on victory.
            </p>
          </button>

          <button
            type="button"
            onClick={async () => {
              setMode("pvp");
              try {
                if (actor) await actor.initDuel(null);
                toast.info("Waiting for opponent to join...");
              } catch (e) {
                toast.error("Failed to create PvP duel");
                setMode("select");
              }
            }}
            className="group p-8 rounded-2xl text-left transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #001a3a, #002d6a)",
              border: "2px solid rgba(100,150,255,0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 40px rgba(100,150,255,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)"; }}
          >
            <div className="text-5xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}>
              PvP Online
            </h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Challenge real duelists worldwide. Prove your mastery.
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "pvp") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="text-6xl mb-6 animate-pulse">⚔️</div>
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "Cinzel, serif", color: "#ffd700" }}>
          Waiting for Opponent
        </h2>
        <p className="text-white/60 mb-8">Challenge link created. Waiting for another duelist...</p>
        <button
          type="button"
          onClick={() => setMode("select")}
          className="btn-game px-8 py-3 rounded-lg"
          style={{ background: "rgba(220,20,60,0.3)", border: "1px solid rgba(220,20,60,0.5)", color: "#ffd700", fontFamily: "Cinzel, serif" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (mode === "result" && duelState) {
    const playerWon = duelState.winner === 0;
    return (
      <div
        className="h-full flex flex-col items-center justify-center text-center p-8"
        style={{
          background: playerWon
            ? "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(220,20,60,0.15) 0%, transparent 70%)",
        }}
      >
        <div className="text-8xl mb-6">{playerWon ? "🏆" : "💀"}</div>
        <h2
          className={`text-5xl font-bold mb-4 victory-text`}
          style={{
            fontFamily: "Cinzel Decorative, serif",
            color: playerWon ? "#ffd700" : "#dc143c",
          }}
        >
          {playerWon ? "VICTORY!" : "DEFEAT..."}
        </h2>
        <p className="text-lg mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
          {playerWon
            ? `${userProfile?.username ?? "Duelist"} wins by ${duelState.players[1].lp === 0 ? "LP depletion" : "deckout"}!`
            : "The darkness has claimed you..."}
        </p>
        {playerWon && (
          <div
            className="flex gap-6 mb-8 p-4 rounded-xl"
            style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)" }}
          >
            <div className="text-center">
              <p className="text-2xl font-bold font-ui" style={{ color: "#ffd700" }}>+200</p>
              <p className="text-xs text-white/50">XP EARNED</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-ui" style={{ color: "#a855f7" }}>+1</p>
              <p className="text-xs text-white/50">PACK EARNED</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-ui" style={{ color: "#00ff88" }}>{duelState.turn}</p>
              <p className="text-xs text-white/50">TURNS</p>
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={startAIDuel}
            className="btn-game flex items-center gap-2 px-8 py-3 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #1a0028, #2d0050)",
              color: "#ffd700",
              border: "1px solid rgba(255,215,0,0.3)",
              fontFamily: "Cinzel, serif",
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Duel Again
          </button>
          <button
            type="button"
            onClick={onExit}
            className="btn-game flex items-center gap-2 px-8 py-3 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "Cinzel, serif",
            }}
          >
            <X className="w-4 h-4" />
            Exit
          </button>
        </div>
      </div>
    );
  }

  if (!duelState) return null;

  const player = duelState.players[0];
  const opponent = duelState.players[1];
  const isPlayerTurn = duelState.activePlayer === 0;
  const canAdvance = isPlayerTurn && !isAIThinking;

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative"
      style={{
        background: `url('/assets/generated/duel-field.dim_1600x900.jpg') center/cover`,
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      {/* Exit button */}
      <button
        type="button"
        onClick={onExit}
        className="absolute top-3 right-3 z-30 p-2 rounded-lg hover:bg-white/10"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 flex flex-col h-full">
        {/* Opponent LP */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div
            className="p-2 rounded-xl max-w-sm"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(220,20,60,0.3)" }}
          >
            <LPBar
              current={opponent.lp}
              max={8000}
              name="Opponent"
              isPlayer={false}
            />
          </div>
        </div>

        {/* Opponent field */}
        <div className="shrink-0 px-4">
          {/* Opponent hand (face-down) */}
          <div className="flex justify-center gap-1 mb-2">
            {opponent.hand.map((card) => (
              <CardDisplay key={`opp-hand-${String(card.id)}`} card={card} size="xs" faceDown />
            ))}
          </div>
          {/* Opponent spell/trap zones */}
          <div className="flex justify-center gap-2 mb-1">
            {/* biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-zone array */}
            {opponent.spellTrapZones.map((fc, i) => (
              <SpellTrapZoneSlot
                key={`opp-st-${i}`}
                fieldCard={fc}
                zoneIndex={i}
                isPlayer={false}
                highlighted={false}
                onClick={() => {}}
              />
            ))}
          </div>
          {/* Opponent monster zones */}
          <div className="flex justify-center gap-2">
            {/* biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-zone array */}
            {opponent.monsterZones.map((fc, i) => (
              <MonsterZoneSlot
                key={`opp-m-${i}`}
                fieldCard={fc}
                zoneIndex={i}
                isPlayer={false}
                highlighted={actionMode === "attack"}
                onClick={() => handleOpponentMonsterZoneClick(i)}
              />
            ))}
          </div>
        </div>

        {/* Info bar */}
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0 my-2"
          style={{ background: "rgba(0,0,0,0.6)", borderTop: "1px solid rgba(255,215,0,0.2)", borderBottom: "1px solid rgba(255,215,0,0.2)" }}
        >
          {/* Phase indicators */}
          <div className="flex gap-1">
            {PHASES.map(p => (
              <div
                key={p}
                className={`px-2 py-1 rounded text-xs font-ui transition-all ${duelState.phase === p ? "phase-active" : ""}`}
                style={{
                  color: duelState.phase === p ? "#ffd700" : "rgba(255,255,255,0.3)",
                  fontSize: "9px",
                }}
              >
                {PHASE_LABELS[p]}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-ui" style={{ color: "rgba(255,255,255,0.5)" }}>
              Turn {duelState.turn}
            </span>
            {isAIThinking && (
              <span className="text-xs animate-pulse" style={{ color: "#dc143c", fontFamily: "Cinzel, serif" }}>
                OPPONENT THINKING...
              </span>
            )}
          </div>

          {/* Action indicator */}
          <div className="flex items-center gap-2">
            {actionMode !== "none" && (
              <span
                className="text-xs px-2 py-1 rounded animate-pulse"
                style={{
                  background: "rgba(255,215,0,0.2)",
                  border: "1px solid rgba(255,215,0,0.4)",
                  color: "#ffd700",
                  fontFamily: "Cinzel, serif",
                }}
              >
                {actionMode === "summon" && "SELECT ZONE TO SUMMON"}
                {actionMode === "attack" && "SELECT TARGET TO ATTACK"}
                {actionMode === "set_st" && "SELECT ZONE TO SET"}
              </span>
            )}
          </div>
        </div>

        {/* Player field */}
        <div className="shrink-0 px-4">
          {/* Player monster zones */}
          <div className="flex justify-center gap-2 mb-1">
            {player.monsterZones.map((fc, i) => (
              <MonsterZoneSlot
                key={`pl-m-${i}`}
                fieldCard={fc}
                zoneIndex={i}
                isPlayer
                highlighted={actionMode === "summon"}
                onClick={() => handlePlayerMonsterZoneClick(i)}
              />
            ))}
          </div>
          {/* Player spell/trap zones */}
          <div className="flex justify-center gap-2 mb-2">
            {player.spellTrapZones.map((fc, i) => (
              <SpellTrapZoneSlot
                key={`pl-st-${i}`}
                fieldCard={fc}
                zoneIndex={i}
                isPlayer
                highlighted={actionMode === "set_st"}
                onClick={() => handlePlayerSTZoneClick(i)}
              />
            ))}
          </div>
        </div>

        {/* Player LP and actions */}
        <div className="shrink-0 px-4 pb-2">
          <div
            className="p-2 rounded-xl"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,215,0,0.3)" }}
          >
            <LPBar
              current={player.lp}
              max={8000}
              name={userProfile?.username ?? "You"}
              isPlayer
            />
          </div>
        </div>

        {/* Player hand + action buttons */}
        <div className="flex-1 flex flex-col min-h-0 px-4 pb-3">
          <div className="flex gap-3 flex-1 min-h-0">
            {/* Hand */}
            <div className="flex-1 flex flex-col min-h-0">
              <p className="text-xs font-ui mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                HAND ({player.hand.length})
              </p>
              <div className="flex gap-2 flex-wrap overflow-y-auto">
                {player.hand.map((card, i) => (
                  <CardDisplay
                    key={String(card.id) + i}
                    card={card}
                    size="xs"
                    selected={selectedHandIdx === i}
                    onClick={() => handleHandCardClick(i)}
                  />
                ))}
                {player.hand.length === 0 && (
                  <p className="text-xs text-white/30">No cards in hand</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0 w-36">
              <button
                type="button"
                onClick={handlePhaseAdvance}
                disabled={!canAdvance}
                className="btn-game flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #1a5000, #2d8000)",
                  color: "#ffd700",
                  border: "1px solid rgba(0,255,0,0.3)",
                  fontFamily: "Cinzel, serif",
                  fontSize: "11px",
                }}
              >
                <ChevronRight className="w-4 h-4" />
                {duelState.phase === "DRAW" ? "DRAW" :
                 duelState.phase === "END" ? "END TURN" : "NEXT PHASE"}
              </button>

              {actionMode === "attack" && (
                <button
                  type="button"
                  onClick={handleDirectAttack}
                  className="btn-game flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: "linear-gradient(135deg, #3d0000, #8b0000)",
                    color: "#ffd700",
                    border: "1px solid rgba(220,20,60,0.4)",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  <Swords className="w-3 h-3" />
                  DIRECT ATTACK
                </button>
              )}

              {actionMode !== "none" && (
                <button
                  type="button"
                  onClick={() => { setActionMode("none"); setSelectedHandIdx(null); }}
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  CANCEL
                </button>
              )}

              {/* GY info */}
              <div className="text-center">
                <div
                  className="graveyard-zone rounded-lg p-2 text-xs"
                  style={{ fontFamily: "Orbitron, sans-serif", color: "rgba(220,20,60,0.8)" }}
                >
                  GY: {player.graveyard.length}
                </div>
              </div>

              {/* Log toggle */}
              <button
                type="button"
                onClick={() => setLogOpen(!logOpen)}
                className="px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "Cinzel, serif",
                }}
              >
                LOG {logOpen ? "▼" : "▲"}
              </button>
            </div>
          </div>

          {/* Action log */}
          {logOpen && (
            <div
              ref={logRef}
              className="mt-2 p-2 rounded-lg overflow-y-auto max-h-24 shrink-0"
              style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,215,0,0.15)" }}
            >
              {duelState.log.slice(-10).map((entry, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: log entries are positional
                <p key={i} className="text-xs" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Rajdhani, sans-serif" }}>
                  {entry}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
