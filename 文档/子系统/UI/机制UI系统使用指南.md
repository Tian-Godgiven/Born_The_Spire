# 机制 UI 系统使用指南

## 概述

机制 UI 系统是一个完全动态的系统，允许 Mod 作者注册新的游戏机制，UI 会自动出现在正确的位置。

## 核心组件

### 1. MechanismDisplay.vue（容器组件）
- 自动读取实体的启用机制
- 根据 position 筛选并渲染对应的 UI
- 支持自定义组件

### 2. DefaultMechanismUI.vue（默认组件）
- 提供默认的显示样式：图标 + 数值
- 自动处理 showWhen 条件
- 简洁的黑边白底样式

## 使用方式

### 基础用法（使用默认 UI）

```typescript
import { registerMechanism } from '@/static/registry/mechanismRegistry'

registerMechanism({
    key: "armor",
    label: "护甲",
    icon: "🛡️",

    data: {
        location: "current",
        key: "armor",
        defaultValue: 0
    },

    logic: {
        absorbDamage: { /* ... */ }
    },

    // UI 配置 - 就这么简单！
    ui: {
        position: "healthBarRight",      // 显示在血条右侧
        showWhen: (value) => value > 0   // 只在值 > 0 时显示
    }
})
```

**结果：** UI 自动出现在血条右侧，显示为 `🛡️ 5`

### 高级用法（自定义 UI 组件）

如果你需要特殊的显示效果（如进度条、动画等），可以提供自定义组件：

```typescript
// 1. 创建自定义组件
// MyCustomMechanismUI.vue
<template>
<div class="custom-ui">
    <div class="progress-bar" :style="{ width: percentage + '%' }"></div>
    <span>{{ config.label }}: {{ currentValue }}/{{ maxValue }}</span>
</div>
</template>

<script setup lang='ts'>
import { Entity } from '@/core/objects/system/Entity'
import { MechanismConfig } from '@/core/types/MechanismConfig'
import { computed } from 'vue'

const { entity, config } = defineProps<{
    entity: Entity
    config: MechanismConfig
}>()

const storageKey = config.data.key || config.key
const currentValue = computed(() => entity.current[storageKey]?.value ?? 0)
const maxValue = computed(() => entity.status.maxShield?.value ?? 100)
const percentage = computed(() => (currentValue.value / maxValue.value) * 100)
</script>

// 2. 注册机制时指定自定义组件
import MyCustomMechanismUI from './MyCustomMechanismUI.vue'

registerMechanism({
    key: "mod_mymod_energyshield",
    label: "能量护盾",
    icon: "⚡",

    data: { /* ... */ },
    logic: { /* ... */ },

    ui: {
        position: "healthBarRight",
        component: MyCustomMechanismUI  // 使用自定义组件
    }
})
```

## 可用的显示位置

```typescript
type UIPosition =
    | "characterTop"      // 角色头顶
    | "characterBottom"   // 角色底部
    | "characterLeft"     // 角色左侧
    | "characterRight"    // 角色右侧
    | "healthBarRight"    // 血条右侧（推荐用于护甲类机制）
    | "sidebar"           // 侧边栏
    | "topBar"            // 顶部栏
    | "custom"            // 完全自定义（需要自己处理定位）
```

## Mod 作者工作流

### 添加新机制的完整流程

```typescript
// 1. 注册机制（一次性配置）
registerMechanism({
    key: "mod_mymod_block",
    label: "格挡层数",
    icon: "🛡",
    description: "每层格挡抵消1次伤害",

    data: {
        location: "current",
        defaultValue: 0
    },

    logic: {
        absorbDamage: {
            enabled: true,
            priority: 90,
            absorb: (blockValue, damageAmount, event) => {
                // 每层格挡抵消1次伤害，不管伤害多少
                if (blockValue > 0) {
                    // 减少1层格挡
                    return damageAmount  // 完全吸收这次伤害
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

// 2. 创建相关效果
export const gainBlock: EffectFunc = (event, effect) => {
    const target = event.target as Target
    const amount = effect.params.value || 0

    if (target.current.block) {
        target.current.block.value += amount
    }
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
    key: "mod_mymod_card_block",
    status: { cost: 1, block: 3 },
    describe: ["获得", { key: ["status", "block"] }, "层格挡"],
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{ key: "gainBlock", params: { value: 3 } }]
        }
    }
})
```

**完成！** 你的新机制现在：
- ✅ 有完整的游戏逻辑
- ✅ UI 自动显示在正确位置
- ✅ 可以被卡牌/器官/遗物使用
- ✅ 不需要修改任何核心代码

## 多个机制共存

系统自动处理多个机制在同一位置的显示：

```vue
<!-- 如果同时启用了护甲和能量护盾 -->
<MechanismDisplay :entity="target" position="healthBarRight" />
<!-- 自动渲染为：🛡️ 5  ⚡ 10 -->
```

## 技术细节

### 组件通信

- `MechanismDisplay` 接收 `entity` 和 `position`
- 自动查询 `entity.mechanisms.getEnabledMechanisms()`
- 对每个机制，传递 `entity` 和 `config` 给子组件
- 子组件负责读取数据和渲染

### 响应式更新

- 机制值存储在 `entity.current[key]` 或 `entity.status[key]`
- 这些字段是 Vue 响应式的（ref）
- UI 自动更新，无需手动触发

### 性能考虑

- `getEnabledMechanisms()` 返回缓存的列表
- 只有机制启用/禁用时才重新计算
- 每个位置独立渲染，不影响其他位置

## 示例：完整的能量护盾机制

```typescript
// 能量护盾：持续多回合，只吸收50%伤害
registerMechanism({
    key: "mod_example_energyshield",
    label: "能量护盾",
    icon: "⚡",
    description: "吸收50%伤害，持续3回合",

    data: {
        location: "current",
        key: "energyshield",
        defaultValue: 0
    },

    logic: {
        absorbDamage: {
            enabled: true,
            priority: 80,  // 低于护甲，先消耗护甲
            absorb: (shieldValue, damageAmount, event) => {
                const absorbAmount = Math.min(shieldValue, damageAmount * 0.5)
                return absorbAmount
            }
        },
        clear: {
            duration: 3  // 持续3回合
        }
    },

    ui: {
        position: "healthBarRight",
        showWhen: (value) => value > 0,
        icon: "⚡"
    }
})
```

## 总结

机制 UI 系统的设计哲学：
- **声明式配置** - 描述你想要什么，而不是如何实现
- **零侵入** - 不需要修改核心 UI 代码
- **高度可扩展** - 支持无限数量的自定义机制
- **Mod 友好** - 简单的 API，强大的功能
