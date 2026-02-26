// Yu-Gi-Oh game engine — state, rules, and AI

import { Card, CardType } from "../backend.d";

export type DuelPhase = "DRAW" | "STANDBY" | "MAIN1" | "BATTLE" | "MAIN2" | "END";
export type CardPosition = "ATK" | "DEF" | "SET" | "FACEDOWN";
export type ZoneType = "monster" | "spell_trap" | "field" | "graveyard" | "hand" | "extra" | "deck";

export interface FieldCard {
  card: Card;
  position: CardPosition;
  zoneIndex: number;
  justSummoned?: boolean;
  attackedThisTurn?: boolean;
}

export interface PlayerState {
  lp: number;
  hand: Card[];
  monsterZones: (FieldCard | null)[];   // 5 zones
  spellTrapZones: (FieldCard | null)[];  // 5 zones
  graveyard: Card[];
  extraDeck: Card[];
  deck: Card[];
  fieldSpell: FieldCard | null;
  hasNormalSummoned: boolean;
}

export interface DuelState {
  turn: number;
  phase: DuelPhase;
  activePlayer: 0 | 1;  // 0 = player, 1 = opponent/AI
  players: [PlayerState, PlayerState];
  log: string[];
  isOver: boolean;
  winner: 0 | 1 | null;
  selectedCard: { player: 0 | 1; zone: ZoneType; index: number } | null;
  attackingCard: { zoneIndex: number } | null;
  lastAction: string;
}

export function createInitialPlayerState(deck: Card[]): PlayerState {
  const shuffled = [...deck].sort(() => Math.random() - 0.5);
  const hand = shuffled.splice(0, 5);
  return {
    lp: 8000,
    hand,
    monsterZones: [null, null, null, null, null],
    spellTrapZones: [null, null, null, null, null],
    graveyard: [],
    extraDeck: [],
    deck: shuffled,
    fieldSpell: null,
    hasNormalSummoned: false,
  };
}

export function createDuelState(playerDeck: Card[], opponentDeck: Card[]): DuelState {
  return {
    turn: 1,
    phase: "DRAW",
    activePlayer: 0,
    players: [
      createInitialPlayerState(playerDeck),
      createInitialPlayerState(opponentDeck),
    ],
    log: ["Duel Start! Player goes first."],
    isOver: false,
    winner: null,
    selectedCard: null,
    attackingCard: null,
    lastAction: "",
  };
}

function getMonsterLevel(card: Card): number {
  return Number(card.level_rank ?? 0);
}

function isMonster(card: Card): boolean {
  return card.card_type.__kind__ === "monster";
}

function isSpellOrTrap(card: Card): boolean {
  return card.card_type.__kind__ === "spell" || card.card_type.__kind__ === "trap";
}

function canNormalSummon(card: Card): boolean {
  return isMonster(card) && getMonsterLevel(card) <= 4;
}

function canTributeSummon(card: Card, tributes: number): boolean {
  const level = getMonsterLevel(card);
  if (level <= 4) return false;
  if (level <= 6) return tributes >= 1;
  return tributes >= 2;
}

function getMonsterATK(card: Card): number {
  return Number(card.atk ?? 0);
}

function getMonsterDEF(card: Card): number {
  return Number(card.def ?? 0);
}

export function applyAction(state: DuelState, action: string, payload?: unknown): DuelState {
  const s = JSON.parse(JSON.stringify(state)) as DuelState;
  const active = s.activePlayer;
  const player = s.players[active];

  switch (action) {
    case "DRAW": {
      if (player.deck.length === 0) {
        s.isOver = true;
        s.winner = active === 0 ? 1 : 0;
        s.log.push("Deck out! Game over.");
        break;
      }
      const drawn = player.deck.shift()!;
      player.hand.push(drawn);
      s.log.push(`${active === 0 ? "You" : "Opponent"} drew a card.`);
      s.phase = "STANDBY";
      break;
    }

    case "ADVANCE_PHASE": {
      const phases: DuelPhase[] = ["DRAW", "STANDBY", "MAIN1", "BATTLE", "MAIN2", "END"];
      const idx = phases.indexOf(s.phase);
      if (idx < phases.length - 1) {
        s.phase = phases[idx + 1];
      } else {
        // End turn
        s.phase = "DRAW";
        s.activePlayer = active === 0 ? 1 : 0;
        s.turn++;
        s.players[s.activePlayer].hasNormalSummoned = false;
        s.log.push(`Turn ${s.turn} begins.`);
      }
      break;
    }

    case "NORMAL_SUMMON": {
      const p = payload as { handIndex: number; zoneIndex: number };
      if (player.hasNormalSummoned) break;
      const card = player.hand[p.handIndex];
      if (!card || !canNormalSummon(card)) break;
      const emptyZone = p.zoneIndex >= 0 ? p.zoneIndex : player.monsterZones.findIndex(z => z === null);
      if (emptyZone < 0 || player.monsterZones[emptyZone] !== null) break;
      player.hand.splice(p.handIndex, 1);
      player.monsterZones[emptyZone] = { card, position: "ATK", zoneIndex: emptyZone, justSummoned: true };
      player.hasNormalSummoned = true;
      s.log.push(`${active === 0 ? "You" : "Opponent"} summoned ${card.name}!`);
      break;
    }

    case "SET_MONSTER": {
      const p = payload as { handIndex: number; zoneIndex: number };
      if (player.hasNormalSummoned) break;
      const card = player.hand[p.handIndex];
      if (!card || !isMonster(card) || getMonsterLevel(card) > 4) break;
      const emptyZone = p.zoneIndex >= 0 ? p.zoneIndex : player.monsterZones.findIndex(z => z === null);
      if (emptyZone < 0) break;
      player.hand.splice(p.handIndex, 1);
      player.monsterZones[emptyZone] = { card, position: "SET", zoneIndex: emptyZone };
      player.hasNormalSummoned = true;
      s.log.push(`${active === 0 ? "You" : "Opponent"} set a monster.`);
      break;
    }

    case "SET_SPELL_TRAP": {
      const p = payload as { handIndex: number; zoneIndex: number };
      const card = player.hand[p.handIndex];
      if (!card || !isSpellOrTrap(card)) break;
      const emptyZone = p.zoneIndex >= 0 ? p.zoneIndex : player.spellTrapZones.findIndex(z => z === null);
      if (emptyZone < 0) break;
      player.hand.splice(p.handIndex, 1);
      player.spellTrapZones[emptyZone] = { card, position: "SET", zoneIndex: emptyZone };
      s.log.push(`${active === 0 ? "You" : "Opponent"} set a spell/trap.`);
      break;
    }

    case "ACTIVATE_SPELL": {
      const p = payload as { handIndex: number };
      const card = player.hand[p.handIndex];
      if (!card || card.card_type.__kind__ !== "spell") break;
      player.hand.splice(p.handIndex, 1);
      player.graveyard.push(card);
      s.log.push(`${active === 0 ? "You" : "Opponent"} activated ${card.name}!`);
      break;
    }

    case "ATTACK": {
      const p = payload as { attackerZone: number; targetZone: number | "direct" };
      const opponent = s.players[active === 0 ? 1 : 0];
      const attacker = player.monsterZones[p.attackerZone];
      if (!attacker || attacker.position !== "ATK" || attacker.attackedThisTurn || attacker.justSummoned) break;

      if (p.targetZone === "direct") {
        // Direct attack
        const damage = getMonsterATK(attacker.card);
        opponent.lp = Math.max(0, opponent.lp - damage);
        attacker.attackedThisTurn = true;
        s.log.push(`${attacker.card.name} attacks directly for ${damage} damage!`);
      } else {
        const target = opponent.monsterZones[p.targetZone];
        if (!target) break;
        const atkA = getMonsterATK(attacker.card);

        if (target.position === "ATK") {
          const atkB = getMonsterATK(target.card);
          if (atkA > atkB) {
            const diff = atkA - atkB;
            opponent.lp = Math.max(0, opponent.lp - diff);
            opponent.monsterZones[p.targetZone] = null;
            opponent.graveyard.push(target.card);
            s.log.push(`${attacker.card.name} destroyed ${target.card.name}! ${diff} LP damage!`);
          } else if (atkA < atkB) {
            const diff = atkB - atkA;
            player.lp = Math.max(0, player.lp - diff);
            player.monsterZones[p.attackerZone] = null;
            player.graveyard.push(attacker.card);
            s.log.push(`${target.card.name} destroyed ${attacker.card.name}! ${diff} LP damage!`);
          } else {
            player.monsterZones[p.attackerZone] = null;
            opponent.monsterZones[p.targetZone] = null;
            player.graveyard.push(attacker.card);
            opponent.graveyard.push(target.card);
            s.log.push("Both monsters destroyed!");
          }
        } else if (target.position === "SET" || target.position === "DEF") {
          const def = getMonsterDEF(target.card);
          if (atkA > def) {
            opponent.monsterZones[p.targetZone] = null;
            opponent.graveyard.push(target.card);
            s.log.push(`${attacker.card.name} destroyed the defense monster!`);
          } else if (atkA < def) {
            const diff = def - atkA;
            player.lp = Math.max(0, player.lp - diff);
            s.log.push(`Attack failed! You take ${diff} damage.`);
          } else {
            s.log.push("Monster survives in defense!");
          }
          if (target.position === "SET") {
            // Flip effect would go here
          }
        }
        attacker.attackedThisTurn = true;
      }

      // Check win conditions
      if (player.lp <= 0) {
        s.isOver = true;
        s.winner = active === 0 ? 1 : 0;
        s.log.push(`${active === 0 ? "You" : "Opponent"} lost! LP reached 0.`);
      }
      if (opponent.lp <= 0) {
        s.isOver = true;
        s.winner = active;
        s.log.push(`${active === 0 ? "Opponent" : "You"} lost! LP reached 0.`);
      }
      break;
    }

    case "CHANGE_POSITION": {
      const p = payload as { zoneIndex: number };
      const fCard = player.monsterZones[p.zoneIndex];
      if (!fCard || fCard.justSummoned) break;
      fCard.position = fCard.position === "ATK" ? "DEF" : "ATK";
      s.log.push(`${fCard.card.name} changed to ${fCard.position} position.`);
      break;
    }

    case "END_TURN": {
      s.phase = "DRAW";
      s.activePlayer = active === 0 ? 1 : 0;
      s.turn++;
      // Clear justSummoned flags
      s.players.forEach(p2 => {
        p2.monsterZones.forEach(z => { if (z) { z.justSummoned = false; z.attackedThisTurn = false; } });
        p2.hasNormalSummoned = false;
      });
      s.log.push(`Turn ${s.turn} — ${s.activePlayer === 0 ? "Your" : "Opponent's"} turn.`);
      break;
    }
  }

  return s;
}

// Simple AI for opponent
export function runAITurn(state: DuelState): DuelState {
  let s = { ...state };
  const ai = s.players[1];

  // DRAW
  s = applyAction(s, "DRAW");
  s = applyAction(s, "ADVANCE_PHASE"); // to STANDBY
  s = applyAction(s, "ADVANCE_PHASE"); // to MAIN1

  // Try to summon a monster
  if (!ai.hasNormalSummoned) {
    const handIdx = ai.hand.findIndex(c => canNormalSummon(c));
    if (handIdx >= 0) {
      const emptyZone = ai.monsterZones.findIndex(z => z === null);
      if (emptyZone >= 0) {
        s = applyAction(s, "NORMAL_SUMMON", { handIndex: handIdx, zoneIndex: emptyZone });
      }
    }
  }

  // Set spell/trap if any
  const stIdx = ai.hand.findIndex(c => isSpellOrTrap(c));
  if (stIdx >= 0) {
    const emptySTZone = ai.spellTrapZones.findIndex(z => z === null);
    if (emptySTZone >= 0) {
      s = applyAction(s, "SET_SPELL_TRAP", { handIndex: stIdx, zoneIndex: emptySTZone });
    }
  }

  // BATTLE PHASE
  s = applyAction(s, "ADVANCE_PHASE"); // to BATTLE

  const player = s.players[0];
  s.players[1].monsterZones.forEach((fieldCard, i) => {
    if (!fieldCard || fieldCard.position !== "ATK" || fieldCard.attackedThisTurn || s.isOver) return;
    
    // Find weakest target or direct attack
    const targets = player.monsterZones
      .map((tc, ti) => ({ tc, ti }))
      .filter(({ tc }) => tc !== null);

    if (targets.length === 0) {
      s = applyAction(s, "ATTACK", { attackerZone: i, targetZone: "direct" });
    } else {
      // Attack the monster with lowest ATK
      const weakest = targets.reduce((a, b) =>
        getMonsterATK(a.tc!.card) <= getMonsterATK(b.tc!.card) ? a : b
      );
      s = applyAction(s, "ATTACK", { attackerZone: i, targetZone: weakest.ti });
    }
  });

  if (!s.isOver) {
    s = applyAction(s, "END_TURN");
  }

  return s;
}

export function generateAIDeck(allCards: Card[]): Card[] {
  // Pick monsters and spells/traps randomly
  const monsters = allCards.filter(c => c.card_type.__kind__ === "monster" && getMonsterLevel(c) <= 4);
  const spellsTraps = allCards.filter(c => c.card_type.__kind__ !== "monster");
  
  const deck: Card[] = [];
  const pickRandom = (arr: Card[], count: number) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  };

  deck.push(...pickRandom(monsters, 25));
  deck.push(...pickRandom(spellsTraps, 15));
  
  // Pad to 40 if needed
  while (deck.length < 40 && allCards.length > 0) {
    deck.push(allCards[Math.floor(Math.random() * allCards.length)]);
  }
  
  return deck.slice(0, 40).sort(() => Math.random() - 0.5);
}
