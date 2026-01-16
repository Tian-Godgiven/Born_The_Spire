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

### 3. Trigger System Details

**Basic Structure:**
```typescript
entity.trigger.appendTrigger({
  when: "before" | "after",
  how: "make" | "via" | "take",
  key: "damage" | "heal" | "drawCard" | ...,  // See ActionEvent keys
  callback: (event, effect, triggerLevel) => { /* ... */ },
  level: 0  // Higher level = triggered first (optional, default 0)
})
```

**When/How/Key Explanation:**
- **when**: Timing relative to event execution
  - `before`: Before event effects are applied (can modify event)
  - `after`: After event effects are applied (for reactions)

- **how**: Entity's role in the event
  - `make`: Entity is the event source (造成事件)
  - `via`: Entity is the event medium (参与事件/事件媒介)
  - `take`: Entity is the event target (被事件作用)

- **key**: Event type identifier (matches ActionEvent keys)
  - Common keys: `damage`, `heal`, `drawCard`, `useCard`, `turnStart`, `turnEnd`

**Example:**
```typescript
// "When player takes healing, increase it by 2"
player.trigger.appendTrigger({
  when: "before",
  how: "take",
  key: "heal",
  callback: (event) => {
    // Modify healing amount before it's applied
    event.effects[0].params.value += 2
  }
})
```

**Default Triggers (默认触发器):**
- Triggers that entities have from creation
- Stored in `entity.trigger._defaultTrigger[]`
- Can be removed/replaced but are tracked for transparency
- Example: Cards have default `after_via_useCard` → discard to discard pile

**Important Triggers (关键触发器):**
- Triggers that may conflict with existing triggers
- Use `importantKey` to identify related triggers
- Use `onlyKey` for unique triggers (only one can exist)
- Stored in `entity.trigger._importantTrigger[]`

```typescript
entity.trigger.appendTrigger({
  when: "after",
  how: "via",
  key: "useCard",
  importantKey: "afterUseCard",  // Groups related triggers
  onlyKey: "afterUseCard_discard",  // Unique identifier (replaces existing)
  callback: (event) => { /* ... */ }
})
```

**Creating Triggers via TriggerMap (RECOMMENDED for data-driven approach):**

This is the preferred way to define triggers for cards, organs, and relics. Triggers are defined declaratively in the data, not imperatively with callbacks.

**Basic Structure:**
```typescript
// In card/organ/relic data definition
{
  interaction: {
    possess: {  // When entity is possessed (owned)
      triggers: [{
        when: "before" | "after",
        how: "make" | "via" | "take",
        key: string,  // Event key to listen for
        event: [{  // Array of events to spawn when triggered
          key: string,  // Event type to create
          targetType: "owner" | "eventTarget" | "self" | ...,
          effect: [{  // Array of effects in the spawned event
            key: string,  // Effect type
            params: { ... }  // Effect parameters
          }]
        }]
      }]
    }
  }
}
```

**Real Example - "回血石" Relic:**
```typescript
{
  label: "回血石",
  describe: ["战斗结束时", "回复", { key: ["status", "heal"] }, "生命"],
  key: "original_relic_00001",
  status: {
    "heal": 5
  },
  interaction: {
    possess: {
      target: { key: "self" },
      effects: [],
      triggers: [{
        when: "after",       // After the event happens
        how: "make",         // When the owner MAKES this event
        key: "battleEnd",    // Listen for battleEnd events
        event: [{           // When triggered, spawn these events:
          targetType: "owner",  // Target is the relic owner (player)
          key: "heal",          // Create a heal event
          effect: [{
            key: "heal",        // Apply heal effect
            params: { value: 5 } // Heal for 5 HP
          }]
        }]
      }]
    }
  }
}
```

**Explanation:**
- When the player (owner) finishes a battle (after make battleEnd)
- The relic creates a heal event targeting the player
- The heal event applies a heal effect for 5 HP

**Key Differences from Programmatic Triggers:**
1. **Declarative**: Define WHAT should happen, not HOW
2. **Data-Driven**: Stored in JSON-like structures, not code
3. **Event Spawning**: Instead of callbacks, you declare events to spawn
4. **No Direct Modification**: You don't write code to modify values directly

**targetType Options:**
- `"owner"`: The entity that owns this trigger source (e.g., player who has the relic)
- `"eventTarget"`: The target of the original event that triggered this
- `"eventSource"`: The source of the original event
- `"self"`: The entity itself (the card/organ/relic)
- `{ faction: "enemy" }`: All enemies
- `{ faction: "ally" }`: All allies

**Common Patterns:**

*Passive Buff on Possess:*
```typescript
possess: {
  triggers: [{
    when: "before",
    how: "take",
    key: "damage",
    event: [{
      targetType: "self",
      key: "modifyEvent",
      effect: [{
        key: "reduceDamage",
        params: { value: 2 }
      }]
    }]
  }]
}
// "When owner takes damage, reduce it by 2"
```

*Trigger on Turn Start:*
```typescript
possess: {
  triggers: [{
    when: "after",
    how: "make",
    key: "turnStart",
    event: [{
      targetType: "owner",
      key: "drawCard",
      effect: [{
        key: "drawCard",
        params: { value: 1 }
      }]
    }]
  }]
}
// "At turn start, draw 1 card"
```

**Important Notes:**
- Triggers in `possess` interaction are applied when the item is acquired
- Triggers are automatically removed when the item is lost (via modifier system)
- Multiple triggers can be defined in the same array
- Each trigger can spawn multiple events
- Events are processed through the same Transaction/EventStack system

**Trigger Removal:**
```typescript
// Method 1: Use returned remove function
const { remove } = entity.trigger.appendTrigger({...})
remove()  // Removes this specific trigger

// Method 2: Remove by importantKey (removes all matching)
const triggers = entity.trigger.getImportantTrigger("afterUseCard")
triggers.forEach(t => t.remove())

// Method 3: Swap only trigger (automatic removal + add)
// Used internally when adding trigger with same onlyKey
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

## UI Design Style

The game uses a minimalist, retro aesthetic with clean lines and simple borders:

- **Visual Style**: Black borders (2px solid), white backgrounds
- **NO Shadows**: Do not use `box-shadow`, `drop-shadow`, or any shadow effects
- **Popovers/Modals**: Use absolute positioning with clean borders only
- **Colors**: Minimal color palette, primarily black text on white backgrounds
- **Hover Effects**: Subtle background color changes (e.g., `rgba(0, 0, 0, 0.05)`)
- **Interactive Elements**: Clear visual feedback on hover/click without overdone animations

When creating new UI components, match this existing aesthetic for visual consistency.

**Example Reference**: See `ReserveDisplay.vue` for popover styling that fits the game's aesthetic.

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

## Development Workflow Preferences

**CRITICAL: Code Quality First**

- **代码的优雅和长期维护性永远是第一需求**
- 即使为了快速实现功能，也不能牺牲代码质量
- 优先选择可复用、可维护的方案，而不是快速但有技术债的方案
- 重构优于重复，抽象优于复制粘贴

**IMPORTANT: User-Guided Problem Solving**

The user prefers a specific workflow when working with Claude Code:

1. **One Problem at a Time**
   - Focus on solving ONE specific problem per iteration
   - Wait for user feedback before moving to the next problem
   - Don't try to solve multiple issues simultaneously

2. **User-Guided Direction**
   - Let the user guide which problems to tackle and in what order
   - User will identify issues and direct the investigation
   - Follow the user's lead on debugging approaches

3. **User Handles Testing**
   - DO NOT automatically start dev servers or run tests
   - User will test changes themselves and report results
   - Wait for user's test results before proceeding

4. **Iterative Feedback Loop**
   - Make changes based on user's specific requests
   - User tests → User reports issues → Claude fixes specific issue → Repeat
   - Don't assume the next step - wait for user guidance

**Example Workflow:**
```
User: "测试时发现X问题"
Claude: [Analyzes problem, proposes solution]
User: [Reviews solution, approves or redirects]
Claude: [Implements solution]
User: [Tests and reports: "还是有Y问题" or "可以，继续下一个"]
Claude: [Waits for next instruction]
```
