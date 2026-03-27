# 反应系统 Reaction System

反应系统是触发器系统的重要补充，实现了"触发器仅通知，行为由来源定义"的设计原则。

## 核心概念

在旧的触发器系统中，触发器的 callback 中直接定义了响应行为，这导致：

问题：触发器来源（如遗物/器官）无法定义自己的响应行为
  触发器挂载在玩家身上，但行为应该由遗物/器官定义
  响应逻辑分散在触发器中，难以管理和复用

解决方案：分离关注点
  触发器（Trigger）：负责"何时通知" - 监听事件并调用 action
  反应（Reaction）：负责"如何响应" - 定义 action 对应的行为

## 反应结构

反应是 action 名称到事件配置数组的映射：

```typescript
{
    reaction: {
        "actionName": [
            {
                key: string,                        // 新事件的key
                label?: string,                     // 标签
                info?: Record<string, any>,         // 事件信息
                targetType: TriggerEventConfig["targetType"],
                mediumType?: TriggerEventConfig["mediumType"],
                effect: EffectUnit[]                // 效果单元数组
            }
        ]
    }
}
```

## 数据流

```mermaid
graph LR
    A[事件发生] --> B[ActionEvent]
    B --> C{触发器检查}
    C -->|when/how/key匹配| D[source.reaction[action]]
    D --> E[executeReactionEvents]
    E --> F[解析targetType]
    E --> G[解析mediumType]
    E --> H[执行effect]
    H --> I[创建新事件]
    I --> J[递归执行]
```

### 数据流说明

1. 事件发生时，触发器检查 when/how/key 是否匹配
2. 匹配成功后，调用 source.reaction[actionName]
3. executeReactionEvents 解析并执行反应配置
4. 根据 targetType 和 mediumType 创建新事件
5. 新事件被收集并递归执行

## 反应配置详解

### 基础示例

遗物"回血石"在战斗结束时回复玩家生命：

```typescript
{
    key: "original_relic_00001",
    label: "回血石",
    describe: ["战斗结束时", "回复", { key: ["status", "heal"] }, "生命"],
    status: {
        "heal": 5
    },
    interaction: {
        possess: {
            target: { key: "owner" },
            effects: [],
            triggers: [{
                when: "after",       // 事件执行后
                how: "make",         // 当owner发起此事件
                key: "battleEnd",    // 监听战斗结束事件
                action: "healOwner"  // 调用owner的healOwner反应
            }],
            reaction: {
                healOwner: [{
                    targetType: "owner",     // 目标是拥有者
                    key: "heal",           // 创建 heal 事件
                    effect: [{
                        key: "heal",
                        params: { value: 5 } // 回复5点生命
                    }]
                }]
            }
        }
    }
}
```

### targetType 详解

targetType 指定反应创建的新事件的目标：

```typescript
// eventSource: 原始事件的来源
targetType: "eventSource"
// 例：敌人造成的伤害，目标设为 eventSource 则伤害 enemies

// eventMedium: 原始事件的媒介
targetType: "eventMedium"
// 例：卡牌效果，目标设为 eventMedium 则作用于卡牌

// eventTarget: 原始事件的目标
targetType: "eventTarget"
// 例：玩家受到伤害，目标设为 eventTarget 则作用于 player

// triggerSource: 触发器的来源对象
targetType: "triggerSource"
// 例：遗物/器官作为 triggerSource

// owner / triggerOwner: 持有触发器的对象（默认）
targetType: "owner"
// 例：player 拥有遗物，目标即为 player

// triggerEffect: 触发该触发器的效果对象
targetType: "triggerEffect"
// 例：damage 效果本身可以作为 target

// randomEnemy: 随机存活敌人
targetType: "randomEnemy"
// 例：随机对一个敌人造成伤害

// Entity: 指定对象
targetType: { participantType: "entity", key: "player" }
```

### mediumType 详解

mediumType 指定反应创建的新事件的媒介：

```typescript
// source: 使用 trigger 的 source（遗物/器官）
mediumType: "source"

// target: 使用 trigger 的 target（拥有者）
mediumType: "target"

// triggerEventMedium: 使用原始事件的 medium
mediumType: "triggerEventMedium"

// triggerEffect: 使用触发效果
mediumType: "triggerEffect"
```

未指定时默认为 "target"（即 owner）。

### 使用 $triggerValue 参数

反应中的 effect params 可以使用 $triggerValue 引用触发事件的值：

```typescript
reaction: {
    modifyDamage: [{
        targetType: "eventSource",
        key: "modifyEvent",
        effect: [{
            key: "reduceDamage",
            params: { value: "$triggerValue" }  // 引用触发事件的 damage 值
        }]
    }]
}
```

## 常见反应模式

### 模式1：被动增益

当拥有者受到伤害时，减少伤害：

```typescript
reaction: {
    reduceDamage: [{
        targetType: "owner",
        key: "modifyEvent",
        effect: [{
            key: "reduceDamage",
            params: { value: 2 }  // 减少2点伤害
        }]
    }]
}
```

挂载触发器：
```typescript
{
    when: "before",
    how: "take",
    key: "damage",
    action: "reduceDamage"
}
```

### 模式2：事件响应

当回合开始时，恢复能量：

```typescript
reaction: {
    recoverEnergy: [{
        targetType: "owner",
        key: "recoverEnergy",
        effect: [{
            key: "getEnergy",
            params: { value: "max" }  // 恢复最大能量
        }]
    }]
}
```

挂载触发器：
```typescript
{
    when: "after",
    how: "make",
    key: "turnStart",
    action: "recoverEnergy"
}
```

### 模式3：效果修改

当造成伤害时，增加伤害：

```typescript
reaction: {
    increaseDamage: [{
        targetType: "triggerEffect",  // 作用于 damage 效果本身
        key: "modifyEvent",
        effect: [{
            key: "addDamage",
            params: { value: "$triggerValue" }  // 触发事件的 damage 值
        }]
    }]
}
```

挂载触发器：
```typescript
{
    when: "before",
    how: "make",
    key: "damage",
    action: "increaseDamage"
}
```

### 模式4：随机目标

当使用卡牌时，随机对一个敌人造成额外伤害：

```typescript
reaction: {
    randomDamage: [{
        targetType: "randomEnemy",  // 随机敌人
        key: "damageEvent",
        effect: [{
            key: "damage",
            params: { value: 3 }  // 造成3点伤害
        }]
    }]
}
```

挂载触发器：
```typescript
{
    when: "after",
    how: "via",
    key: "useCard",
    action: "randomDamage"
}
```

### 模式5：条件响应

当生命值低于 50% 时，增加伤害：

```typescript
reaction: {
    powerWhenLowHP: [{
        targetType: "owner",
        key: "addStatus",
        effect: [{
            key: "addStatus",
            params: {
                key: "damage",
                value: 5
            }
        }]
    }]
}
```

挂载触发器（带 condition）：
```typescript
{
    when: "after",
    how: "take",
    key: "damage",
    action: "powerWhenLowHP",
    condition: {
        ownerHealthPercent: {
            value: 0.5,
            op: "lte"  // 生命 ≤ 50% 时触发
        }
    }
}
```

## 反应与 CardModifier/ItemModifier

反应系统通过 CardModifier/ItemModifier 自动挂载和卸载：

```typescript
// ItemModifier.ts
export function mountPossessTrigger(
    entity: Entity,
    item: Item,
    source: Entity,
    target: Entity
): void {
    const triggers = item.interaction?.possess?.triggers
    if (!triggers) return

    for (const triggerDef of triggers) {
        // 使用新的 action/reaction 模式
        const reactionEvents = item.reaction?.[triggerDef.action]
        if (!reactionEvents) {
            console.error(`触发器 action "${triggerDef.action}" 在 item 上找不到对应的 reaction`, item)
            return
        }

        for (const eventConfig of reactionEvents) {
            createEventFromTriggerConfig({
                source: item,
                medium: item,
                target: resolveTriggerEventTarget(eventConfig.targetType),
                effect: eventConfig.effect
            })
        }
    }
}
```

## 与旧触发器系统的对比

### 旧系统（回调模式）

```typescript
// 问题：响应逻辑分散在 trigger 中
player.trigger.appendTrigger({
    when: "after",
    how: "make",
    key: "battleEnd",
    action: "heal",  // 注意：旧版使用 callback
    callback: (event) => {
        player.current.health.value += 5  // 直接修改状态
    }
})
```

问题：
  回调中直接修改状态，绕过效果系统
  触发器来源无法定义响应行为
  逻辑分散，难以复用

### 新系统（反应模式）

```typescript
// 正确：使用 action + reaction
{
    interaction: {
        possess: {
            triggers: [{
                when: "after",
                how: "make",
                key: "battleEnd",
                action: "heal"
            }],
            reaction: {
                heal: [{
                    targetType: "owner",
                    key: "healEvent",
                    effect: [{
                        key: "heal",
                        params: { value: 5 }
                    }]
                }]
            }
        }
    }
}
```

优势：
  通过效果系统修改状态
  响应行为在来源（遗物）中定义
  逻辑集中，易于复用
  支持数据驱动配置

## 系统集成

### 效果系统

反应创建的事件通过 doEvent 创建，完全集成效果系统：

```typescript
// 在 executeReactionEvents 中
doEvent({
    key: eventKey,
    source: source,
    medium: eventMedium,
    target: eventTarget,
    info: info,
    effectUnits: resolvedEffects
})
```

### 修饰器系统

反应中的事件会自动响应 modifier：

```typescript
// 例子：器官增加 maxHealth
organ.onAcquire = () => {
    addStatusModifier(player, "maxHealth", { value: 10 })
}

// 当 player 的 health 触发 before take heal 时
// modifier 会自动增加 healing 值
```

### 触发器层级

反应创建的事件会触发新的触发器，形成触发器链：

```
battleEnd (by player)
  → relic.reaction["healOwner"]
    → healEvent (to player)
      → player.trigger["before take heal"]
        → player modifier: +2 healing
      → heal effect: 5 + 2 = 7
      → player.trigger["after take heal"]
```

## 注意事项

1. **action 必须存在于 reaction 中**
   - 触发器的 action 必须在 source.reaction 中有对应定义
   - 否则会报错：触发器 action XXX 在 source 上找不到对应的 reaction

2. **targetType 默认解析**
   - owner / triggerOwner 默认解析为挂载触发器的对象
   - triggerSource 解析为来源对象（遗物/器官）
   - 确保 targetType 与实际需求一致

3. **mediumType 默认值**
   - 未指定时默认为 "target"（即 owner）
   - 需要指定 medium 时显式设置 mediumType

4. **性能考虑**
   - reaction 在每次触发时都会解析
   - 避免过深的事件嵌套
   - 使用 condition 限制不必要的触发

5. **调试技巧**
   - 使用控制台查看反应配置：console.log(player.reaction)
   - 检查触发器 action：console.log(item.interaction.possess.triggers)
   - 查看事件创建：监听 doEvent

## 迁移指南

### 从旧触发器迁移到新系统

旧代码：
```typescript
player.trigger.appendTrigger({
    when: "after",
    how: "make",
    key: "battleEnd",
    callback: (event) => {
        // ...
    }
})
```

新代码：
```typescript
// 在遗物/器官/玩家定义中
{
    interaction: {
        possess: {
            triggers: [{
                when: "after",
                how: "make",
                key: "battleEnd",
                action: "myAction"
            }],
            reaction: {
                myAction: [{
                    targetType: "owner",
                    key: "myEvent",
                    effect: [{ key: "myEffect", params: {...} }]
                }]
            }
        }
    }
}
```

### 从 event 配置迁移到 action + reaction

旧配置：
```typescript
triggers: [{
    when: "after",
    how: "make",
    key: "battleEnd",
    event: [{  // 旧版直接定义事件
        targetType: "owner",
        key: "heal",
        effect: [{ key: "heal", params: { value: 5 } }]
    }]
}]
```

新配置：
```typescript
triggers: [{
    when: "after",
    how: "make",
    key: "battleEnd",
    action: "heal"  // 仅指定 action
}],
reaction: {
    heal: [{  // 分离到 reaction
        targetType: "owner",
        key: "heal",
        effect: [{ key: "heal", params: { value: 5 } }]
    }]
}
```
