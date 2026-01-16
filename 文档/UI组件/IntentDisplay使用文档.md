# IntentDisplay 组件使用文档

意图显示组件，用于显示敌人的行动意图。

## 位置

`src/ui/components/display/IntentDisplay.vue`

## 功能

- 显示敌人的意图类型（攻击/防御/增益/减益/特殊/未知）
- 显示意图值（伤害/格挡数值）
- 显示多段攻击次数
- 悬停显示详细信息
- 支持不同的可见性等级
- 意图改变时的动画效果

## Props

```typescript
{
    intent?: Intent  // 意图对象（可选）
}
```

## Intent 类型

```typescript
type Intent = {
    type: IntentType            // 意图类型
    value?: number              // 显示值（伤害/格挡）
    count?: number              // 攻击次数
    actions: Card[]             // 实际要执行的卡牌
    visibility?: IntentVisibility  // 可见性等级
}

type IntentType =
    | 'attack'    // 攻击
    | 'defend'    // 防御
    | 'buff'      // 增益
    | 'debuff'    // 减益
    | 'special'   // 特殊
    | 'unknown'   // 未知

type IntentVisibility =
    | 'hidden'    // 完全隐藏
    | 'type'      // 只显示类型
    | 'range'     // 显示范围
    | 'exact'     // 显示精确值（默认）
```

## 使用示例

### 基础使用

```vue
<template>
<div class="enemy-card">
    <div class="enemy-name">{{ enemy.label }}</div>
    <div class="enemy-health">{{ enemy.current.health.value }}</div>

    <!-- 显示意图 -->
    <IntentDisplay :intent="enemy.intent" />
</div>
</template>

<script setup lang="ts">
import IntentDisplay from '@/ui/components/display/IntentDisplay.vue'
import type { Enemy } from '@/core/objects/target/Enemy'

const props = defineProps<{
    enemy: Enemy
}>()
</script>
```

### 在敌人列表中使用

```vue
<template>
<div class="enemy-list">
    <div v-for="enemy in enemies" :key="enemy.__id" class="enemy-item">
        <div class="enemy-info">
            <div class="enemy-name">{{ enemy.label }}</div>
            <div class="enemy-hp">
                {{ enemy.current.health.value }} / {{ enemy.status['max-health'].value }}
            </div>
        </div>

        <!-- 意图显示 -->
        <IntentDisplay :intent="enemy.intent" />
    </div>
</div>
</template>

<script setup lang="ts">
import IntentDisplay from '@/ui/components/display/IntentDisplay.vue'
import type { Enemy } from '@/core/objects/target/Enemy'

const props = defineProps<{
    enemies: Enemy[]
}>()
</script>
```

### 意图改变动画

当敌人意图改变时，可以添加动画类：

```vue
<template>
<div class="enemy-card">
    <IntentDisplay
        :intent="enemy.intent"
        :class="{ 'intent-changing': isIntentChanging }"
    />
</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import IntentDisplay from '@/ui/components/display/IntentDisplay.vue'
import type { Enemy } from '@/core/objects/target/Enemy'

const props = defineProps<{
    enemy: Enemy
}>()

const isIntentChanging = ref(false)

// 监听意图变化
watch(() => props.enemy.intent, (newIntent, oldIntent) => {
    if (newIntent && oldIntent && newIntent !== oldIntent) {
        // 触发动画
        isIntentChanging.value = true
        setTimeout(() => {
            isIntentChanging.value = false
        }, 600)  // 动画持续时间
    }
})
</script>
```

## 样式定制

### 意图类型颜色

组件已经为不同的意图类型定义了颜色：

- **攻击** (attack): 红色 `#d32f2f`
- **防御** (defend): 蓝色 `#1976d2`
- **增益** (buff): 绿色 `#388e3c`
- **减益** (debuff): 橙色 `#f57c00`
- **特殊** (special): 紫色 `#7b1fa2`
- **未知** (unknown): 灰色 `#616161`

### 自定义样式

可以通过覆盖 CSS 变量来自定义样式：

```vue
<style scoped>
.enemy-card :deep(.intent-display) {
    /* 自定义意图显示的大小 */
    .intent-main {
        padding: 8px 12px;
        min-width: 60px;
    }

    .intent-icon {
        font-size: 24px;
    }

    .intent-value {
        font-size: 18px;
    }
}
</style>
```

## 可见性等级示例

### 完全隐藏 (hidden)

```typescript
enemy.setIntent(cards, 'hidden')
// 不显示任何内容
```

### 只显示类型 (type)

```typescript
enemy.setIntent(cards, 'type')
// 只显示图标，不显示数值
// 例如：⚔️ （攻击）
```

### 显示范围 (range)

```typescript
enemy.setIntent(cards, 'range')
// 显示估算范围
// 例如：⚔️ 8-12 （实际值为 10）
```

### 显示精确值 (exact) - 默认

```typescript
enemy.setIntent(cards, 'exact')
// 或
enemy.setIntent(cards)
// 显示精确数值
// 例如：⚔️ 10
```

## 意图图标

组件使用 emoji 作为意图图标：

- ⚔️ 攻击
- 🛡️ 防御
- ↑ 增益
- ↓ 减益
- ✨ 特殊
- ? 未知

可以根据需要替换为自定义图标或图片。

## 工具提示

悬停在意图上时会显示详细信息：

```
攻击
造成 10 点伤害
攻击 2 次
```

## 注意事项

1. **意图对象可选** - 如果敌人没有意图，组件不会显示任何内容
2. **响应式更新** - 意图对象的变化会自动更新显示
3. **最终值显示** - 显示的数值已经包含了 Buff 影响（通过事件模拟计算）
4. **动画效果** - 意图改变时建议添加动画，提升用户体验

## 相关文件

- `Intent.ts` - 意图类型定义
- `Enemy.ts` - 敌人类（包含 intent 属性）
- `EnemyBehavior.ts` - 敌人行为系统
- `SimulateEvent.ts` - 事件模拟系统

## Display 组件系列

意图显示组件是 Display 组件系列的一部分，其他组件包括：

- `EntryDisplay.vue` - 词条显示
- `StateDisplay.vue` - 状态显示
- `IntentDisplay.vue` - 意图显示（本组件）

所有 Display 组件都遵循相同的设计风格：
- 简洁的黑色边框
- 白色背景
- 悬停显示详情
- 无阴影效果
