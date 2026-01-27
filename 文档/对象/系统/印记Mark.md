# 印记系统 (Mark System)

印记是玩家在游戏中获得的特殊标记，具有独特的效果。

## 基本信息

印记是一个独立的体系，支持Mod作者自定义印记和效果。

获得方式
  水池染血（已实现）
  击败强化精英（待实现）
  宝箱中选择印记而非遗物（待实现）

UI显示
  印记会在左上角玩家名称旁显示文本标记
  文本颜色可配置
  支持渐显动画（2秒）

## 印记配置

### MarkConfig 接口

```typescript
interface MarkConfig {
  key: string                    // 印记唯一标识
  name: string                   // 印记名称
  description: string            // 印记描述

  displayText: string            // 左上角显示的文本
  displayColor: string           // 文本颜色

  statusKey: string              // 对应的 status key

  onGain?: {
    key: string                  // 事件key
    effectUnits: EffectUnit[]    // 效果列表
  }

  triggers?: TriggerConfig[]     // 印记的被动效果
}
```

配置说明
  key：印记唯一标识，如 "mark_blood"
  name：印记名称，如 "红色印记"
  description：印记描述，如 "最大生命值 -10"
  displayText：UI显示的文本，如 "已染血"
  displayColor：文本颜色，如 "red"
  statusKey：对应的 status key，用于存储印记状态（0或1）
  onGain：获得印记时触发的事件和效果
  triggers：印记的被动效果（通过触发器实现）

### 示例配置

红色印记（染血）

```typescript
{
  key: "mark_blood",
  name: "红色印记",
  description: "最大生命值 -10",
  displayText: "已染血",
  displayColor: "red",
  statusKey: "ifBloodMark",
  onGain: {
    key: "bloodMark",
    effectUnits: [{
      key: "addStatusBaseCurrentValue",
      params: {
        value: -10,
        statusKey: "max-health",
        currentKey: "health"
      }
    }]
  }
}
```

## 印记注册

### 注册表

位置：`src/static/registry/markRegistry.ts`

```typescript
import { markRegistry } from '@/static/registry/markRegistry'

// 注册单个印记
markRegistry.registerMark(markConfig)

// 批量注册印记
markRegistry.registerMarks([mark1, mark2, mark3])

// 获取印记配置
const mark = markRegistry.getMark("mark_blood")

// 获取所有印记
const allMarks = markRegistry.getAllMarks()
```

### 印记列表

位置：`src/static/list/mark/markList.ts`

所有印记配置定义在此文件中，在应用启动时自动注册。

```typescript
export const markList: MarkConfig[] = [
  {
    key: "mark_blood",
    name: "红色印记",
    // ...
  },
  // 添加更多印记...
]
```

## 印记操作

### 工具函数

位置：`src/core/hooks/mark.ts`

玩家获得印记

```typescript
import { gainMark } from '@/core/hooks/mark'

gainMark(player, "mark_blood")
```

功能
  检查是否已拥有该印记
  设置印记 status 为 1
  触发 onGain 事件和效果
  显示日志

检查玩家是否拥有印记

```typescript
import { hasMark } from '@/core/hooks/mark'

if (hasMark(player, "mark_blood")) {
  // 玩家已拥有红色印记
}
```

获取玩家拥有的所有印记

```typescript
import { getPlayerMarks } from '@/core/hooks/mark'

const marks = getPlayerMarks(player)  // ["mark_blood", "mark_elite"]
```

获取玩家拥有的印记数量

```typescript
import { countPlayerMarks } from '@/core/hooks/mark'

const count = countPlayerMarks(player)  // 2
```

## UI 显示

### 动态显示印记

位置：`src/ui/page/Scene/running/Top/index.vue`

UI 会自动遍历所有注册的印记，检查玩家是否拥有，并动态显示。

```typescript
import { markRegistry } from '@/static/registry/markRegistry'

const stateList = computed(() => {
  const states: Array<{text: string, color: string}> = []

  // 遍历所有注册的印记
  const allMarks = markRegistry.getAllMarks()
  for (const mark of allMarks) {
    // 检查玩家是否拥有该印记
    if (getStatusValue(nowPlayer, mark.statusKey, 0) === 1) {
      states.push({
        text: mark.displayText,
        color: mark.displayColor
      })
    }
  }

  return states
})
```

优点
  自动支持所有注册的印记
  Mod作者只需注册印记配置，UI自动显示
  不需要修改UI代码

## 相关文件

类型定义：`src/core/types/MarkConfig.ts`
注册表：`src/static/registry/markRegistry.ts`
印记列表：`src/static/list/mark/markList.ts`
工具函数：`src/core/hooks/mark.ts`
UI显示：`src/ui/page/Scene/running/Top/index.vue`
初始化：`src/main.ts`

## 注意事项

印记状态存储
  印记通过 status 存储状态（0或1）
  每个印记对应一个唯一的 statusKey
  使用 ensureStatusExists 确保 status 存在

印记效果实现
  印记效果通过事件+效果系统实现
  不要直接修改 status modifier
  使用 doEvent 触发效果

UI 响应式
  印记状态变化会自动触发 UI 更新
  使用 computed 确保响应式

Mod 支持
  Mod作者可以通过 markRegistry.registerMark 注册自定义印记
  印记配置支持自定义触发器和效果
  UI会自动显示所有注册的印记

## 添加新印记

步骤

1. 在 `src/static/list/mark/markList.ts` 中添加印记配置

```typescript
{
  key: "mark_elite",
  name: "绿色印记",
  description: "击败强化精英获得",
  displayText: "精英猎手",
  displayColor: "green",
  statusKey: "ifEliteMark",
  onGain: {
    key: "eliteMark",
    effectUnits: [{
      key: "addStatusBaseValue",
      params: {
        value: 5,
        statusKey: "strength"
      }
    }]
  }
}
```

2. 在获得印记的地方调用 gainMark

```typescript
import { gainMark } from '@/core/hooks/mark'

// 击败强化精英后
gainMark(player, "mark_elite")
```

3. UI 会自动显示新印记

不需要修改任何UI代码，印记会自动显示在左上角。
