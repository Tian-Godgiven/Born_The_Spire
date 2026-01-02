# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Born The Spire (蘇生尖塔) is a Chinese-language fan game inspired by "Slay the Spire", built as a desktop application using Tauri 2 + Vue 3. The game features a unique system where players absorb and upgrade organs from defeated enemies to build powerful card combinations.

**Tech Stack:**
- Framework: Tauri 2 (Rust backend) + Vue 3 (frontend)
- Languages: TypeScript, HTML, SASS, Rust
- Platform: Windows desktop application

## Development Commands

All commands should be run from the `born_the_spire` directory:

```bash
cd born_the_spire

# Development
npm run dev          # Start Vite dev server for frontend
npm run tauri dev    # Start Tauri development mode (includes Rust backend)

# Build
npm run build        # Build frontend (runs vue-tsc type check + vite build)
npm run tauri build  # Build complete Tauri application

# Preview
npm run preview      # Preview production build locally
```

**Note:** The main working directory is `born_the_spire/`, not the repository root.

## Core Architecture

### Event-Driven Effect System

The game uses a sophisticated event-driven architecture centered around three core concepts:

1. **Transaction (事务) → Event Stack (事件栈) → Action Events (过程事件) → Effects (效果)**
   - Player actions trigger Transactions that collect and manage all cascading events
   - Events are stored in an EventStack with trigger levels determining execution order
   - Each ActionEvent can contain multiple Effects that modify game state
   - All state changes MUST go through this system - never modify Entity properties directly

2. **Effect System (效果系统)**
   - **EffectUnit**: JSON data definitions stored in game content
   - **Effect**: Runtime objects created from EffectUnits during events
   - **EffectFunc**: Functions that apply actual changes to entities
   - Flow: `EffectUnit --[generates]--> Effect --[calls]--> EffectFunc`

3. **Trigger System (触发器)**
   - Triggers are bound to Entities and respond to events
   - Structure: `when (before/after) × how (make/via/take) × key (event type)`
   - Example: `Player.[before take heal => increase healing by 2]`
   - Triggers create new events, which cascade through the transaction

4. **Modifier System (修饰器)**
   - **StatusModifier**: Manages attribute changes (health, energy, etc.) with base/current layers
   - **ContentModifier**: Manages item/organ possession
   - Modifiers automatically handle "add/remove" logic - when an organ is lost, its effects are automatically removed and attributes recalculated

### Key System Objects

**Location: `src/core/objects/system/`**

- **Entity** (`Entity.ts`): Base class for all game objects
  - Has `status` (attributes), `current` (dynamic values), `trigger` (event handlers)
  - Subclasses: Target (Player, Enemy, Organ) and Item (Card, Potion, Relic)

- **ActionEvent** (`ActionEvent.ts`): Represents a game event
  - Contains `source`, `medium`, `target`, `effects[]`, `phase[]`
  - Handles event triggering, announcement, and execution

- **Transaction** (`game/transaction.ts`): Manages event execution
  - Single active transaction at a time
  - States: created → gathering → organizing → doing
  - Uses TransactionQueue for sequential processing

- **Status** (`status/Status.ts`): Entity attributes with modifier-based calculation
  - Two layers: `base` (permanent) and `current` (temporary)
  - Modifier types: additive, multiplicative, final
  - Apply modes: absolute, snapshot

- **Current** (`Current/current.ts`): Frequently-changing values (current HP, energy)
  - Not managed by modifiers due to high mutation frequency
  - Examples: current health, current energy, cards in hand

- **Trigger** (`trigger/Trigger.ts`): Event response mechanism
  - Categories: Default triggers, Important triggers, Only triggers
  - Stored in nested structure: `when → how → key → TriggerItem[]`

### File Structure

```
born_the_spire/src/
├── core/                    # Core game logic
│   ├── effects/            # Effect functions (damage, heal, draw, etc.)
│   ├── hooks/              # Global utilities and Vue hooks
│   ├── objects/
│   │   ├── game/          # Game flow (battle, run, transaction, eventStack)
│   │   ├── item/          # Items (Card, Potion, Relic)
│   │   ├── system/        # Core system classes (Entity, ActionEvent, Effect, Trigger, Modifier, Status, Current)
│   │   ├── target/        # Targets (Player, Enemy, Organ)
│   │   └── room/          # Room types
│   └── types/             # TypeScript type definitions
├── components/            # Vue components
│   ├── interaction/       # User interaction components
│   ├── global/           # Global reusable components
│   └── object/           # Object-specific components
├── pages/                # Vue pages
│   └── scene/            # Game scenes
├── router/               # Vue Router configuration
├── static/               # Static assets and registries
│   └── registry/         # Game content registries (cards, organs, etc.)
└── ui/                   # UI utilities and hooks
```

## Critical Development Rules

### 1. Never Bypass the Effect System
**WRONG:**
```typescript
player.current.health.value -= 10  // Direct modification - DON'T DO THIS
```

**RIGHT:**
```typescript
// Create an event with effects
doEvent({
  key: "damage",
  source: enemy,
  medium: card,
  target: player,
  effectUnits: [{ key: "damage", value: 10 }]
})
```

### 2. Modifier Removal is Automatic
When implementing "gain X when acquiring Y" effects:
```typescript
// You only need to define what happens when gained
// When lost, modifiers are automatically removed and recalculated
organ.onAcquire = () => {
  addStatusModifier(player, "maxHealth", { value: 10, source: organ })
}
// DON'T create organ.onLose - the system handles cleanup
```

### 3. Trigger Structure Must Be Correct
```typescript
entity.appendTrigger({
  when: "before" | "after",
  how: "make" | "via" | "take",
  key: "damage" | "heal" | "drawCard" | ...,  // See ActionEvent keys
  callback: (event, effect) => { /* ... */ },
  level: 0  // Higher level = triggered first
})
```

### 4. Event Cascading
- Events trigger other events, which get collected in the same Transaction
- Use `event.spawnEvent(newEvent)` to properly link cascading events
- TriggerLevel determines execution order (higher = executes first)

### 5. Chinese Documentation
Most documentation is in Chinese (in `文档/` directory). Key terms:
- 事务 (Transaction), 事件 (Event), 效果 (Effect), 触发器 (Trigger)
- 修饰器 (Modifier), 属性 (Status/Attribute), 当前值 (Current Value)
- 实体 (Entity), 目标 (Target), 媒介 (Medium), 来源 (Source)
- 器官 (Organ), 卡牌 (Card), 遗物 (Relic), 药水 (Potion)

## Common Patterns

### Creating a New Card Effect
1. Define EffectUnit in card data (in `static/registry/`)
2. If effect doesn't exist, add EffectFunc to `core/effects/`
3. Register effect in effect map
4. Effect will automatically integrate with trigger system

### Adding an Organ
Organs provide:
- Passive status modifiers (via StatusModifier)
- Cards to the deck (via ContentModifier)
- Active abilities (via triggers)

When player loses/sells an organ, all associated modifiers are auto-removed.

### Implementing Relics
Relics typically add triggers to the player that respond to game events.
Use `player.appendTrigger()` with appropriate when/how/key combinations.

## Type Safety

- Run `npm run build` to check TypeScript errors
- The project uses strict TypeScript with Vue 3 Composition API
- Pay attention to Entity type parameters: `ActionEvent<s extends Entity, m extends Entity, t extends Entity>`

## Vue Reactivity

- Entity objects use Vue's `reactive()` for UI updates
- Status and Current values are reactive
- Changes through the effect system automatically trigger UI updates

## Testing Workflow

Currently no automated tests. Manual testing workflow:
1. Start dev server: `npm run tauri dev`
2. Test in-game by triggering relevant mechanics
3. Check browser console for errors/logs
4. Use `newLog()` and `newError()` for debugging (from `@/ui/hooks/global/`)

## Mod Support (Planned)

The game is designed to support modding through:
- Open interfaces for all game objects (cards, organs, relics, enemies)
- Effect mapping system for custom effects
- Registry system for adding content
- Refer to `文档/` for detailed Chinese documentation on modding
