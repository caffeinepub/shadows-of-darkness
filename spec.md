# Shadows of Darkness

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full Yu-Gi-Oh Master Duel-style card game called "Shadows of Darkness"
- Standard Yu-Gi-Oh ruleset: Normal/Effect/Fusion/Synchro/XYZ/Link monsters, Spell/Trap cards, 8000 LP, Draw/Standby/Main1/Battle/Main2/End phases
- Card collection system with pack pulling mechanic
- 200+ holographic rarity styles (animated border/frame/foil effects per card)
- Procedurally generated manga/anime-style card art (SVG/canvas-based generative art with unique color palettes, character silhouettes, and backgrounds per card)
- Dynamic duel field: animated battlefield with parallax layers, dark fantasy theme
- Single-player mode vs AI opponent (rule-based AI)
- PvP online system (turn-based async duels stored on-chain)
- XP and progression system: earn XP from duels/wins, unlock packs at level milestones
- Pack earning: earn packs from XP levels and duel wins
- Profile system: uploadable profile picture, animated moving wallpaper background
- Custom card creator: enter card name, upload art image, assign rarity, set card stats/type/effect text
- Sound system: upload or assign custom sounds to card actions (summon, attack, spell activation, victory, defeat)
- Deck builder: build decks from owned cards (40-60 card limit, 3 copies per card max)

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
1. User profile management: principal-based accounts, XP, level, pack count, win/loss record
2. Card collection: store owned cards per user, card data (name, type, ATK/DEF, rarity, effect, art seed)
3. Pack system: pack types, open pack (generates 8 cards with rarity weights), award packs on XP milestones
4. Deck management: save/load decks, validate deck rules
5. Duel state machine: create duel, join duel, submit turn actions, resolve game state, award XP/packs on completion
6. Custom card storage: save custom card metadata (name, stats, effect text, uploaded art reference)
7. Sound asset metadata: store references to uploaded sound assignments per card action
8. Leaderboard: top players by wins/XP

### Frontend (React + TypeScript + Tailwind)
1. Landing/home screen with animated dark fantasy background and game logo
2. Navigation: Home, Duel, Collection, Deck Builder, Card Creator, Profile, Shop/Packs, Leaderboard
3. Card component: renders card frame by type (Monster/Spell/Trap/Fusion/Synchro/XYZ/Link), holographic rarity animation overlay, procedurally generated art canvas
4. Collection view: grid of owned cards with filter/sort, card detail modal with full holo effect
5. Pack opening screen: animated pack reveal with rarity flash effects
6. Deck builder: drag-and-drop or click-to-add interface, deck validation
7. Duel field: full-screen animated battlefield, card zones (Monster, Spell/Trap, Field, Graveyard, Extra Deck, Hand), LP counters, phase indicator, action log
8. Duel engine (frontend logic): full Yu-Gi-Oh turn/phase logic, AI opponent decision tree, PvP turn submission
9. Custom card creator: form with name/stats/type/effect, image upload, rarity picker, sound assignment
10. Profile page: upload profile pic, set animated wallpaper (pick from presets or upload), view stats
11. Sound manager: assign uploaded audio to card actions, preview sounds
12. Leaderboard screen
13. XP/Level progress bar in header

## UX Notes
- Dark fantasy color scheme: deep purples, blacks, gold accents, crimson highlights
- Cards have animated holographic shimmer effects using CSS animations + canvas
- Duel field has moving particle effects and parallax animated background layers
- Pack opening has satisfying reveal animation with rarity-dependent light burst effects
- Profile wallpapers animate with subtle parallax/scroll or CSS keyframe motion
- Mobile-responsive layout where possible, but desktop-first for duel view
- Sound effects play on card interactions (can be muted)
- 200+ rarity styles defined as named CSS animation variants (Common, Rare, Super Rare, Ultra Rare, Secret Rare, Prismatic, Starlight, Ghost Rare, Holographic, Rainbow, etc. up to 200+ variants with unique shimmer patterns)
