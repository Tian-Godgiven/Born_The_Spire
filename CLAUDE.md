# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

每当回复时，都要以"完毕"为回答的结尾，以确认你还记得claude.md中的内容

## Project Overview

Born The Spire（蘇生尖塔）是以《杀戮尖塔》为灵感的中文 Roguelike 卡牌游戏，基于 Tauri 2 + Vue 3 构建，面向 Windows 桌面平台。核心机制：打败敌人 → 从敌人身上选取器官 → 器官提供卡牌和被动效果 → 组合成强力构建。

详细游戏概念见 `文档/参考/游戏核心概念与设计理念.md`。

**Tech Stack:** Tauri 2 (Rust) + Vue 3 (TypeScript/SASS)

### Core Project Principles

1. **Mod 优先** — 最大程度支持 Mod。内部内容与 Mod 使用同一套 API。加能力时先问：Mod 作者能不能用。
2. **数据驱动 / 声明式优先** — 内容用数据对象描述。初级开发者只加数据、不碰核心。现有数据表达不清时，优先改引擎让它能被数据表达，而不是在核心里写一次性特例。TriggerMap/ReactionMap 是典型体现。
3. **组件化优先** — 能力优先做成组件对外提供，而不是散装 hook 或工具函数让每个使用方自己拼。Mod 作者拿到的应该是「放一个组件进去就有完整行为」，而不是一份要照着抄的接线说明。hook 只作为组件的内部实现存在。
4. **注册表模式** — 所有内容类型通过注册表管理，添加新内容只改数据不改核心逻辑
5. **地基可改** — 整体开发尚未完成，仍在打地基 + 补内容。不把现有规则当成教条让人来贴。必要时可以改底层，目的是让开发和 Mod 更友好。改底层仍然先提案、等确认再动。
6. **非盈利粉丝项目** — 开源友好，尊重原作知识产权

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

每个 Effect 执行时有触发周期（before → on → after），触发器可以修改 Effect 参数或响应已发生的变化。

### 触发器系统（Trigger）

触发器通过 `when × how × key` 三维定位响应的事件：

```
when: "before" | "on" | "after"  — 改参数 / 结算发生（护甲） / 事后响应
how:  "make" | "via" | "take"     — 实体是事件的来源/媒介/目标
key:  "damage" | "turnStart" | …  — 事件类型
```

**推荐写法（声明式）**：在器官/遗物/卡牌数据中用 `action` + `reaction` 模式，详见 `文档/参考/反应系统详解.md`。

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
- **懒加载系统**：`src/core/utils/lazyLoader.ts`，只延迟数据表（organList / cardList / effectMap 等），避免核心类在加载阶段去碰配置
- **工厂**：`src/core/factories.ts`，目前只负责 `new` + `initialize()`，去留另议。`createPlayer` / `createEnemy` 不能顶层值导入（会在加载 `Chara` 时提前执行子类）
- **CRITICAL**：Vite + ES Modules，**不可使用 `require()`**。循环依赖优先 `import type`、懒加载数据、preload 分层。`await import()` 只放在 `preload.ts`、`lazyLoader` 的 loader、`initContainer()`，以及工厂里对 `Player` / `Enemy` 的延迟取值。见《常见错误排查手册》L1

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

详见 `文档/参考/效果开发指南.md`。

### 新增卡牌 / 器官 / 遗物 / 敌人

各类内容的文件清单和最小格式模板见 `文档/开发指南/新内容开发清单.md`。

### 器官奖励动作 / 水池扩展动作

通过 `enableOrganRewardAction` / `enablePoolAction` 效果由遗物动态解锁，详见：
- `文档/子系统/器官/器官奖励动作系统.md`
- `文档/子系统/房间/水池行动扩展系统.md`

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

- 类型错误由用户自己构建时发现，AI 不跑 `npm run build` / `vue-tsc`
- Entity 用 `reactive()` 包装，Status/Current 值的变化自动触发 UI 更新
- 严格 TypeScript，注意 `ActionEvent<s, m, t>` 的类型参数

## UI Design Style

极简复古风格：
- 黑色边框（2px solid），白色背景
- **禁止使用任何阴影**（box-shadow、drop-shadow 等）
- Popover/Modal 用绝对定位 + 边框，不用阴影
- 交互反馈用轻微背景色变化（`rgba(0,0,0,0.05)`），不用动画

参考：`ReserveDisplay.vue`

一切悬停/点击说明框统一用 `<Popover>`（`src/ui/components/global/Popover.vue`），描述文本里的卡名和术语统一用 `<DescribeText>`。**不要再自己写 Teleport + 手算坐标 + setTimeout 那一套**，详见 `文档/子系统/UI/浮层系统.md`。

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
- 内置命令按分组注册在 `src/ui/page/tool/console/commands/*.ts`（room / battle / card / potion / relic / organ / debug）
- 在控制台里输入 `help` 查看所有命令，`clear` 清屏

添加新命令：在 `src/ui/page/tool/console/commands/` 下找对应分组文件（或新建），追加一个 `ConsoleCommand` 对象，然后在 `commands/index.ts` 的 `registerCommands()` 里 push 进去即可。

## Development Workflow Preferences

- **代码的优雅和长期维护性永远是第一需求**，不以快速实现牺牲代码质量
- **每次只推进一件事**：一次回复只做一件——要么问一个问题，要么改一处，要么给一个方案等确认。需要拍板时只问一个问题。用户未反馈前，不开始下一件。
- **手册中心**：当前工作是修 bug、完善体验、添加内容。场景手册是 AI、Mod 作者及其 AI 的共同参考。加内容或改内容时，先对照手册里的例子再写。改底层逻辑时，同步更新对应手册，让手册始终能代表现行做法。CLAUDE.md 只留入口和规则，不把手册正文抄进来；动手时只读本任务对得上的那一份，同一会话里不反复打开同一份。
- **注释不叠加**：留新注释时尽量删掉被取代的旧注释，不要在旧注释上面再盖一层。踩坑记录写进手册（尤其是《常见错误排查手册》），不要堆在代码注释里。
- **不自动启动开发服务器**，用户自行测试并报告结果
- **不跑类型检查 / 构建**（`npm run build`、`vue-tsc` 等一律不跑，太慢）。改完直接交给用户，用户自己启动程序验证。类型正确性靠写的时候看清楚，不靠事后跑一遍。
- 实现任务前先提方案等确认，不直接写代码。改底层逻辑同样适用。

## Documentation Guidelines

文档目录结构：
- `文档/参考/` — 引擎原理与开发核心
- `文档/开发指南/` — how-to 类：教你怎么加新卡/器官/遗物/敌人等
- `文档/设计/` — 各层敌人/Boss/精英的具体设计
- `文档/子系统/` — 器官/主动使用/房间/UI/随机数/难度/物品等专门功能
- `文档/历史/` — 重构日志、被取代或过时的老文档

格式规范：
- 用标题和代码块组织，不用 `-` `*` `1.` 等 list 符号，改用缩进
- 不加 ⚠️ TODO 标记，TODO 记录在 `文档/任务列表.md`
- 主要用中文，技术术语保留英文

维护约定：
- 开发指南答「动哪些文件、字段格式」；场景手册答「做出 XX 效果，数据怎么写」
- 手册示例必须来自现行真实数据；key 改名或删除时同步改示例
- 改底层之后，相关场景手册 / 开发指南 / 常见错误必须一起改，不能只改代码

## Development Reference Docs

开发新内容时按需查阅：

- **`文档/参考/游戏核心概念与设计理念.md`** — 游戏定位、核心循环、Mod 友好原则
- **`文档/开发指南/新内容开发清单.md`** — 添加卡牌/器官/遗物/敌人/状态/战斗时需改哪些文件
- **`文档/参考/效果开发指南.md`** — 三层效果分类（原子/复合/专属）、决策流程、命名规范
- **`文档/参考/反应系统详解.md`** — action+reaction 模式完整说明、triggerTarget vs targetType、执行流程
- **`文档/子系统/属性与当前值/属性系统.md`** — Status 的 base/current 两层、originalBaseValue、changeStatusValue/getStatusValue API 用法
- **`文档/子系统/属性与当前值/属性注册表系统.md`** — statusMap 定义格式（hidden/notNegative/category）、ensureStatusExists 动态注册
- **`文档/参考/修饰器总论.md`** — StatusModifier / ContentModifier / StateModifier 三大修饰器语义、Status 内部管理、自动清理时机
- **`文档/开发指南/状态系统开发指南.md`** — StateData 格式、stackChange、状态自带触发器
- **`文档/开发指南/敌人AI系统.md`** — behavior/pattern/condition 格式、双牌堆、多阶段Boss
- **`文档/参考/实现参考手册.md`** — Effect拦截、$triggerEffect语法、inHand交互、StateModifier API 等关键机制
- **`文档/参考/字段值枚举手册.md`** — rarity/tags/targetType/faction 等跨内容列表的魔法字符串清单，防止拼错或引入新变体
- **`文档/子系统/UI/浮层系统.md`** — Popover 属性表、定位基准选取、三种触发模式、triggerElement、DescribeText/CardRefText、层级约定与踩坑

实现具体效果时的场景式教程（`文档/开发指南/场景手册/`）：

- **`卡牌实现场景手册.md`** — 14 场景，简单攻击到 inHand 触发、动态数值
- **`状态实现场景手册.md`** — 10 场景，debuff/buff/衰减/一次性/器官内部状态
- **`器官实现场景手册.md`** — 10 场景，含对称原则、独立原则；主动能力样板
- **`遗物实现场景手册.md`** — 12 场景，累计触发/解锁行动/主动能力/获得时选择存id/池分配/每回合触发
- **`敌人实现场景手册.md`** — 10 场景，多阶段 Boss（血量阈值）、weighted/loop mode
- **`词条实现场景手册.md`** — 3 场景横切手册：方法覆盖类 / 触发器挂载类 / status 语法糖类，含决策流程与常见坑
- **`触发器实现场景手册.md`** — 10 场景横切手册：when/how/key 三维、跨方引用、condition 语法坑、accumulateAndTrigger/triggerTarget、UI 组件里挂触发器做表现层；附录 B 讲触发顺序三层规则（when → how → level）、TriggerLevel 档位表、赋值型效果为什么必须抢占端点
- **`效果实现场景手册.md`** — 10 场景横切手册：EffectUnit 数组、`$` 引用表达式、影响牌堆/status/state、拦截修改参数、新建 EffectFunc
- **`事件实现场景手册.md`** — 10 场景：单幕/多幕/ifAble/rewards/互斥组/选择界面/saveData+ifShow/嵌入战斗/customCallback/新增 event effect；含 eventEffectMap 速查与 8 个常见坑
- **`动画实现场景手册.md`** — 13 场景 + AnimationManager 内部机制 + 13 个常见坑：复用/注册 preset、useAnimation 组件接入、多阶段演出、watch 驱动、channel/priority/repeat/interruptible 决策、append 跳字（已实证）、注册动画类别与全局跳过/调速；replace 模式仍未实测
- **`常见错误排查手册.md`** — 跨类型错误主题分类：事件系统绕过、修饰器误清理、触发器 when/how 错用、模块加载顺序（Cannot access before initialization）等

场景手册与开发指南的分工：开发指南答「需要动哪些文件、字段格式」，场景手册答「我想做出 XX 效果，具体数据怎么写」。
