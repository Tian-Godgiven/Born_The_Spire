# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

每当回复时，都要以"完毕"为回答的结尾，以确认你还记得claude.md中的内容

## Project Overview

Born The Spire（蘇生尖塔）是以《杀戮尖塔》为灵感的中文 Roguelike 卡牌游戏，基于 Tauri 2 + Vue 3 构建，面向 Windows 桌面平台。核心机制：打败敌人 → 从敌人身上选取器官 → 器官提供卡牌和被动效果 → 组合成强力构建。

详细游戏概念见 `文档/未归档/游戏核心概念与设计理念.md`。

**Tech Stack:** Tauri 2 (Rust) + Vue 3 (TypeScript/SASS)

### Core Project Principles

1. **Mod-First Architecture** — 内部代码与 Mod 使用同一套 API，任何系统都要考虑 Mod 开发者如何使用
2. **声明式优先** — 用数据对象描述内容，而不是写命令式逻辑；TriggerMap/ReactionMap 系统是典型体现
3. **注册表模式** — 所有内容类型通过注册表管理，添加新内容只改数据不改核心逻辑
4. **非盈利粉丝项目** — 开源友好，尊重原作知识产权

## Development Commands

所有命令在 `born_the_spire/` 目录下执行：

```bash
npm run dev          # 启动 Vite 前端开发服务器
npm run tauri dev    # 启动完整 Tauri 开发模式（含 Rust 后端）
npm run build        # 构建前端（含 TypeScript 类型检查）
npm run tauri build  # 构建完整应用
```

## Core Architecture

### 事件驱动效果系统

所有游戏状态变更必须通过此系统，**严禁直接修改 Entity 属性**。

```
Transaction（事务）→ EventStack（事件栈）→ ActionEvent（过程事件）→ Effect（效果）
```

- **EffectUnit**：卡牌/器官数据中定义的效果描述（JSON）
- **Effect**：事件执行时由 EffectUnit 创建的运行时对象
- **EffectFunc**：实际修改游戏状态的函数，注册在 effectMap

每个 Effect 执行前后都有触发周期（before/after），触发器可以修改 Effect 参数或响应已发生的变化。

### 触发器系统（Trigger）

触发器通过 `when × how × key` 三维定位响应的事件：

```
when: "before" | "after"          — 事件效果执行前/后
how:  "make" | "via" | "take"     — 实体是事件的来源/媒介/目标
key:  "damage" | "turnStart" | …  — 事件类型
```

**推荐写法（声明式）**：在器官/遗物/卡牌数据中用 `action` + `reaction` 模式，详见 `文档/未归档/反应系统详解.md`。

**底层写法（命令式）**，仅在无法用声明式实现时使用：

```typescript
const { remove } = entity.trigger.appendTrigger({
    when: "before",
    how: "take",
    key: "damage",
    callback: (event, effect, triggerLevel) => { /* ... */ },
    level: 0
})
```

### 修饰器系统（Modifier）

- **StatusModifier**：管理属性变更（生命上限、能量等），有 base/current 两层
- **ContentModifier**：管理物品/器官持有
- 器官失去时，所有关联修饰器自动撤销，属性自动重算，**不需要手动清理**

### 其他核心系统

- **依赖注入容器**：`src/core/container.ts`，注册了工厂函数和单例（modifierManager 等）
- **懒加载系统**：`src/core/utils/lazyLoader.ts`，避免核心类与数据配置文件的循环依赖
- **CRITICAL**：本项目是 Vite + ES Modules，**不可使用 `require()`**，循环依赖用动态 `import()` 解决

### Key System Objects（`src/core/objects/system/`）

- **Entity**：所有游戏对象基类，有 `status`（属性）、`current`（当前值）、`trigger`（触发器）
- **ActionEvent**：游戏事件，含 `source`、`medium`、`target`、`effects[]`
- **Transaction**：管理事件执行，状态：created → gathering → organizing → doing
- **Status**：基于修饰器计算的实体属性，有 base（永久）和 current（临时）两层
- **Current**：高频变化的当前值（当前HP、能量），不走修饰器系统

### 文件结构

```
born_the_spire/src/
├── core/
│   ├── container.ts
│   ├── effects/            # EffectFunc 实现（health/ state/ card/ organ/ relic/）
│   ├── hooks/              # 高层封装（step.ts / chara.ts / variance.ts 等）
│   ├── objects/
│   │   ├── game/           # battle, run, transaction, eventStack, enemyTurn
│   │   ├── item/           # Card, Potion, Relic
│   │   ├── system/         # Entity, ActionEvent, Effect, Trigger, Modifier, Status, Current
│   │   └── target/         # Player, Enemy, Organ
│   └── types/
├── static/
│   └── list/               # 所有内容注册表（cardList, organList, enemyList, effectMap 等）
└── ui/                     # Vue 组件和页面
```

## Critical Development Rules

### 1. 不得绕过效果系统

```typescript
// 错误：直接修改
player.current.health.value -= 10

// 正确：通过事件系统
doEvent({
    key: "damage",
    source: enemy,
    medium: card,
    target: player,
    effectUnits: [{ key: "damage", params: { value: 10 } }]
})
```

### 2. 修饰器清理是自动的

器官/遗物提供的 StatusModifier 在失去时自动移除，**不需要也不应该手写 lose 交互来清理**。

### 3. 保护 Status 对象不被 Vue 响应式破坏

Status 对象内部有 `ref()` 字段，存入 entity.status 时必须用 `markRaw()`：

```typescript
entity.status[key] = markRaw(status)   // 正确
entity.status[key] = status            // 错误，Vue 会破坏内部 ref
```

### 4. 事件级联

事件可以触发新事件，用 `event.spawnEvent(newEvent)` 关联级联事件，共同在同一个 Transaction 中处理。

## Common Patterns

### 新增效果

1. 在 `src/core/effects/<分类>/` 创建 EffectFunc
2. 在 `src/static/list/system/effectMap.ts` 注册
3. 命名规范：原子效果用 `gainArmor`，专属效果用 `organ_` / `card_` 前缀

详见 `文档/未归档/效果开发指南.md`。

### 新增卡牌 / 器官 / 遗物 / 敌人

各类内容的文件清单和最小格式模板见 `文档/未归档/新内容开发清单.md`。

### 器官奖励动作 / 水池扩展动作

通过 `enableOrganRewardAction` / `enablePoolAction` 效果由遗物动态解锁，详见：
- `文档/未归档/器官奖励动作系统.md`
- `文档/未归档/水池行动扩展系统.md`

### 房间导航

```typescript
import { completeAndGoNext } from "@/core/hooks/step"
await completeAndGoNext()   // 完成当前房间，显示地图让玩家选择下一个
```

## Room System

房间类型：`battle` / `eliteBattle` / `event` / `pool` / `blackStore` / `floorSelect`

房间生命周期：`enter()` → `process()` → `complete()` → `exit()`

地图系统：FloorMap 预生成 15 层节点地图，battle/event 房间 key 在玩家进入时懒分配，pool/blackStore 在生成时确定。

## Type Safety & Reactivity

- `npm run build` 检查 TypeScript 错误
- Entity 用 `reactive()` 包装，Status/Current 值的变化自动触发 UI 更新
- 严格 TypeScript，注意 `ActionEvent<s, m, t>` 的类型参数

## UI Design Style

极简复古风格：
- 黑色边框（2px solid），白色背景
- **禁止使用任何阴影**（box-shadow、drop-shadow 等）
- Popover/Modal 用绝对定位 + 边框，不用阴影
- 交互反馈用轻微背景色变化（`rgba(0,0,0,0.05)`），不用动画

参考：`ReserveDisplay.vue`

## Testing Workflow

当前无自动化测试，手动测试：
1. `npm run tauri dev` 启动
2. 在游戏中触发相关机制
3. 查看浏览器控制台的错误/日志
4. 使用 `newLog()` / `newError()`（来自 `@/ui/hooks/global/`）

**注意**："控制台"指游戏内开发者控制台，不是浏览器控制台。

## In-Game Developer Console

- UI：`src/ui/page/tool/console/DevConsole.vue`
- 注册表：`src/core/utils/consoleCommandRegistry.ts`

当前命令：

```
listRooms()                    — 列出所有房间
listRooms("类型")              — 列出指定类型房间
enterRoom("key")               — 进入指定房间
enterRoom("key", 层级)         — 进入指定房间并设置层级
gameOver()                     — 触发游戏失败
clear / help
```

添加新命令：在 `DevConsole.vue` 的函数实现、`executeFunction` switch、`showHelp` 三处添加。

## Development Workflow Preferences

- **代码的优雅和长期维护性永远是第一需求**，不以快速实现牺牲代码质量
- **每次只解决一个问题**，等用户反馈后再进行下一步
- **不自动启动开发服务器**，用户自行测试并报告结果
- 实现任务前先提方案等确认，不直接写代码

## Documentation Guidelines

文档放在 `文档/未归档/`，由用户归档整理。

格式规范：
- 用标题和代码块组织，不用 `-` `*` `1.` 等 list 符号，改用缩进
- 不加 ⚠️ TODO 标记，TODO 记录在 `文档/任务列表.md`
- 主要用中文，技术术语保留英文

## Development Reference Docs（`文档/未归档/`）

开发新内容时按需查阅：

- **游戏核心概念与设计理念.md** — 游戏定位、核心循环、Mod 友好原则
- **新内容开发清单.md** — 添加卡牌/器官/遗物/敌人/状态/战斗时需改哪些文件
- **效果开发指南.md** — 三层效果分类（原子/复合/专属）、决策流程、命名规范
- **反应系统详解.md** — action+reaction 模式完整说明、triggerTarget vs targetType、执行流程
- **状态系统开发指南.md** — StateData 格式、stackChange、状态自带触发器
- **敌人AI系统.md** — behavior/pattern/condition 格式、双牌堆、多阶段Boss
- **实现参考手册.md** — Effect拦截、$triggerEffect语法、inHand交互、StateModifier API 等关键机制
