# 房间选择系统迁移指南

## 概述

本项目已从**动态房间选择系统**迁移到**预生成地图系统**。本文档说明两个系统的区别、迁移步骤和兼容性。

## 系统对比

### 旧系统：动态房间选择

**工作方式：**
```
完成房间 → 动态生成3个房间选项 → 玩家选择 → 进入房间
```

**特点：**
- ✅ 简单直接
- ✅ 灵活的房间生成规则
- ❌ 没有全局视野
- ❌ 无法规划路径
- ❌ 不支持种子系统

**核心组件：**
- `RoomSelectRoom` - 房间选择房间
- `FloorManager.generateNextFloorRoomOptions()` - 动态生成房间选项
- `RoomGenerationRules` - 房间生成规则

### 新系统：预生成地图

**工作方式：**
```
游戏开始 → 生成整个地图（15层） → 显示地图UI → 玩家选择路径 → 进入房间
```

**特点：**
- ✅ 全局视野，可以规划路径
- ✅ 支持种子系统（可重现）
- ✅ 更接近 Slay the Spire 的体验
- ✅ 支持复杂的地图约束
- ❌ 配置相对复杂

**核心组件：**
- `FloorMap` - 地图数据结构
- `MapGenerator` - 地图生成器
- `MapView.vue` - 地图UI组件
- `FloorSelectRoom` - 楼层选择房间（新）

## 迁移步骤

### 1. 启用地图系统

在 `startNewRun()` 中生成地图：

```typescript
// 旧代码（已废弃）
// 不需要预生成地图，每次动态生成房间选项

// 新代码
import { nowGameRun } from '@/core/objects/game/run'

// 生成地图
const floorMap = nowGameRun.floorManager.generateMap()
```

### 2. 使用地图UI代替 RoomSelectRoom

**旧代码：**
```typescript
// 完成房间后进入 RoomSelectRoom
const roomSelectRoom = new RoomSelectRoom({
  type: "roomSelect",
  layer: currentRoom.layer + 1,
  targetLayer: currentRoom.layer + 1,
  roomCount: 3
})
await nowGameRun.enterRoom(roomSelectRoom)
```

**新代码：**
```typescript
// 完成房间后显示地图UI
import { completeAndGoNext } from '@/core/hooks/step'

await completeAndGoNext()
// 地图UI会自动显示
```

### 3. 注册地图显示回调

在 `running.vue` 中：

```vue
<script setup>
import { ref, onMounted } from 'vue'
import MapOverlay from './MapOverlay.vue'
import { setShowMapCallback } from '@/core/hooks/step'

const mapOverlay = ref(null)

function showMap() {
  mapOverlay.value?.show()
}

onMounted(() => {
  setShowMapCallback(showMap)
})
</script>

<template>
  <MapOverlay ref="mapOverlay" />
</template>
```

### 4. 配置地图生成

创建地图配置（可选，使用默认配置也可以）：

```typescript
import type { FloorMapConfig } from '@/core/types/FloorMapConfig'

const myMapConfig: FloorMapConfig = {
  layers: 15,
  nodesPerLayer: { min: 3, max: 7 },
  connectionDensity: { min: 1, max: 3 },

  roomTypeWeights: {
    battle: 50,
    eliteBattle: 10,
    event: 20,
    pool: 10,
    blackStore: 10
  },

  // ... 其他配置
}

// 使用自定义配置生成地图
const floorMap = nowGameRun.floorManager.generateMap(myMapConfig)
```

## 兼容性

### 保留的旧系统组件

以下组件保留用于兼容和特殊场景：

1. **RoomSelectRoom**
   - 用途：特殊事件中的房间选择
   - 状态：保留，标记为 legacy
   - 使用：设置 `useMapNodes: false`

2. **FloorManager 旧方法**
   - `generateNextFloorRoomOptions()` - 动态生成房间选项
   - `calculateRoomWeights()` - 计算房间权重
   - 状态：保留，标记为 deprecated

3. **RoomGenerationRules**
   - 旧的房间生成规则系统
   - 状态：保留，但不推荐使用

### 如何使用旧系统

如果需要使用旧系统（不推荐）：

```typescript
// 不生成地图
// 不调用 generateMap()

// 使用旧的 RoomSelectRoom
const roomSelectRoom = new RoomSelectRoom({
  type: "roomSelect",
  layer: 1,
  targetLayer: 1,
  roomCount: 3,
  useMapNodes: false  // 关键：使用旧模式
})
```

## 已废弃的功能

以下功能在新系统中不再使用：

### 1. 动态房间生成规则

**旧配置：**
```typescript
// FloorConfig 中的旧配置
{
  roomGenerationRules: [
    {
      condition: (context) => context.step === 1,
      result: { type: "battle" }
    }
  ]
}
```

**新配置：**
```typescript
// FloorMapConfig 中的新配置
{
  layerLayouts: {
    0: { roomTypes: ["battle", "battle", "battle"] }
  }
}
```

### 2. roomLayout 槽位配置

**旧配置：**
```typescript
{
  roomLayout: [
    {
      step: 1,
      roomKey: "battle_tutorial_1"
    }
  ]
}
```

**新配置：**
```typescript
{
  layerLayouts: {
    0: { roomKeys: ["battle_tutorial_1"] }
  }
}
```

### 3. 选择规则（SelectionRuleConfig）

**旧系统：**
```typescript
{
  selectionRules: [
    {
      priority: 10,
      condition: (context) => true,
      action: { type: "force", roomType: "battle" }
    }
  ]
}
```

**新系统：**
使用地图配置的约束系统：
```typescript
{
  constraints: {
    placement: {
      parent: { noSelfFollow: ["eliteBattle"] }
    }
  }
}
```

## 迁移检查清单

- [ ] 在 `startNewRun()` 中调用 `generateMap()`
- [ ] 在 `running.vue` 中添加 `MapOverlay` 组件
- [ ] 注册 `setShowMapCallback()`
- [ ] 将 `completeAndGoNext()` 替换旧的房间选择逻辑
- [ ] 移除或更新使用 `generateNextFloorRoomOptions()` 的代码
- [ ] 将 `FloorConfig.roomLayout` 迁移到 `FloorMapConfig.layerLayouts`
- [ ] 将 `roomGenerationRules` 迁移到地图约束系统
- [ ] 测试地图生成和房间进入流程

## 常见问题

### Q: 旧代码会被删除吗？

A: 不会。旧系统的代码会保留用于兼容性，但会标记为 deprecated。

### Q: 可以混用新旧系统吗？

A: 不建议。一个游戏运行应该只使用一个系统。通过 `useMapNodes` 参数可以控制使用哪个系统。

### Q: 如何判断当前使用的是哪个系统？

A: 检查是否生成了地图：
```typescript
const hasMap = nowGameRun.floorManager.getCurrentMap() !== null
```

### Q: 旧的房间生成规则如何迁移？

A: 参考 `FloorMapConfig.usage.md` 和 `ValidationStrategy.usage.md`，使用新的配置系统。

### Q: 特殊事件中需要让玩家选择房间怎么办？

A: 可以继续使用 `RoomSelectRoom`，设置 `useMapNodes: false`。

## 相关文档

- `FloorMapConfig.usage.md` - 地图配置使用指南
- `ValidationStrategy.usage.md` - 验证策略配置指南
- `MapView.integration.md` - 地图UI集成指南
- `FloorSelectRoom.usage.md` - 楼层选择使用指南

## 技术支持

如果在迁移过程中遇到问题，请查看：
1. 控制台日志（`[MapGenerator]`, `[FloorManager]` 等）
2. 地图验证结果（约束违规信息）
3. 相关文档和示例代码
