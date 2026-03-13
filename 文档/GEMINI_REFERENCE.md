# Born The Spire - 核心机制参考文档

这是给 AI 助手（Gemini/Claude）的项目参考文档，旨在避免重复实现已有功能。

---

## 项目概述

Born The Spire（蘇生尖塔）是一个类《杀戮尖塔》的卡牌游戏，使用 Tauri 2 + Vue 3 + TypeScript 开发。核心设计理念是 Mod 优先架构，所有系统都应为 Mod 开发者提供清晰的接口。

---

## 核心架构原则

### 1. 事件驱动系统（最重要）

**所有游戏状态变更必须通过事件系统** - 永远不要直接修改 Entity 属性！

```typescript
// ❌ 错误 - 直接修改
player.current.health.value -= 10

// ✅ 正确 - 通过事件系统
import { doEvent } from "@/core/objects/system/ActionEvent"
doEvent({
    key: "damage",
    source: enemy,
    medium: card,
    target: player,
    effectUnits: [{ key: "damage", params: { value: 10 } }]
})
```

### 2. 修饰器自动清理

**修饰器的核心价值是自动清理**。当获得物品时添加的效果，在失去物品时会自动移除，无需手动处理。

```typescript
// ✅ 只需要定义获得时的效果
organ.onAcquire = () => {
    addStatusModifier(player, "maxHealth", { value: 10, source: organ })
    // 不需要定义 onLose
}
// 失去器官时，修饰器系统自动清理
```

### 3. 数据驱动优于代码

优先使用 TriggerMap（声明式）而非编写回调函数（命令式）：

```typescript
// ✅ 推荐 - TriggerMap 数据驱动
triggers: [{
    when: "after",
    how: "make",
    key: "battleEnd",
    event: [{
        targetType: "owner",
        key: "heal",
        effect: [{ key: "heal", params: { value: 5 } }]
    }]
}]

// ❌ 避免 - 命令式回调
triggers: [{
    when: "after",
    how: "make",
    key: "battleEnd",
    callback: (event) => { /* 手动创建事件 */ }
}]
```

---

## 核心系统速查

### 事务 → 事件栈 → 效果

流程：玩家操作 → 创建事务 → 收集事件 → 整理顺序 → 执行效果

```
Transaction (事务)
  ↓ 收集
EventStack (事件栈)
  ↓ 排序执行
ActionEvent (过程事件)
  ↓ 携带
EffectUnit[] → Effect[] → EffectFunc
```

### 触发器系统

结构：`when` × `how` × `key`

- **when**: `before` | `after` - 事件前或后触发
- **how**: `make` | `via` | `take` - 事件中的角色（造成/参与/承受）
- **key**: 事件类型，如 `"damage"`, `"heal"`, `"turnStart"`

示例：
```typescript
// 玩家受到伤害时，减少伤害
{
    when: "before",
    how: "take",
    key: "damage",
    event: [...] // 触发时生成的事件
}
```

### 属性 Status 系统

三层结构：
- `originalBaseValue` - 原始基础值（用于升级）
- `baseValue` - 基础值 + 基础层修饰器
- `value` - 当前值（最终使用值）

**重要：必须使用 `markRaw()` 保护 Status 对象**：
```typescript
entity.status[key] = markRaw(status)
```

### 修饰器类型

| 修饰器 | 用途 | 获取方式 |
|--------|------|----------|
| StatusModifier | 管理属性 | `changeStatusValue()` |
| StateModifier | 管理状态（力量、中毒等） | `getStateModifier().addState()` |
| ReserveModifier | 管理储备（金钱、物质） | `getReserveModifier().gainReserve()` |
| OrganModifier | 管理器官 | `getOrganModifier().addOrgan()` |
| CardModifier | 管理卡牌 | `getCardModifier().addCard()` |
| PotionModifier | 管理药水 | `getPotionModifier().addPotion()` |

---

## 常见功能已有实现

### 1. 效果预览系统

**不要手动计算伤害加成！** 使用 `effectPreview.ts`：

```typescript
import { previewEffectValue } from "@/core/utils/effectPreview"

// 计算考虑所有触发器（力量、易伤等）后的最终伤害
const finalDamage = previewEffectValue(card, player, "damage", enemy)
```

预览系统会：
1. 创建模拟事件（MockEvent）
2. 执行触发器
3. 处理子事件（如 modifyDamage）
4. 返回最终值

如需新效果支持预览，在 `effectMap.ts` 中添加 preview：
```typescript
{
    key: "myEffect",
    effect: myEffectFunc,
    preview: (event, effect) => Number(effect.params.value)
}
```

### 2. 弹窗系统

**不要重新实现弹窗！** 使用已存在的系统：

```typescript
// 确认弹窗
import { showConfirm } from "@/ui/hooks/interaction/confirmModal"
const confirmed = await showConfirm("标题", "消息", organ?, material?)

// 卡牌组弹窗
import { showCardGroupPopup } from "@/hooks/popUp"
await showCardGroupPopup("draw")     // 抽牌堆
await showCardGroupPopup("discard")  // 弃牌堆
await showCardGroupPopup("hand")     // 手牌
```

### 3. 选择目标系统

使用 `chooseTarget`：
```typescript
import { chooseTarget } from "@/ui/interaction/target/chooseTarget"

const targets = await chooseTarget({
    targetType: "enemy",  // "enemy" | "ally" | "all" | "player"
    amount: 1,
    title: "选择目标",
    ifShowConnectLine: true
})
```

### 4. 房间切换

**不要手动操作房间状态！** 使用 hooks：
```typescript
import { completeAndGoNext } from "@/core/hooks/step"

// 完成当前房间，显示地图
await completeAndGoNext()
```

### 5. 器官奖励动作

器官奖励（战斗后选择器官）支持扩展动作：
- `assimilate` - 同化（获得器官）
- `devour` - 吞噬（获得物质）
- `sacrifice` - 献祭（回复生命，需遗物解锁）

通过遗物启用新动作：
```typescript
// 在遗物配置中
interaction: {
    possess: {
        effects: [{
            key: "enableOrganRewardAction",
            params: { actionKey: "sacrifice" }
        }]
    }
}
```

### 6. 主动使用系统

器官和遗物可以配置主动能力：
```typescript
{
    activeAbilities: [{
        key: "heal",
        label: "治疗",
        usage: { type: "instant" },  // "instant" | "menu" | "targetSelection" | "toggle"
        costs: { energy: 1 },
        restrictions: {
            usesPerTurn: 1,
            conditions: { scene: "combat" }
        },
        effects: [{ key: "heal", params: { value: 5 } }]
    }]
}
```

### 7. 随机数系统

**不要直接用 Math.random()！** 使用种子随机数：
```typescript
import { nowGameRun } from "@/core/objects/game/run"

// 使用当前局的 RNG
const rng = nowGameRun.rng
rng.nextInt(1, 10)     // 随机整数
rng.nextFloat()        // 随机浮点
rng.randomChoice(array) // 随机选择
```

---

## 重要文件路径

### 核心系统
```
src/core/objects/system/
  ActionEvent.ts          # 事件创建和执行
  effect/EffectFunc.ts    # 效果函数基类
  effect/EffectUnit.ts    # 效果单元（数据定义）
  trigger/Trigger.ts      # 触发器系统
  modifier/               # 各种修饰器
  status/Status.ts        # 属性系统
```

### 效果定义
```
src/static/list/system/effectMap.ts    # 效果注册表
src/core/effects/                      # 效果函数实现
  health/     # 伤害、治疗、护甲
  card/       # 抽牌、卡牌操作
  state/      # 状态（力量、中毒等）
```

### 游戏流程
```
src/core/objects/game/
  run.ts        # 当前局、当前玩家
  battle.ts     # 战斗管理
  transaction.ts # 事务系统
```

### 数据定义
```
src/static/list/
  item/cardList.ts      # 卡牌定义
  item/relicList.ts     # 遗物定义
  target/organList.ts   # 器官定义
  system/statusMap.ts   # 属性定义
```

---

## 常见陷阱

### 1. 直接修改属性值
```typescript
// ❌ 错误
player.status.maxHealth.value += 10

// ✅ 正确 - 使用修饰器
changeStatusValue(player, "maxHealth", source, { value: 10 })
```

### 2. 手动计算效果值
```typescript
// ❌ 错误 - 手动读取力量计算伤害
const power = player.status.power?.value || 0
const finalDamage = baseDamage + power

// ✅ 正确 - 使用预览系统
const finalDamage = previewEffectValue(card, player, "damage", target)
```

### 3. 忘记 markRaw
```typescript
// ❌ 错误
entity.status[key] = status

// ✅ 正确
entity.status[key] = markRaw(status)
```

### 4. 手动管理失去效果
```typescript
// ❌ 错误
organ.onAcquire = () => { player.maxHealth += 10 }
organ.onLose = () => { player.maxHealth -= 10 }  // 不需要！

// ✅ 正确 - 修饰器自动处理
organ.onAcquire = () => {
    addStatusModifier(player, "maxHealth", { value: 10, source: organ })
}
```

### 5. 使用普通随机数
```typescript
// ❌ 错误
const damage = Math.floor(Math.random() * 10) + 1

// ✅ 正确 - 使用种子随机
const damage = nowGameRun.rng.nextInt(1, 10)
```

---

## 扩展系统指南

### 添加新效果

1. 在 `src/core/effects/` 下创建效果函数
2. 在 `effectMap.ts` 中注册
3. 可选：添加 preview 方法支持预览

### 添加新房间类型

1. 创建房间类继承 `Room.ts`
2. 在 `roomRegistry.ts` 注册
3. 在地图生成器中添加配置

### 添加新状态

1. 在 `statusMap.ts` 注册状态定义
2. 在 `stateList.ts` 创建状态数据（如果需要）
3. 使用 `StateModifier` 添加到目标

---

## 开发原则

1. **先查已有实现** - 80%的功能已经存在
2. **配置优于代码** - 优先使用 TriggerMap
3. **测试驱动** - 使用开发者控制台测试
4. **Mod 友好** - 考虑 Mod 开发者如何使用
5. **中文优先** - 文档和注释使用中文

---

## 快速检查清单

在实现新功能前，检查：

- [ ] 是否已有类似功能？搜索 `src/core/effects/`
- [ ] 是否需要预览支持？检查 `effectPreview.ts`
- [ ] 是否需要弹窗？检查 `confirmModal.ts`, `cardGroupModal.ts`
- [ ] 是否涉及属性修改？使用 `changeStatusValue()`
- [ ] 是否需要随机数？使用 `nowGameRun.rng`
- [ ] 是否需要选择目标？使用 `chooseTarget()`

完毕
