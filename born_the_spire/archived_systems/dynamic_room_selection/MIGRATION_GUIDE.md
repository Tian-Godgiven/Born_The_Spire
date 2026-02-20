# 迁移到新地图系统

本文档说明如何从动态房间选择系统迁移到预生成地图系统。

## 迁移概述

**旧系统（动态选择）：**
- 每次完成房间后，动态生成3个房间选项
- 玩家从3个选项中选择1个
- 基于规则和概率计算

**新系统（预生成地图）：**
- 游戏开始时生成整个楼层的地图
- 玩家可以看到多步路径
- 玩家选择前进方向

## 需要保留的文件

以下文件会被新系统复用，**不要删除**：

```
src/core/objects/system/FloorManager.ts  （会重构）
src/core/objects/room/Room.ts
src/core/types/FloorConfig.ts  （会修改）
src/static/list/floor/floorList.ts  （会修改）
src/static/registry/roomRegistry.ts
```

## 需要移除的文件

以下文件已归档到 `archived_systems/dynamic_room_selection/`，可以从主项目中删除：

```
src/core/objects/system/roomSelection/  （整个目录）
src/core/objects/system/RoomGenerationRules.ts
src/core/objects/room/RoomSelectRoom.ts
src/ui/page/Scene/running/RoomSelectRoom.vue
```

## 新系统需要实现的组件

### 1. 地图数据结构

```typescript
// src/core/objects/system/map/MapNode.ts
interface MapNode {
  id: string
  layer: number
  roomKey: string
  roomType: RoomType
  x: number  // 水平位置（用于UI显示）
  connections: string[]  // 连接到的下一层节点ID
}

// src/core/objects/system/map/FloorMap.ts
class FloorMap {
  nodes: Map<string, MapNode>
  layers: number
  currentNodeId: string | null

  // 生成地图
  generate(config: FloorConfig): void

  // 获取当前节点
  getCurrentNode(): MapNode | null

  // 获取可前进的节点
  getNextNodes(): MapNode[]

  // 前进到下一个节点
  moveToNode(nodeId: string): void

  // 序列化（用于存档）
  serialize(): any
  deserialize(data: any): void
}
```

### 2. 地图生成器

```typescript
// src/core/objects/system/map/MapGenerator.ts
class MapGenerator {
  // 生成地图
  generate(config: {
    layers: number
    roomPools: RoomPools
    pathsPerLayer: number  // 每层的路径数（通常3-7条）
    branchingFactor: number  // 分支因子（节点连接数）
  }): FloorMap

  // 分层生成
  private generateLayer(layer: number): MapNode[]

  // 生成连接
  private generateConnections(currentLayer: MapNode[], nextLayer: MapNode[]): void

  // 分配房间类型
  private assignRoomTypes(nodes: MapNode[], config: any): void
}
```

### 3. 地图 UI 组件

```typescript
// src/ui/page/Scene/running/MapView.vue
// 显示地图，允许玩家选择路径
```

### 4. FloorManager 重构

```typescript
// src/core/objects/system/FloorManager.ts
class FloorManager {
  private currentMap: FloorMap | null = null

  // 生成新地图
  generateMap(floorConfig: FloorConfig): FloorMap

  // 获取当前地图
  getCurrentMap(): FloorMap | null

  // 前进到下一个节点
  moveToNode(nodeId: string): void

  // 获取当前房间
  getCurrentRoom(): MapNode | null

  // 获取可前进的房间
  getNextRooms(): MapNode[]
}
```

## 迁移步骤

### 阶段1：准备工作

1. 确认动态选择系统已归档
2. 创建新的地图系统目录结构
3. 定义地图数据结构

### 阶段2：实现核心逻辑

1. 实现 MapNode 和 FloorMap
2. 实现 MapGenerator（地图生成算法）
3. 重构 FloorManager

### 阶段3：实现 UI

1. 实现地图显示组件
2. 实现节点选择交互
3. 实现路径高亮

### 阶段4：集成和测试

1. 修改游戏流程，使用新的地图系统
2. 测试地图生成
3. 测试路径选择
4. 测试存档/读档

### 阶段5：清理

1. 删除旧系统的文件
2. 更新文档
3. 更新配置

## 地图生成算法参考

### 杀戮尖塔风格

```typescript
function generateStSMap(layers: number): FloorMap {
  const map = new FloorMap()

  for (let layer = 0; layer < layers; layer++) {
    // 每层3-7个节点
    const nodeCount = 3 + Math.floor(Math.random() * 5)
    const nodes: MapNode[] = []

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `${layer}-${i}`,
        layer,
        roomKey: selectRoomKey(layer),
        roomType: selectRoomType(layer),
        x: i / (nodeCount - 1),  // 均匀分布
        connections: []
      })
    }

    // 连接到下一层
    if (layer < layers - 1) {
      connectToNextLayer(nodes, nextLayerNodes)
    }

    map.addLayer(nodes)
  }

  return map
}

function connectToNextLayer(current: MapNode[], next: MapNode[]) {
  for (const node of current) {
    // 每个节点连接1-3个下层节点
    const connectionCount = 1 + Math.floor(Math.random() * 3)
    const targets = selectNearbyNodes(node, next, connectionCount)
    node.connections = targets.map(t => t.id)
  }
}
```

### 房间类型分配

```typescript
function selectRoomType(layer: number): RoomType {
  // 第1层：主要是战斗
  if (layer === 0) {
    return Math.random() < 0.8 ? "battle" : "event"
  }

  // Boss层前：休息点
  if (layer === 14) {
    return "pool"
  }

  // Boss层：Boss战
  if (layer === 15) {
    return "battle"  // Boss战斗
  }

  // 其他层：按概率分配
  const rand = Math.random()
  if (rand < 0.5) return "battle"
  if (rand < 0.7) return "event"
  if (rand < 0.85) return "pool"
  return "blackStore"
}
```

## 配置变化

### 旧配置（FloorConfig）

```typescript
{
  roomPools: { ... },
  roomLayout: [ ... ],
  roomGenerationRules: [ ... ],
  exhaustionStrategies: { ... }
}
```

### 新配置（FloorConfig）

```typescript
{
  roomPools: { ... },  // 保留
  mapConfig: {
    layers: 16,
    pathsPerLayer: { min: 3, max: 7 },
    branchingFactor: { min: 1, max: 3 },
    roomTypeDistribution: {
      battle: 0.5,
      event: 0.2,
      pool: 0.15,
      blackStore: 0.15
    },
    fixedRooms: [
      { layer: 0, type: "battle" },  // 第1层必定是战斗
      { layer: 14, type: "pool" },   // 第15层必定是休息点
      { layer: 15, type: "battle" }  // 第16层必定是Boss
    ]
  }
}
```

## API 变化

### 旧 API

```typescript
// 生成房间选项
const roomKeys = floorManager.generateNextFloorRoomOptions(3, player)

// 创建房间选择房间
const roomSelectRoom = new RoomSelectRoom({ roomKeys })

// 进入房间选择
await nowGameRun.enterRoom(roomSelectRoom)
```

### 新 API

```typescript
// 生成地图（游戏开始时）
const map = floorManager.generateMap(floorConfig)

// 获取可前进的节点
const nextNodes = map.getNextNodes()

// 玩家选择节点
await map.moveToNode(selectedNodeId)

// 进入选中的房间
const roomKey = map.getCurrentNode().roomKey
const room = roomRegistry.createRoom(roomKey)
await nowGameRun.enterRoom(room)
```

## 注意事项

1. **存档兼容性**
   - 旧存档无法直接加载到新系统
   - 需要实现存档迁移或提示玩家重新开始

2. **UI 复杂度**
   - 地图 UI 比简单的3选1复杂
   - 需要考虑缩放、滚动、节点高亮等

3. **性能**
   - 地图生成是一次性的，性能影响小
   - UI 渲染可能需要优化（大量节点）

4. **测试**
   - 需要测试各种地图生成情况
   - 确保没有死路、孤立节点等

## 参考资料

- 杀戮尖塔地图生成算法分析
- Roguelike 地图生成最佳实践
- 图论基础（节点、边、连通性）

## 后续优化

新系统实现后，可以考虑的优化：

1. **地图变体**
   - 不同楼层使用不同的地图生成算法
   - 特殊地图布局（如迷宫、分支、汇聚）

2. **动态事件**
   - 地图上的特殊节点（如商人、神龛）
   - 随机事件影响地图

3. **视觉效果**
   - 地图动画
   - 路径追踪
   - 节点特效

4. **Mod 支持**
   - 自定义地图生成器
   - 自定义节点类型
   - 自定义连接规则

---

迁移日期：2026-02-04
