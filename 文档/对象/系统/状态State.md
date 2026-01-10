[toc]

# 状态State

状态是添加在目标Target上的临时效果，具有层数和持续时间。

## 核心概念

状态具有三个主要行为：

1. **获取**：获取状态时，为目标添加触发器和效果
2. **持有**：状态持续期间，触发器自动响应游戏事件
3. **失去**：状态失效时，自动清理所有触发器

例如：力量状态

- 获取时：无特殊效果
- 持有时：添加触发器 `before make damage → 伤害值 + 力量层数`
- 失去时：自动移除上述触发器

## StateData 数据结构

```typescript
{
    label: string,              // 状态名称
    key: string,                // 唯一标识符
    describe: Describe,         // 状态描述
    showType?: "number" | "bool",  // 显示类型（默认 number）
    repeate?: "stack" | "refresh" | "none",  // 重复获得行为（默认 stack）
    stacks?: Stack[] | number,  // 层数对象（可简写为数字）
    checkExist?: (getter: Target, state: State) => boolean,  // 存在性检查
    stackChange?: StackChangeRule[],  // 自动变化规则
    interaction?: StateInteractionData  // 状态交互
}
```

### repeate 重复获得行为

- **stack（叠加）**：层数累加。例如：力量3 + 力量2 = 力量5
- **refresh（刷新）**：层数覆盖。例如：中毒5 + 中毒2 = 中毒2
- **none（无效）**：忽略重复获得

### stacks 层数系统

支持多个层数维度，每个层数有独立的 key：

```typescript
stacks: [
    { key: "default", stack: 5 },     // 主层数
    { key: "duration", stack: 3 }     // 持续回合数
]
// 或简写为数字（自动创建 default 层数）
stacks: 5
```

### stackChange 自动变化规则

在特定时机自动修改层数：

```typescript
stackChange: [
    { timing: "turnEnd", delta: -1 },        // 回合结束时层数-1
    { timing: "battleStart", delta: "all" }  // 战斗开始时清空
]
```

支持的 timing：`turnStart` | `turnEnd` | `battleStart` | `battleEnd`

### checkExist 存在性检查

自定义状态何时被移除。默认规则是 `default` 层数 > 0 时存在。

**自定义规则示例**：

```typescript
// 示例1：检查 duration 层数
checkExist: (getter, state) => {
    const duration = state.stacks.find(s => s.key === "duration")
    return duration && duration.stack > 0
}

// 示例2：多条件检查
checkExist: (getter, state) => {
    const power = state.stacks.find(s => s.key === "default")
    const duration = state.stacks.find(s => s.key === "duration")
    // 只要有一个层数 > 0 就保留
    return (power && power.stack > 0) || (duration && duration.stack > 0)
}

// 示例3：永久状态（永不自动移除）
checkExist: () => true

// 示例4：基于目标属性的复杂检查
checkExist: (getter, state) => {
    const stack = state.stacks.find(s => s.key === "default")
    // 如果目标生命值 < 50%，状态层数 > 0 即可
    // 否则需要层数 > 3
    const health = getter.current.health?.value || 0
    const maxHealth = getter.status.get("max-health")?.value || 1
    const threshold = health / maxHealth < 0.5 ? 0 : 3
    return stack && stack.stack > threshold
}
```

**重要**：每次 `changeStack` 修改层数后，会自动调用 `checkExist`。如果返回 `false`，状态会被自动移除（并触发 `remove` 交互）。

### interaction 状态交互

```typescript
interaction: {
    // 获得状态时的一次性效果
    apply?: {
        effects?: EffectUnit[]
    },

    // 持有状态期间的触发器
    possess?: {
        triggers?: TriggerMap
    },

    // 失去状态时的一次性效果
    remove?: {
        effects?: EffectUnit[]
    }
}
```

## 使用方法

### 1. 定义状态数据（stateList.ts）

```typescript
{
    label: "中毒",
    key: "poison",
    describe: ["回合结束时受到伤害"],
    repeate: "stack",
    stackChange: [
        { timing: "turnEnd", delta: -1 }  // 回合结束层数-1
    ],
    interaction: {
        possess: {
            triggers: [{
                when: "before",
                how: "take",
                key: "turnEnd",
                event: [{
                    key: "poisonDamage",
                    targetType: "triggerOwner",
                    effect: [{
                        key: "damage",
                        params: { value: "$source.stack.default" }
                    }]
                }]
            }]
        }
    }
}
```

### 2. 为目标添加状态

**通过效果系统**（推荐）：

```typescript
doEvent({
    key: "applyPoisonEvent",
    source: card,
    medium: card,
    target: enemy,
    effectUnits: [{
        key: "applyState",
        params: {
            stateKey: "poison",
            stacks: 3  // 或 [{ key: "default", stack: 3 }]
        }
    }]
})
```

**直接使用 StateModifier**：

```typescript
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"
import { stateList } from "@/static/list/target/stateList"

const stateModifier = getStateModifier(target)
const poisonData = stateList.find(s => s.key === "poison")
stateModifier.addState(poisonData, 3, source)
```

### 3. 修改状态层数

```typescript
// 通过效果系统
doEvent({
    key: "increasePoison",
    source: card,
    target: enemy,
    effectUnits: [{
        key: "changeStateStack",
        params: {
            stateKey: "poison",
            stackKey: "default",  // 可选，默认 "default"
            delta: 2  // 增加2层（负数则减少）
        }
    }]
})

// 直接使用 StateModifier
stateModifier.changeStack("poison", "default", 2)
```

### 4. 移除状态

```typescript
// 通过效果系统
doEvent({
    key: "removePoison",
    target: enemy,
    effectUnits: [{
        key: "removeState",
        params: {
            stateKey: "poison",
            triggerRemoveEffect: true  // 是否触发 remove 交互
        }
    }]
})

// 直接使用 StateModifier
stateModifier.removeState("poison", true)
```

### 5. 查询状态

```typescript
const stateModifier = getStateModifier(target)

// 检查是否拥有状态
if (stateModifier.hasState("poison")) {
    // ...
}

// 获取状态对象
const state = stateModifier.getState("poison")

// 获取层数值
import { getStateStack } from "@/core/objects/system/State"
const stack = getStateStack(target, "poison", "default")
```

## StateModifier 管理器

每个 Target 都有一个 StateModifier 管理其所有状态。

**主要方法**：

- `addState(stateData, stacks, source)` - 添加状态
- `removeState(stateKey, triggerRemoveEffect)` - 移除状态
- `changeStack(stateKey, stackKey, delta)` - 修改层数
- `getState(stateKey)` - 获取状态
- `hasState(stateKey)` - 检查状态
- `getAllStates()` - 获取所有状态

StateModifier 自动处理：
- 触发器的添加和清理
- stackChange 规则的执行
- 状态存在性检查（层数归0时自动移除）

## 示例：创建新状态

```typescript
// 在 stateList.ts 中添加
{
    label: "再生",
    key: "regeneration",
    describe: ["回合开始时恢复生命"],
    repeate: "stack",
    stacks: [
        { key: "default", stack: 0 },    // 回复量
        { key: "duration", stack: 0 }    // 持续回合
    ],
    stackChange: [
        { timing: "turnStart", stackKey: "duration", delta: -1 }
    ],
    interaction: {
        possess: {
            triggers: [{
                when: "after",
                how: "take",
                key: "turnStart",
                event: [{
                    key: "regenHeal",
                    targetType: "triggerOwner",
                    effect: [{
                        key: "heal",
                        params: { value: "$source.stack.default" }
                    }]
                }]
            }]
        }
    },
    // 自定义存在性检查：duration > 0
    checkExist: (getter, state) => {
        const duration = state.stacks.find(s => s.key === "duration")
        return duration && duration.stack > 0
    }
}
```

## Effect 函数

状态相关的 Effect 函数已在 effectMap 中注册：

- **applyState** - 添加状态
- **removeState** - 移除状态
- **changeStateStack** - 修改状态层数

可直接在 EffectUnit 中使用。



