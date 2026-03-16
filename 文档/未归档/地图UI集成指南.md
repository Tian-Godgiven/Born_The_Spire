# 地图UI集成指南

## 在 running.vue 中集成地图UI

### 1. 导入组件和hook

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MapOverlay from './MapOverlay.vue'
import { setShowMapCallback } from '@/core/hooks/step'

// 地图覆盖层引用
const mapOverlay = ref<InstanceType<typeof MapOverlay> | null>(null)

// 显示地图
function showMap() {
  mapOverlay.value?.show()
}

// 注册显示地图的回调
onMounted(() => {
  setShowMapCallback(showMap)
})
</script>

<template>
  <div class="running-page">
    <!-- 游戏内容 -->
    <div class="game-content">
      <!-- 房间内容 -->
      <!-- ... -->
    </div>

    <!-- 地图覆盖层 -->
    <MapOverlay ref="mapOverlay" />
  </div>
</template>
```

### 2. 完整示例

```vue
<template>
  <div class="running-page">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="player-info">
        <span>生命: {{ nowPlayer.current.health.value }} / {{ nowPlayer.status.maxHealth.value }}</span>
        <span>金币: {{ nowPlayer.current.gold.value }}</span>
      </div>
      <button class="map-btn" @click="showMap">查看地图</button>
    </div>

    <!-- 房间内容区域 -->
    <div class="room-content">
      <component :is="currentRoomComponent" />
    </div>

    <!-- 地图覆盖层 -->
    <MapOverlay ref="mapOverlay" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import { setShowMapCallback } from '@/core/hooks/step'
import MapOverlay from './MapOverlay.vue'

// 地图覆盖层引用
const mapOverlay = ref<InstanceType<typeof MapOverlay> | null>(null)

// 当前房间组件
const currentRoomComponent = computed(() => {
  const room = nowGameRun.currentRoom
  if (!room) return null

  // 根据房间类型返回对应的组件
  switch (room.type) {
    case 'battle':
      return () => import('./BattleRoom.vue')
    case 'event':
      return () => import('./EventRoom.vue')
    case 'pool':
      return () => import('./PoolRoom.vue')
    case 'blackStore':
      return () => import('./BlackStoreRoom.vue')
    default:
      return null
  }
})

// 显示地图
function showMap() {
  mapOverlay.value?.show()
}

// 注册显示地图的回调
onMounted(() => {
  setShowMapCallback(showMap)
})
</script>

<style scoped lang="scss">
.running-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #f5f5f5;
  border-bottom: 2px solid #333;
}

.player-info {
  display: flex;
  gap: 20px;
  font-size: 16px;
}

.map-btn {
  padding: 8px 16px;
  background: white;
  border: 2px solid #333;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.room-content {
  flex: 1;
  overflow: auto;
}
</style>
```

## 使用流程

### 完成房间后显示地图

```typescript
// 在房间组件中（例如 BattleRoom.vue）
import { completeAndGoNext } from '@/core/hooks/step'

async function onBattleComplete() {
  // 完成当前房间并显示地图
  await completeAndGoNext()
  // 地图会自动显示，玩家可以选择下一个节点
}
```

### 手动显示地图

```typescript
// 在任何地方都可以调用
import { setShowMapCallback } from '@/core/hooks/step'

// 获取显示地图的函数（需要先注册）
// 然后直接调用 showMap()
```

## 地图UI功能

### 节点状态

- **locked** (灰色): 未解锁的节点
- **available** (蓝色): 可前往的节点（可点击）
- **current** (金色): 当前位置（带脉冲动画）
- **completed** (绿色): 已完成的节点

### 交互

- **点击可达节点**: 移动到该节点并进入对应房间
- **悬停节点**: 显示节点信息（房间类型、层级、状态）
- **点击背景或关闭按钮**: 关闭地图（如果有可达节点）

### 自动处理

- **lazy 房间key分配**: 点击节点时自动分配具体房间
- **地图状态更新**: 移动到节点后自动更新地图状态
- **房间进入**: 自动进入选中节点的房间

## 注意事项

1. **必须注册回调**
   - 在 `onMounted` 中调用 `setShowMapCallback(showMap)`
   - 否则 `completeAndGoNext()` 会回退到旧的 RoomSelectRoom

2. **地图必须已生成**
   - 在 `startNewRun()` 中会自动生成地图
   - 如果没有地图，会使用旧的房间选择方式

3. **节点必须可达**
   - 只有 `state === 'available'` 的节点可以点击
   - 当前节点的连接节点会自动标记为 available

4. **房间key分配**
   - lazy 类型（battle、event）在点击时分配
   - eager 类型（pool、blackStore）在地图生成时已分配

## 自定义样式

可以通过修改 `MapView.vue` 和 `MapOverlay.vue` 的样式来自定义外观：

```scss
// 修改节点大小
const nodeRadius = 25  // 默认 20

// 修改层级间距
const layerHeight = 100  // 默认 80

// 修改节点间距
const nodeSpacing = 120  // 默认 100

// 修改颜色
.node-circle {
  .map-node.available & {
    fill: #your-color;
    stroke: #your-border-color;
  }
}
```

## 调试

```typescript
// 在浏览器控制台
window.nowGameRun.floorManager.getCurrentMap()  // 查看当前地图
window.nowGameRun.floorManager.getCurrentMapNode()  // 查看当前节点
window.nowGameRun.floorManager.getNextMapNodes()  // 查看可达节点
```
