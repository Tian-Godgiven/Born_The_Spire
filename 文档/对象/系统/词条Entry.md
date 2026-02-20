[toc]

# 词条系统

词条（Entry）是一种特殊的修饰器，用于为卡牌和器官添加特殊效果和行为。词条通过 EntryModifier 管理，会自动创建触发器等副作用，并在词条移除时自动清理这些副作用。

## 核心概念

词条是卡牌/器官的装饰器的一种，会影响其一系列行为。当实体获得词条时，会自动应用词条定义的效果（通常是添加触发器），当失去词条时，这些效果会被自动移除。

**与普通修饰器的区别：**
- 词条是预定义的、可复用的效果模板
- 词条会自动管理触发器的生命周期
- 词条支持冲突检测机制
- 词条的效果通过声明式定义，而非命令式代码

## EntryModifier

EntryModifier 是管理实体词条的修饰器，使用 WeakMap 存储在实体上，避免污染 Entity 基类。

### 主要方法

**addEntry(entryKey: string): boolean | string**
- 为实体添加词条
- 返回 true 表示成功，返回 string 表示失败原因
- 会自动检查词条是否已存在、是否冲突
- 应用词条时会调用 onApply 函数创建副作用

**removeEntry(entryKey: string): boolean**
- 移除实体的词条
- 会自动调用所有移除函数清理副作用
- 返回是否成功移除

**hasEntry(entryKey: string): boolean**
- 检查实体是否拥有某个词条

**getEntries(): string[]**
- 获取实体所有词条的 key 列表

### 使用示例

```typescript
import { getEntryModifier } from '@/core/objects/system/modifier/EntryModifier'

// 获取卡牌的词条管理器
const entryModifier = getEntryModifier(card)

// 添加词条
const result = entryModifier.addEntry("exhaust")
if (result === true) {
    console.log("成功添加消耗词条")
} else {
    console.log("添加失败：", result)
}

// 检查词条
if (entryModifier.hasEntry("exhaust")) {
    console.log("卡牌拥有消耗词条")
}

// 移除词条
entryModifier.removeEntry("exhaust")
```

## 词条定义

所有词条的实现逻辑都在 `Entry.ts` 的 `entryDefinitions` 中定义。

### EntryDefinition 结构

```typescript
type EntryDefinition = {
    describe: Describe              // 词条描述（用于UI显示）
    conflictsWith?: string[]        // 冲突的词条列表
    onApply: (owner: Entity, parentOwner?: Entity) => Array<() => void>
    // onApply 参数说明：
    // - owner: 持有词条的实体（Card/Organ）
    // - parentOwner: 父级持有者（Player/Enemy）
    // - 返回值: 移除函数数组，用于清理副作用
}
```

### onApply 函数

onApply 是词条的核心逻辑，在词条被添加到实体时调用。它应该：
1. 检查 owner 和 parentOwner 的类型是否符合预期
2. 应用词条效果（通常是添加触发器或修改方法）
3. 返回移除函数数组，用于撤销这些效果

**重要：** onApply 必须返回移除函数数组，即使为空数组也要返回。这些函数会在词条被移除时自动调用。

## 已实现的词条

### 消耗（exhaust）

**描述：** 使用后，将其移入消耗堆，而非弃牌堆

**实现方式：** 覆盖卡牌的 `getAfterUseEffect` 方法，返回移入消耗堆的效果

**冲突词条：** void（虚无）

```typescript
exhaust: {
    describe: ["使用后，将其移入消耗堆，而非弃牌堆"],
    conflictsWith: ["void"],
    onApply: (owner, parentOwner) => {
        if (!(owner instanceof Card)) return []
        if (!(parentOwner instanceof Player)) return []

        const card = owner
        const originalMethod = card.getAfterUseEffect.bind(card)

        // 覆盖方法：使用后移入消耗堆
        card.getAfterUseEffect = (fromPile) => ({
            key: "pay_exhaust",
            describe: ["将卡牌移入消耗堆"],
            params: { sourcePile: fromPile, card }
        })

        // 返回恢复函数
        return [() => {
            card.getAfterUseEffect = originalMethod
        }]
    }
}
```

### 虚无（void）

**描述：** 若回合结束时仍在手牌中，会移入消耗堆而非弃牌堆

**实现方式：** 在 Player 上添加触发器，监听回合结束前事件，检查卡牌是否在手牌中

**冲突词条：** exhaust（消耗）

```typescript
void: {
    describe: ["若回合结束时仍在手牌中，会移入消耗堆而非弃牌堆"],
    conflictsWith: ["exhaust"],
    onApply: (owner, parentOwner) => {
        if (!(owner instanceof Card)) return []
        if (!(parentOwner instanceof Player)) return []

        const card = owner
        const player = parentOwner

        // 使用声明式触发器定义
        const triggerObj = createTriggerByTriggerMap(
            player, player,
            {
                when: "before",
                how: "make",
                key: "turnEnd",
                event: [{
                    key: "voidExhaust",
                    targetType: card,
                    effect: [{
                        key: "voidExhaust",
                        describe: ["虚无：将卡牌移入消耗堆"],
                        params: {}
                    }]
                }]
            }
        )

        const { remove } = player.trigger.appendTrigger(triggerObj)
        return [remove]
    }
}
```

## 词条冲突机制

某些词条之间存在逻辑冲突，不能同时存在于同一个实体上。通过 `conflictsWith` 字段定义冲突关系。

### 冲突检测

当添加词条时，EntryModifier 会自动检查：
1. 词条是否已存在（不能重复添加）
2. 是否与已有词条冲突

如果检测到冲突，`addEntry` 会返回失败原因字符串。

### 冲突示例

词条冲突通常发生在它们试图修改同一个行为时。例如：
- 多个"使用后去向"词条可能冲突（如果设计为互斥）
- 多个"抽牌时机"词条可能冲突

**注意：** 消耗和虚无词条虽然都涉及移入消耗堆，但它们作用于不同时机（使用后 vs 回合结束），因此可以共存。

## 如何添加新词条

### 1. 在 Entry.ts 中定义词条

在 `entryDefinitions` 对象中添加新词条：

```typescript
export const entryDefinitions: Record<string, EntryDefinition> = {
    // ... 已有词条

    newEntry: {
        describe: ["词条描述"],
        conflictsWith: ["conflictingEntry"],  // 可选
        onApply: (owner, parentOwner) => {
            // 类型检查
            if (!(owner instanceof Card)) return []
            if (!(parentOwner instanceof Player)) return []

            // 应用效果（添加触发器、修改方法等）
            const triggerObj = createTriggerByTriggerMap(...)
            const { remove } = parentOwner.trigger.appendTrigger(triggerObj)

            // 返回移除函数数组
            return [remove]
        }
    }
}
```

### 2. 在 entryMap 中注册词条信息

在 `entryMap.ts` 中添加词条的显示信息：

```typescript
export const entryMap: Record<string, EntryInfo> = {
    // ... 已有词条

    newEntry: {
        label: "新词条",
        describe: ["词条描述"]
    }
}
```

### 3. 实现词条效果函数（如需要）

如果词条需要特殊的效果函数，在 `entryEffects.ts` 中添加：

```typescript
export const newEntryEffect: EffectFunc = (event, effect) => {
    // 效果实现
}
```

并在 `effectMap.ts` 中注册：

```typescript
export const effectMap: Record<string, EffectFunc> = {
    // ... 已有效果
    newEntryEffect
}
```

### 4. 在卡牌/器官数据中使用

在卡牌或器官的定义中添加词条：

```typescript
{
    key: "card_001",
    label: "示例卡牌",
    entry: ["newEntry"],  // 添加词条
    // ... 其他属性
}
```

## 词条的生命周期

1. **创建阶段：** 卡牌/器官被创建时，从数据中读取 `entry` 字段
2. **应用阶段：** 卡牌/器官被玩家获得时，调用 `EntryModifier.addEntry()`
3. **生效阶段：** `onApply` 函数被调用，创建触发器等副作用
4. **移除阶段：** 卡牌/器官被失去时，调用 `EntryModifier.removeEntry()`
5. **清理阶段：** 所有移除函数被调用，清理触发器等副作用

## 注意事项

### Vue 响应式处理

EntryModifier 使用 WeakMap 存储，必须使用 `toRaw()` 处理 Vue 响应式对象：

```typescript
export function getEntryModifier(entity: Entity): EntryModifier {
    const rawEntity = toRaw(entity)  // 关键：使用 toRaw
    let modifier = entryModifierMap.get(rawEntity)
    if (!modifier) {
        modifier = initEntryModifier(rawEntity)
    }
    return modifier
}
```

### 触发器的自动管理

词条创建的触发器会在词条移除时自动清理，无需手动管理。这是通过返回移除函数数组实现的。

### 父级持有者解析

`parentOwner` 通过鸭子类型判断获取：
- Card.owner → Player/Enemy
- Organ.owner → Player/Enemy

如果实体没有 owner 属性，`parentOwner` 为 undefined。

## 相关文件

- `Entry.ts` - 词条定义
- `EntryModifier.ts` - 词条管理器
- `entryEffects.ts` - 词条效果函数
- `entryMap.ts` - 词条显示信息
- `Card.vue` - 卡牌UI组件（显示词条）
### 固有（inherent）

**描述：** 战斗开始时，必定会抽到此卡片

**实现方式：** 在 Player 上添加触发器，监听战斗开始后事件，将所有固有卡牌从抽牌堆移到手牌

**冲突词条：** 无

**特殊说明：** 使用 `onlyKey` 确保即使有多张固有卡牌，也只有一个触发器

```typescript
inherent: {
    describe: ["战斗开始时，必定会抽到此卡片"],
    onApply: (owner, parentOwner) => {
        if (!(owner instanceof Card)) return []
        if (!(parentOwner instanceof Player)) return []

        const card = owner
        const player = parentOwner

        // 在 Player 上添加触发器，监听战斗开始
        const triggerObj = createTriggerByTriggerMap(
            player, player,
            {
                when: "after",
                how: "make",
                key: "battleStart",
                onlyKey: "inherent_moveToHand",  // 确保只有一个触发器
                event: [{
                    key: "moveInherentToHand",
                    targetType: "triggerOwner",
                    effect: [{
                        key: "moveInherentToHand",
                        describe: ["固有：将固有卡牌移入手牌"],
                        params: {}
                    }]
                }]
            }
        )

        const { remove } = player.trigger.appendTrigger(triggerObj)
        return [remove]
    }
}
```

## 词条冲突机制

某些词条之间存在逻辑冲突，不能同时存在于同一个实体上。通过 `conflictsWith` 字段定义冲突关系。

### 冲突检测

当添加词条时，EntryModifier 会自动检查：
1. 词条是否已存在（不能重复添加）
2. 是否与已有词条冲突

如果检测到冲突，`addEntry` 会返回失败原因字符串。

### 冲突示例

词条冲突通常发生在它们试图修改同一个行为时。例如：
- 多个"使用后去向"词条可能冲突（如果设计为互斥）
- 多个"抽牌时机"词条可能冲突

**注意：** 消耗和虚无词条虽然都涉及移入消耗堆，但它们作用于不同时机（使用后 vs 回合结束），因此可以共存。

## 如何添加新词条

### 1. 在 Entry.ts 中定义词条

在 `entryDefinitions` 对象中添加新词条：

```typescript
export const entryDefinitions: Record<string, EntryDefinition> = {
    // ... 已有词条

    newEntry: {
        describe: ["词条描述"],
        conflictsWith: ["conflictingEntry"],  // 可选
        onApply: (owner, parentOwner) => {
            // 类型检查
            if (!(owner instanceof Card)) return []
            if (!(parentOwner instanceof Player)) return []

            // 应用效果（添加触发器、修改方法等）
            const triggerObj = createTriggerByTriggerMap(...)
            const { remove } = parentOwner.trigger.appendTrigger(triggerObj)

            // 返回移除函数数组
            return [remove]
        }
    }
}
```

### 2. 在 entryMap 中注册词条信息

在 `entryMap.ts` 中添加词条的显示信息：

```typescript
export const entryMap: Record<string, EntryInfo> = {
    // ... 已有词条

    newEntry: {
        label: "新词条",
        describe: ["词条描述"]
    }
}
```

### 3. 实现词条效果函数（如需要）

如果词条需要特殊的效果函数，在 `entryEffects.ts` 中添加：

```typescript
export const newEntryEffect: EffectFunc = (event, effect) => {
    // 效果实现
}
```

并在 `effectMap.ts` 中注册：

```typescript
export const effectMap: Record<string, EffectFunc> = {
    // ... 已有效果
    newEntryEffect
}
```

### 4. 在卡牌/器官数据中使用

在卡牌或器官的定义中添加词条：

```typescript
{
    key: "card_001",
    label: "示例卡牌",
    entry: ["newEntry"],  // 添加词条
    // ... 其他属性
}
```

## 词条的生命周期

1. **创建阶段：** 卡牌/器官被创建时，从数据中读取 `entry` 字段
2. **应用阶段：** 卡牌/器官被玩家获得时，调用 `EntryModifier.addEntry()`
3. **生效阶段：** `onApply` 函数被调用，创建触发器等副作用
4. **移除阶段：** 卡牌/器官被失去时，调用 `EntryModifier.removeEntry()`
5. **清理阶段：** 所有移除函数被调用，清理触发器等副作用

## 注意事项

### Vue 响应式处理

EntryModifier 使用 WeakMap 存储，必须使用 `toRaw()` 处理 Vue 响应式对象：

```typescript
export function getEntryModifier(entity: Entity): EntryModifier {
    const rawEntity = toRaw(entity)  // 关键：使用 toRaw
    let modifier = entryModifierMap.get(rawEntity)
    if (!modifier) {
        modifier = initEntryModifier(rawEntity)
    }
    return modifier
}
```

### 触发器的自动管理

词条创建的触发器会在词条移除时自动清理，无需手动管理。这是通过返回移除函数数组实现的。

### 父级持有者解析

`parentOwner` 通过鸭子类型判断获取：
- Card.owner → Player/Enemy
- Organ.owner → Player/Enemy

如果实体没有 owner 属性，`parentOwner` 为 undefined。

## 相关文件

- `Entry.ts` - 词条定义
- `EntryModifier.ts` - 词条管理器
- `entryEffects.ts` - 词条效果函数
- `entryMap.ts` - 词条显示信息
- `Card.vue` - 卡牌UI组件（显示词条）
