# 机制系统 Mechanism

机制系统是一个可扩展的游戏机制框架，允许为实体添加自定义的游戏机制（如护甲、格挡、能量护盾等），并自动处理数据存储、逻辑触发和 UI 显示。

## 核心概念

机制 Mechanism 是一种可以附加到实体上的游戏规则，包含三个部分：
  数据层：存储机制的数值（如护甲值）
  逻辑层：定义机制如何影响游戏（如吸收伤害）
  UI层：定义机制如何显示给玩家

机制系统的设计目标：
  声明式配置：通过配置对象定义机制，无需编写复杂代码
  自动化管理：数据存储、触发器生成、UI 显示全部自动处理
  高度可扩展：Mod 作者可以轻松添加新机制，无需修改核心代码

## 机制配置

### 基本结构

```typescript
interface MechanismConfig {
    key: string                    // 机制唯一标识
    label: string                  // 机制显示名称
    icon?: string                  // 机制图标（emoji 或图片路径）
    description?: string           // 机制描述

    data: {
        location: "current" | "status"  // 数据存储位置
        key?: string                    // 存储键名（默认使用 key）
        defaultValue: number            // 默认值
    }

    logic?: {
        absorbDamage?: AbsorbDamageConfig  // 伤害吸收逻辑
        clear?: ClearBehavior              // 清除行为
        voting?: VotingConfig              // 投票机制
    }

    ui?: {
        position: UIPosition           // UI 显示位置
        component?: Component          // 自定义 UI 组件
        showWhen?: (value: number) => boolean  // 显示条件
    }
}
```

### 数据存储

机制的数值可以存储在两个位置：

**current（当前值）**
  用于频繁变化的数值（如护甲、能量）
  使用 Current 类管理，支持最小/最大值限制
  示例：护甲值、格挡层数

**status（属性）**
  用于相对稳定的属性（如最大护甲值）
  使用 Status 类管理，支持修饰器系统
  示例：最大能量、护甲上限

```typescript
// 存储在 current
data: {
    location: "current",
    key: "armor",
    defaultValue: 0
}
// 访问：entity.current.armor.value

// 存储在 status
data: {
    location: "status",
    key: "maxArmor",
    defaultValue: 100
}
// 访问：entity.status.maxArmor.value
```

### 伤害吸收逻辑

机制可以定义如何吸收伤害：

```typescript
logic: {
    absorbDamage: {
        enabled: true,              // 是否启用
        priority: 100,              // 优先级（越高越先执行）
        absorb: (mechanismValue, damageAmount, event) => {
            // 返回实际吸收的伤害量
            const absorbed = Math.min(mechanismValue, damageAmount)
            return absorbed
        }
    }
}
```

**执行流程**
  当实体受到伤害时，按优先级从高到低执行所有启用的吸收逻辑
  每个逻辑返回吸收的伤害量
  机制值自动减少相应的吸收量
  最终伤害 = 原始伤害 - 总吸收量

**优先级建议**
  护甲类：100（最先吸收）
  护盾类：80-90
  特殊机制：50-70

### 清除行为

机制可以定义何时清除数值：

```typescript
logic: {
    clear: {
        onTurnStart: true,    // 回合开始时清除
        onTurnEnd: true,      // 回合结束时清除
        onBattleEnd: true,    // 战斗结束时清除
        duration: 3           // 持续回合数（3回合后清除）
    }
}
```

**清除时机**
  onTurnStart：在实体回合开始时清除（适合护甲类）
  onTurnEnd：在实体回合结束时清除
  onBattleEnd：在战斗结束时清除
  duration：持续指定回合数后清除

**实现原理**
  系统自动为实体添加对应的触发器
  触发器在指定时机将机制值重置为 0
  无需手动编写触发器代码

### 投票机制

机制可以参与游戏中的投票决策：

```typescript
logic: {
    voting: {
        voteType: "damageReduction",  // 投票类型
        vote: (mechanismValue, context) => {
            // 返回投票值
            return mechanismValue * 0.5
        }
    }
}
```

## 注册机制

### 全局注册

使用 `registerMechanism` 函数注册机制：

```typescript
import { registerMechanism } from '@/static/registry/mechanismRegistry'

registerMechanism({
    key: "armor",
    label: "护甲",
    icon: "🛡️",
    description: "吸收伤害，回合开始时清除",

    data: {
        location: "current",
        key: "armor",
        defaultValue: 0
    },

    logic: {
        absorbDamage: {
            enabled: true,
            priority: 100,
            absorb: (armorValue, damageAmount) => {
                return Math.min(armorValue, damageAmount)
            }
        },
        clear: {
            onTurnStart: true
        }
    },

    ui: {
        position: "healthBarRight",
        showWhen: (value) => value > 0
    }
})
```

### 为实体启用机制

注册后，需要为具体实体启用机制：

```typescript
import { enableMechanismForEntity } from '@/static/registry/mechanismRegistry'

// 为玩家启用护甲机制
enableMechanismForEntity(player, "armor")

// 为敌人启用护甲机制
enableMechanismForEntity(enemy, "armor")
```

**启用时发生的事情**
  创建数据存储（Current 或 Status 实例）
  生成并挂载触发器（如清除触发器、伤害吸收触发器）
  将机制添加到实体的 mechanisms 列表
  UI 自动显示（如果配置了 ui）

## 使用机制

### 修改机制值

通过效果系统修改机制值：

```typescript
// 创建获得护甲的效果函数
export const gainArmor: EffectFunc = (event, effect) => {
    const amount = effect.params.value || 0
    if (amount <= 0) return

    handleEventEntity(event.target, (target) => {
        const t = target as Target
        if (!t.current.armor) {
            console.warn(`${t.label} 没有护甲机制`)
            return
        }
        t.current.armor.value += amount
        newLog([`${t.label} 获得了 ${amount} 点护甲`])
    })
}

// 在卡牌中使用
{
    label: "防御",
    key: "defense_card",
    status: { cost: 1, armor: 5 },
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{
                key: "gainArmor",
                params: { value: 5 }
            }]
        }
    }
}
```

### 读取机制值

```typescript
// 读取当前护甲值
const armorValue = entity.current.armor?.value ?? 0

// 读取最大护甲值（如果存储在 status）
const maxArmor = entity.status.maxArmor?.value ?? 100

// 检查是否启用了某个机制
const hasArmor = entity.mechanisms.hasMechanism("armor")
```

## 内置机制示例

### 护甲机制

```typescript
registerMechanism({
    key: "armor",
    label: "护甲",
    icon: "🛡️",
    description: "吸收伤害，回合开始时清除",

    data: {
        location: "current",
        key: "armor",
        defaultValue: 0
    },

    logic: {
        absorbDamage: {
            enabled: true,
            priority: 100,
            absorb: (armorValue, damageAmount) => {
                return Math.min(armorValue, damageAmount)
            }
        },
        clear: {
            onTurnStart: true
        }
    },

    ui: {
        position: "healthBarRight",
        showWhen: (value) => value > 0
    }
})
```

**特点**
  完全吸收伤害，直到护甲耗尽
  优先级最高（100），最先吸收伤害
  回合开始时清除，适合临时防御

## 相关文件

核心逻辑
  `src/core/types/MechanismConfig.ts` - 类型定义
  `src/core/objects/system/mechanism/MechanismManager.ts` - 机制管理器
  `src/static/registry/mechanismRegistry.ts` - 全局注册表

UI 组件
  `src/ui/components/display/MechanismDisplay.vue` - 机制显示容器
  `src/ui/components/display/DefaultMechanismUI.vue` - 默认 UI 组件

效果函数
  `src/core/effects/gainArmor.ts` - 获得护甲效果

## 注意事项

**数据存储位置选择**
  频繁变化的值用 current（如护甲值）
  相对稳定的值用 status（如最大值、上限）
  current 支持最小/最大值限制
  status 支持修饰器系统

**触发器自动生成**
  清除行为会自动生成触发器
  伤害吸收会自动生成 before_take_damage 触发器
  无需手动编写触发器代码
  触发器在机制启用时自动挂载

**优先级设计**
  多个机制可以同时吸收伤害
  按优先级从高到低依次执行
  每个机制只吸收剩余伤害
  合理设置优先级避免冲突

**UI 自动显示**
  配置 ui 后，UI 会自动显示在指定位置
  使用 showWhen 控制显示条件
  支持自定义 UI 组件
  详见《机制UI系统使用指南.md》

**Mod 友好设计**
  所有机制通过注册表管理
  Mod 可以注册新机制
  Mod 可以为任何实体启用机制
  无需修改核心代码

## 完整示例：格挡机制

```typescript
// 1. 注册机制
registerMechanism({
    key: "block",
    label: "格挡",
    icon: "🛡",
    description: "每层格挡抵消1次伤害，不论伤害多少",

    data: {
        location: "current",
        key: "block",
        defaultValue: 0
    },

    logic: {
        absorbDamage: {
            enabled: true,
            priority: 90,
            absorb: (blockValue, damageAmount, event) => {
                // 每层格挡完全抵消一次伤害
                if (blockValue > 0) {
                    return damageAmount  // 完全吸收
                }
                return 0
            }
        },
        clear: {
            onTurnEnd: true
        }
    },

    ui: {
        position: "healthBarRight",
        showWhen: (value) => value > 0
    }
})

// 2. 创建效果函数
export const gainBlock: EffectFunc = (event, effect) => {
    const amount = effect.params.value || 0
    handleEventEntity(event.target, (target) => {
        const t = target as Target
        if (t.current.block) {
            t.current.block.value += amount
            newLog([`${t.label} 获得了 ${amount} 层格挡`])
        }
    })
}

// 3. 注册效果到 effectMap
effectMap.push({
    label: "获得格挡",
    key: "gainBlock",
    effect: gainBlock
})

// 4. 创建使用该机制的卡牌
cardList.push({
    label: "格挡",
    key: "block_card",
    status: { cost: 1, block: 3 },
    describe: ["获得", { key: ["status", "block"] }, "层格挡"],
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{ key: "gainBlock", params: { value: 3 } }]
        }
    }
})

// 5. 为玩家启用机制
enableMechanismForEntity(player, "block")
```

完成后：
  玩家可以使用格挡卡牌获得格挡层数
  每层格挡完全抵消一次伤害
  格挡在回合结束时清除
  UI 自动显示在血条右侧
