# FloorSelectRoom 使用指南

## 概念

**FloorSelectRoom** 用于在完成一个楼层后，让玩家选择下一个楼层的风格/主题。

## 层级结构

```
游戏 (Game)
  └─ 楼层 (Floor) - 例如：森林、沼泽、火山
      └─ 地图 (Map) - 15层节点网络
          └─ 房间 (Room) - 具体的战斗、事件等
```

## 使用场景

### 场景1：完成第一个楼层后选择第二个楼层

```typescript
// 在 floor_1 的配置中
{
  key: "floor_1",
  name: "底层",
  order: 1,
  nextFloors: ["floor_2_forest", "floor_2_swamp", "floor_2_volcano"],
  nextFloorSelectionMode: "manual"  // 必须手动选择
}

// 完成 floor_1 后，自动进入 FloorSelectRoom
// 玩家可以选择：
//   - floor_2_forest（森林楼层）
//   - floor_2_swamp（沼泽楼层）
//   - floor_2_volcano（火山楼层）
```

### 场景2：自动进入下一个楼层（无选择）

```typescript
{
  key: "floor_1",
  name: "底层",
  order: 1,
  nextFloors: ["floor_2"],  // 只有一个
  nextFloorSelectionMode: "auto"  // 自动进入（默认）
}

// 完成 floor_1 后，直接进入 floor_2，不显示选择界面
```

### 场景3：随机选择一个楼层

```typescript
{
  key: "floor_1",
  name: "底层",
  order: 1,
  nextFloors: ["floor_2_a", "floor_2_b", "floor_2_c"],
  nextFloorSelectionMode: "random"  // 随机选择
}

// 完成 floor_1 后，系统随机选择一个楼层进入
```

## 楼层配置示例

### 森林楼层

```typescript
{
  key: "floor_2_forest",
  name: "翠绿森林",
  order: 2,
  description: "充满生机的森林，敌人较弱但奖励较少",

  // 地图配置
  mapConfig: {
    layers: 15,
    roomTypeWeights: {
      battle: 60,
      event: 25,
      pool: 10,
      blackStore: 5
    },
    // ... 其他地图配置
  },

  // 楼层入口事件（可选）
  entranceEvent: "event_forest_entrance",

  // 房间池
  roomPools: {
    battles: ["battle_forest_wolf", "battle_forest_bear"],
    events: ["event_forest_shrine", "event_forest_merchant"],
    pools: ["pool_forest_spring"],
    blackStores: ["store_forest_trader"]
  },

  // 楼层特性
  modifiers: {
    enemyHealthMultiplier: 0.8,  // 敌人生命 -20%
    rewardMultiplier: 0.9         // 奖励 -10%
  }
}
```

### 火山楼层

```typescript
{
  key: "floor_2_volcano",
  name: "炽热火山",
  order: 2,
  description: "危险的火山地带，敌人强大但奖励丰厚",

  mapConfig: {
    layers: 15,
    roomTypeWeights: {
      battle: 70,
      eliteBattle: 15,
      event: 10,
      pool: 3,
      blackStore: 2
    }
  },

  entranceEvent: "event_volcano_entrance",

  roomPools: {
    battles: ["battle_volcano_elemental", "battle_volcano_demon"],
    eliteBattles: ["battle_volcano_elite_golem"],
    events: ["event_volcano_sacrifice"],
    pools: ["pool_volcano_lava_bath"],
    blackStores: ["store_volcano_blacksmith"]
  },

  modifiers: {
    enemyHealthMultiplier: 1.3,  // 敌人生命 +30%
    enemyDamageMultiplier: 1.2,  // 敌人伤害 +20%
    rewardMultiplier: 1.5         // 奖励 +50%
  }
}
```

## 程序化使用

### 手动创建 FloorSelectRoom

```typescript
import { FloorSelectRoom } from "@/core/objects/room/FloorSelectRoom"

// 完成当前楼层后
await nowGameRun.completeCurrentRoom()

// 创建楼层选择房间
const floorSelectRoom = new FloorSelectRoom({
  type: "floorSelect",
  layer: nowGameRun.getCurrentLayer(),
  floorOrder: 2,  // 选择第2个楼层
  floorKeys: ["floor_2_forest", "floor_2_swamp", "floor_2_volcano"]
})

await nowGameRun.enterRoom(floorSelectRoom)
```

### 自动处理（推荐）

在 FloorManager 中添加自动处理逻辑：

```typescript
// 完成楼层后自动检查 nextFloors 配置
async function completeFloor() {
  const currentFloorConfig = nowGameRun.floorManager.getCurrentFloorConfig()

  if (!currentFloorConfig.nextFloors || currentFloorConfig.nextFloors.length === 0) {
    // 没有下一个楼层，游戏结束
    await gameOver()
    return
  }

  const mode = currentFloorConfig.nextFloorSelectionMode || "auto"

  if (mode === "auto" && currentFloorConfig.nextFloors.length === 1) {
    // 自动进入唯一的下一个楼层
    const nextFloorKey = currentFloorConfig.nextFloors[0]
    await enterFloor(nextFloorKey)
  } else if (mode === "random") {
    // 随机选择一个楼层
    const randomIndex = Math.floor(Math.random() * currentFloorConfig.nextFloors.length)
    const nextFloorKey = currentFloorConfig.nextFloors[randomIndex]
    await enterFloor(nextFloorKey)
  } else {
    // 显示选择界面
    const floorSelectRoom = new FloorSelectRoom({
      type: "floorSelect",
      layer: nowGameRun.getCurrentLayer(),
      floorKeys: currentFloorConfig.nextFloors
    })
    await nowGameRun.enterRoom(floorSelectRoom)
  }
}

async function enterFloor(floorKey: string) {
  const floorConfig = floorRegistry.getFloor(floorKey)
  if (!floorConfig) return

  // 设置新楼层
  nowGameRun.floorManager.setCurrentFloor(floorKey)

  // 生成地图
  const floorMap = nowGameRun.floorManager.generateMap(floorConfig.mapConfig)

  // 进入入口事件或直接进入地图
  if (floorConfig.entranceEvent) {
    await enterRoom(floorConfig.entranceEvent, 0)
  } else {
    // 显示地图UI或进入第一个房间选择
    // ...
  }
}
```

## 与 RoomSelectRoom 的区别

| 特性 | FloorSelectRoom | RoomSelectRoom |
|------|----------------|----------------|
| 用途 | 选择楼层风格 | 选择单个房间（旧系统） |
| 选择范围 | 整个楼层（15层地图） | 单个房间节点 |
| 触发时机 | 完成一个楼层后 | 完成一个房间后（旧系统） |
| 影响 | 决定接下来15层的内容 | 只决定下一个房间 |
| 地图系统 | 选择后生成新地图 | 在已有地图中选择节点 |

## 注意事项

1. **FloorConfig.order 必须正确设置**
   - order 用于确定楼层顺序
   - 同一 order 的楼层会作为选项出现

2. **mapConfig 是可选的**
   - 如果不提供，使用默认地图配置
   - 建议为每个楼层提供自定义配置

3. **entranceEvent 是可选的**
   - 用于楼层开始时的剧情或教程
   - 如果不提供，直接进入地图

4. **解锁条件**
   - 可以通过 unlockCondition 控制楼层是否可选
   - 例如：需要特定遗物才能进入某个楼层

## 完整流程示例

```
游戏开始
  ↓
进入 floor_1（底层）
  ↓
生成 floor_1 的地图（15层）
  ↓
玩家在地图上探索（完成15个房间）
  ↓
完成 floor_1
  ↓
进入 FloorSelectRoom
  ↓
玩家选择：森林 / 沼泽 / 火山
  ↓
进入选中的 floor_2_xxx
  ↓
生成新地图（15层）
  ↓
继续探索...
```
