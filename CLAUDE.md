# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

每当回复时，都要以“完毕”为回答的结尾，以确认你还记得claude.md中的内容

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

5. **Lazy Loading System (懒加载系统)**
   - **Purpose**: Avoid circular dependencies between core system classes and data configuration files
   - **Location**: `src/core/utils/lazyLoader.ts`
   - **How it works**:
     - Core system classes (Entity, ActionEvent, EffectUnit) are loaded during module initialization
     - Data configuration files (effectMap, organList, cardList, etc.) are loaded at runtime via `preloadAllLazyModules()`
     - Uses ES6 dynamic `import()` instead of `require()` for ES module compatibility
   - **Usage**:
     ```typescript
     import { getLazyModule } from "@/core/utils/lazyLoader"
     const effectMap = getLazyModule('effectMap')
     ```
   - **CRITICAL: Never use `require()` in this codebase**
     - This is a Vite + ES modules project - `require()` is NOT available
     - Always use ES6 `import` statements or dynamic `import()` for runtime imports
     - For circular dependency issues, use dynamic `import()`:
       ```typescript
       // WRONG - will cause "require is not defined" error
       const { nowPlayer } = require("../game/run")

       // RIGHT - use dynamic import
       const { nowPlayer } = await import("../game/run")
       ```
   - **Registered modules**: effectMap, organList, cardList, relicList, potionList, enemyList, eventList
   - All data modules are preloaded in `main.ts` before the app starts

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

### Room System

**Room Types:**
- `battle`: Combat encounters with enemies
- `event`: Story events with choices
- `pool`: Rest area (absorb materials, upgrade organs, blood mark)
- `blackStore`: Shop for buying items
- `roomSelect`: Choose next room to enter

**Room Lifecycle:**
1. `enter()`: Initialize room, display UI
2. `process()`: Handle room logic (may be UI-driven)
3. `complete()`: Finish room, trigger rewards/cleanup
4. `exit()`: Clean up resources

**Room Completion Flow:**
```typescript
// In UI component (e.g., PoolRoom.vue)
async function leaveRoom() {
  // Complete current room
  await nowGameRun.completeCurrentRoom()

  // Create and enter room selection
  const roomSelectRoom = new RoomSelectRoom({
    type: "roomSelect",
    layer: currentRoom.layer + 1,
    targetLayer: currentRoom.layer + 1,
    roomCount: 3
  })

  await nowGameRun.enterRoom(roomSelectRoom)
}
```

**Pool Room Features:**
- **Absorb**: Gain materials (amount scales with layer)
- **Upgrade**: Spend materials to upgrade organs (repeatable)
- **Blood Mark**: One-time global choice that reduces max HP but grants power
  - Tracked via `ifBloodMark` status (0 = not marked, 1 = marked)
  - UI shows "已染血" indicator in top bar after marking
  - Blood mark option removed from future pool rooms
  - Option dynamically removed from current room after selection

## Type Safety

- Run `npm run build` to check TypeScript errors
- The project uses strict TypeScript with Vue 3 Composition API
- Pay attention to Entity type parameters: `ActionEvent<s extends Entity, m extends Entity, t extends Entity>`

## Vue Reactivity

- Entity objects use Vue's `reactive()` for UI updates
- Status and Current values are reactive
- Changes through the effect system automatically trigger UI updates

### CRITICAL: Protecting Internal Structures with markRaw

**Problem:** When Entity objects are wrapped with `reactive()`, Vue's reactivity system will recursively convert all nested objects, including Status objects. This breaks Status objects because their internal `_baseValue` and `_value` ref objects get "unwrapped" into plain numbers.

**Solution:** Always use `markRaw()` when storing Status objects in Entity:

```typescript
// CORRECT - In appendStatus function
entity.status[key] = markRaw(status)

// CORRECT - In ensureStatusExists function
entity.status[statusKey] = markRaw(status)
```

**Why this matters:**
- Status objects contain private `ref()` fields: `_baseValue = ref(0)` and `_value = ref(0)`
- When Status is made reactive, Vue unwraps these refs, turning them into plain numbers
- This causes errors like "Cannot create property 'value' on number '50'"
- `markRaw()` tells Vue to skip reactivity conversion for that object

**Where to use markRaw:**
- ✅ Status objects when adding to `entity.status`
- ✅ Any object with internal ref/reactive structures that shouldn't be converted
- ❌ Don't use on Entity itself (Entity needs to be reactive for UI updates)
- ❌ Don't use on simple data objects that should be reactive

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

## Documentation Guidelines

**Target Audience:**
- Future self
- Open-source mod developers
- Anyone who needs to use the open interfaces, registries, and data formats

**Documentation Principles:**

1. **Extreme Simplicity in Format**
   - Use headings to separate sections
   - Use code blocks to wrap example code
   - **IMPORTANT**: Use simple indentation instead of markdown list symbols (no `-`, `*`, or `1.` for lists)
   - Format lists with plain text and 2-space indentation
   - Avoid complex markdown (no bold, italic, quotes, tables)
   - Keep it minimal and scannable

2. **Clear Structure**
   - Level 1 heading: Main topic (e.g., "触发器 Trigger")
   - Level 2 heading: Subtopics (e.g., "获取", "起效", "结构")
   - Level 3 heading: Detailed parts (e.g., "触发组", "触发器对象")
   - Code blocks directly show structure and examples

3. **Content Organization**
   - Start with brief concept definition
   - Organize by function/purpose
   - Include code examples in each section
   - List important API functions with signatures and usage
   - Put practical usage examples at the end

4. **Writing Style**
   - Concise and direct, no verbosity
   - Primarily Chinese
   - Keep technical terms in English
   - Short code comments

5. **Developer-Focused**
   - List all open interfaces
   - Show data formats
   - Provide complete usage examples
   - Explain important considerations

6. **TODO Handling**
   - **IMPORTANT**: Do NOT add "⚠️ TODO" markers in documentation files
   - All TODOs should be recorded in the task list (`文档/任务列表.md`)
   - Documentation should describe what exists, not what's missing
   - If something is incomplete, mention it briefly without marking as TODO

**Documentation Structure Template:**

```markdown
# 主题名称

简短的概念定义（1-2句话）

## 基本信息

对象的定义和用途

### 子分类1

配置说明
  参数1：说明
  参数2：说明
实现：代码引用和实现细节

### 子分类2

配置说明
  参数1：说明
  参数2：说明
实现：代码引用和实现细节

## 生命周期/工作流程

阶段1 (enter)
  职责说明
  具体步骤

阶段2 (process)
  职责说明
  具体步骤

## 可配置项

接口定义（用代码块展示）

```typescript
interface ConfigType {
    param1: type
    param2: type
}
```

配置说明：
  param1：说明
  param2：说明

## 相关文件

逻辑：文件路径
UI：文件路径
配置：文件路径

## 注意事项

注意点1：说明
  细节1
  细节2

注意点2：说明 ⚠️ TODO

## 注册方式

### 类型注册

代码示例

### 配置注册

代码示例

### 添加新内容

代码示例
```

**Example Reference:**
See existing documentation in `文档/` directory, particularly:
- `文档/对象/系统/触发器Trigger.md`
- `文档/对象/系统/属性Status.md`
- `文档/对象/系统/修饰器Modifier.md`
- `文档/对象/物品/卡牌.md`

## API Design Philosophy

**High-Level Hooks for Common Operations**

The project provides high-level hooks (in `src/core/hooks/`) that wrap common operations for easier use by both internal developers and mod creators.

**Design Principles:**

1. **Two-Layer API Structure**
   - **High-Level Hooks**: Simple, common-case functions for quick usage
   - **Low-Level APIs**: Detailed control for advanced scenarios

2. **Documentation Organization**
   - Show high-level hooks first (recommended approach)
   - Show low-level APIs second (advanced usage)
   - Example: Room switching uses `completeAndGoNext()` before showing `GameRun.enterRoom()`

3. **Internal Consistency**
   - We use the same hooks internally that we expose to mod developers
   - This ensures the APIs are well-tested and practical
   - Keeps codebase consistent and maintainable

4. **Hook Categories** (current and planned)
   - **step.ts**: Room navigation and transitions
     - `goToNextStep()` - Go to next floor room selection
     - `completeAndGoNext()` - Complete room and go to next step
     - `goToRoomType(type, config)` - Directly enter a room type
     - `completeAndGoToRoomType(type, config)` - Complete and enter room

   - **variance.ts**: Random number utilities
     - `applyVariance(value, config)` - Apply random variance to values
     - `randomInt(min, max)` - Random integer
     - `randomChance(probability)` - Probability check

   - **chara.ts**: Character operations
     - `kill(event, target, info)` - Kill a character/organ

   - **Future hooks to consider**:
     - Battle operations (start battle, end turn, etc.)
     - Item operations (gain card, gain relic, etc.)
     - Status operations (add status, remove status, etc.)
     - Effect operations (deal damage, heal, draw cards, etc.)

5. **Benefits**
   - **Easier onboarding**: New developers can use simple functions
   - **Less boilerplate**: Common patterns are pre-packaged
   - **Centralized logic**: Changes only need to happen in one place
   - **Better documentation**: Clear recommended patterns

**Example: Room Switching**

```typescript
// Recommended: High-level hook
import { completeAndGoNext } from "@/core/hooks/step"
await completeAndGoNext()

// Advanced: Low-level API
await nowGameRun.completeCurrentRoom()
const roomSelectRoom = new RoomSelectRoom({ ... })
await nowGameRun.enterRoom(roomSelectRoom)
```

When creating new systems, consider:
- What are the common operations users will need?
- Can we provide a simple hook for the 80% use case?
- Is the low-level API still accessible for the 20% edge cases?

## In-Game Developer Console

**IMPORTANT:** When the user mentions "控制台" (console), they are referring to the **in-game developer console**, NOT the browser's developer console.

### Overview

The game has a built-in developer console for testing and debugging during development. It provides a command-line interface within the game for executing commands.

**Location:**
- UI Component: `src/ui/page/tool/console/DevConsole.vue`
- Command Registry: `src/core/utils/consoleCommandRegistry.ts`

**Opening the Console:**
- Press the designated hotkey in-game (implementation-specific)
- Or call `window.openConsole()` from browser console

### Console Architecture

**Two Systems:**

1. **Simple Command System (Current)**
   - Commands are defined directly in `DevConsole.vue`
   - Uses function call syntax: `commandName(arg1, arg2)`
   - Examples: `enterRoom("battle_normal_slime", 1)`, `gameOver()`

2. **Registry System (Available but not yet used)**
   - `consoleCommandRegistry` in `src/core/utils/consoleCommandRegistry.ts`
   - Allows mods to register custom commands
   - More structured with metadata (name, description, usage, examples)

### Adding New Console Commands

**Method 1: Direct Implementation (Current Approach)**

Add to `DevConsole.vue`:

```typescript
// 1. Add the function implementation
async function myNewCommand(arg1: string, arg2?: number) {
    addOutput(`Executing command with ${arg1}, ${arg2}`, 'info')
    // ... command logic
    addOutput('✓ Command completed', 'result')
}

// 2. Add to executeFunction switch
async function executeFunction(funcName: string, args: any[]) {
    switch (funcName) {
        // ... existing cases
        case 'myNewCommand':
            await myNewCommand(args[0], args[1])
            break
        // ...
    }
}

// 3. Add to help text
function showHelp() {
    // ... existing help
    addOutput('myNewCommand("arg1", arg2?) - Description of command', 'info')
    addOutput('  例如: myNewCommand("test", 123)', 'info')
}
```

**Method 2: Using Registry System (Future)**

```typescript
import { registerConsoleCommand } from '@/core/utils/consoleCommandRegistry'

registerConsoleCommand({
    name: 'myCommand',
    description: 'Does something useful',
    usage: 'myCommand(arg1, arg2?)',
    examples: ['myCommand("test", 123)'],
    execute: async (args, addOutput) => {
        addOutput(`Executing with ${args[0]}`, 'info')
        // ... command logic
        addOutput('✓ Done', 'result')
    }
})
```

### Available Console Commands

Current commands in the game console:

```
listRooms() - 列出所有房间
listRooms("类型") - 列出指定类型的房间
  例如: listRooms("battle")

enterRoom("房间key") - 进入指定房间
enterRoom("房间key", 层级) - 进入指定房间并设置层级
  例如: enterRoom("battle_normal_slime", 1)

gameOver() - 触发游戏失败
  例如: gameOver()

clear - 清空控制台
help - 显示帮助信息
```

### Console vs Browser Console

**In-Game Console:**
- User-facing debugging tool
- Simplified command syntax
- Integrated with game UI
- Safe for players to use
- Commands added here should be useful for testing/debugging

**Browser Console:**
- Developer-only tool
- Full JavaScript access
- Can break the game if misused
- Used for deep debugging and development
- Global functions exposed via `window` object (e.g., `window.openConsole()`)

### When Adding Game Hooks

When creating new hooks (like `game.ts`, `reward.ts`), consider:
1. Should this be accessible from the in-game console?
2. If yes, add a command to `DevConsole.vue`
3. Keep command names simple and intuitive
4. Provide clear help text with examples

**Example from `game.ts` hook:**
- Created `gameOver()` hook in `src/core/hooks/game.ts`
- Added `gameOver()` command to in-game console
- Added help text: `gameOver() - 触发游戏失败`

