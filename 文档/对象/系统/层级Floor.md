# 层级系统 (Floor System)

层级是游戏的主要结构单元，每个层级有独立的房间池、生成规则和特性。

## 基本信息

层级系统将游戏划分为多个阶段，每个层级有不同的难度和内容。

层级结构
  第1层：底层
  第2层：中层
  第3层：高层
  第4层：终层（需要3个印记解锁）

层级特性
  独立的房间池（战斗、事件、黑市、休息）
  自定义房间生成规则
  难度倍率（敌人生命、伤害、奖励）
  解锁条件（印记、金币等）
  层级切换模式（自动、随机、手动）

## 层级配置

### FloorConfig 接口

```typescript
interface FloorConfig {
  key: string                    // 层级唯一标识
  name: string                   // 层级名称
  order: number                  // 层级顺序

  roomPools: {
    battles: string[]            // 普通战斗房间key列表
    bossBattles: string[]        // Boss战斗房间key列表
    events: string[]             // 事件房间key列表
    blackStores: string[]        // 黑市房间key列表
    pools: string[]              // 休息房间key列表
  }

  nextFloors?: string[]          // 可进入的下一层级key列表
  nextFloorSelectionMode?: "auto" | "random" | "manual"

  unlockCondition?: (player: Player) => {
    unlocked: boolean
    reason?: string
  }

  roomGenerationRules?: RoomGenerationRule[]

  modifiers?: {
    enemyHealthMultiplier?: number
    enemyDamageMultiplier?: number
    rewardMultiplier?: number
  }
}
```

配置说明
  key：层级唯一标识，如 "floor_1"
  name：层级名称，如 "底层"
  order：层级顺序，用于排序
  roomPools：该层级可用的房间池
    battles：普通战斗房间
    bossBattles：Boss战斗房间
    events：事件房间
    blackStores：黑市房间
    pools：休息房间
  nextFloors：可进入的下一层级列表
  nextFloorSelectionMode：层级切换模式
    "auto"（默认）：只有1个自动进入，多个显示选择界面
    "random"：从列表中随机选择一个自动进入
    "manual"：必须手动选择（即使只有1个）
  unlockCondition：解锁条件回调函数
    返回 unlocked（是否解锁）和 reason（未解锁原因）
  roomGenerationRules：层级专属的房间生成规则
  modifiers：层级特性倍率

### 示例配置

第1层：底层

```typescript
{
  key: "floor_1",
  name: "底层",
  order: 1,
  roomPools: {
    battles: ["battle_slime_1", "battle_goblin_1"],
    bossBattles: ["boss_slime_king"],
    events: ["event_shrine_1"],
    blackStores: ["blackStore_general"],
    pools: ["pool_default"]
  },
  nextFloors: ["floor_2"],
  nextFloorSelectionMode: "auto"
}
```

第4层：终层（需要3个印记）

```typescript
{
  key: "floor_4",
  name: "终层",
  order: 4,
  roomPools: {
    battles: ["battle_dragon_1"],
    bossBattles: ["boss_final"],
    events: [],
    blackStores: [],
    pools: ["pool_default"]
  },
  nextFloors: [],  // 最后一层
  unlockCondition: (player) => {
    const markCount = countPlayerMarks(player)
    return {
      unlocked: markCount >= 3,
      reason: markCount < 3 ? `需要3个印记（当前：${markCount}/3）` : undefined
    }
  },
  modifiers: {
    enemyHealthMultiplier: 2.0,
    enemyDamageMultiplier: 1.5,
    rewardMultiplier: 1.5
  }
}
```

## 层级注册

### 注册表

位置：`src/static/registry/floorRegistry.ts`

```typescript
import { floorRegistry } from '@/static/registry/floorRegistry'

// 注册单个层级
floorRegistry.registerFloor(floorConfig)

// 批量注册层级
floorRegistry.registerFloors([floor1, floor2, floor3])

// 获取层级配置
const floor = floorRegistry.getFloor("floor_1")

// 获取所有层级
const allFloors = floorRegistry.getAllFloors()

// 获取所有层级（按order排序）
const sortedFloors = floorRegistry.getAllFloorsSorted()
```

### 层级列表

位置：`src/static/list/floor/floorList.ts`

所有层级配置定义在此文件中，在应用启动时自动注册。

```typescript
export const floorList: FloorConfig[] = [
  {
    key: "floor_1",
    name: "底层",
    // ...
  },
  // 添加更多层级...
]
```

## 楼层管理器

### FloorManager

位置：`src/core/objects/system/FloorManager.ts`

FloorManager 负责追踪当前层级、房间历史，并根据层级配置生成房间选项。

设置当前层级

```typescript
import { floorManager } from '@/core/objects/system/FloorManager'

floorManager.setCurrentFloor("floor_1")
```

获取当前层级

```typescript
const floorKey = floorManager.getCurrentFloorKey()  // "floor_1"
const floorConfig = floorManager.getCurrentFloorConfig()
```

生成房间选项

```typescript
// 根据当前层级配置生成3个房间选项
const roomKeys = floorManager.generateNextFloorRoomOptions(3)
// ["battle_slime_1", "event_shrine_1", "pool_default"]
```

房间生成逻辑
  优先使用层级的 roomGenerationRules（如果有）
  否则使用全局默认规则
  从层级的 roomPools 中选择房间
  如果层级房间池为空，从全局房间注册表选择

## 房间生成规则扩展

### 支持返回固定房间列表

RoomGenerationRule 的 effect 现在可以返回三种类型：

```typescript
effect: (weights) =>
  | RoomWeightConfig    // 返回权重配置
  | RoomType            // 返回强制类型
  | string[]            // 返回固定房间key列表（新增）
```

示例：第3个房间固定选项

```typescript
{
  key: "floor_1",
  roomGenerationRules: [{
    name: "第3个房间固定选项",
    priority: 100,
    condition: (context) => context.roomHistory.length === 2,
    effect: () => ["room_a", "room_b"]  // 返回固定房间列表
  }]
}
```

## 层级切换

### 切换模式

打败Boss后的层级切换逻辑

```typescript
const currentFloor = floorManager.getCurrentFloorConfig()
const nextFloors = currentFloor.nextFloors || []
const mode = currentFloor.nextFloorSelectionMode || "auto"

if (nextFloors.length === 0) {
  // 没有下一层，游戏结束
  endGame()
} else if (mode === "random") {
  // 随机选择一个自动进入
  const randomFloor = nextFloors[Math.floor(Math.random() * nextFloors.length)]
  floorManager.setCurrentFloor(randomFloor)
} else if (mode === "manual" || (mode === "auto" && nextFloors.length > 1)) {
  // 显示选择界面
  showFloorSelection(nextFloors)
} else {
  // auto + 只有1个，自动进入
  floorManager.setCurrentFloor(nextFloors[0])
}
```

### 解锁条件检查

过滤可进入的层级

```typescript
import { nowPlayer } from '@/core/objects/game/run'

const availableFloors = nextFloors.filter(floorKey => {
  const floor = floorRegistry.getFloor(floorKey)
  if (!floor.unlockCondition) {
    return true  // 没有解锁条件，直接可进入
  }

  const result = floor.unlockCondition(nowPlayer)
  if (!result.unlocked && result.reason) {
    console.log(`[Floor] ${floor.name} 未解锁: ${result.reason}`)
  }
  return result.unlocked
})

if (availableFloors.length === 0) {
  showMessage("未满足解锁条件，无法进入下一层")
}
```

## 相关文件

类型定义：`src/core/types/FloorConfig.ts`
注册表：`src/static/registry/floorRegistry.ts`
层级列表：`src/static/list/floor/floorList.ts`
楼层管理器：`src/core/objects/system/FloorManager.ts`
房间生成规则：`src/core/objects/system/RoomGenerationRules.ts`
初始化：`src/main.ts`

## 注意事项

层级切换时重置房间历史
  调用 setCurrentFloor 会重置 roomHistory
  每个层级的房间历史独立计算

房间池优先级
  优先从层级的 roomPools 选择房间
  如果层级房间池为空，从全局房间注册表选择
  这样可以灵活配置层级内容

层级特性倍率
  modifiers 中的倍率需要在战斗系统中应用
  目前只是配置，实际应用需要在敌人生成时读取

解锁条件回调
  unlockCondition 是回调函数，可以写任意复杂的逻辑
  支持检查印记、金币、遗物等任意条件
  返回 reason 可以显示给玩家

Mod 支持
  Mod作者可以通过 floorRegistry.registerFloor 注册自定义层级
  层级配置支持自定义房间池和生成规则
  支持分支路线（nextFloors 可以有多个）

## 添加新层级

步骤

1. 在 `src/static/list/floor/floorList.ts` 中添加层级配置

```typescript
{
  key: "floor_special",
  name: "特殊层",
  order: 5,
  roomPools: {
    battles: ["battle_special_1"],
    bossBattles: ["boss_special"],
    events: ["event_special_1"],
    blackStores: [],
    pools: ["pool_default"]
  },
  nextFloors: [],
  unlockCondition: (player) => {
    const gold = getReserveValue(player, "gold")
    return {
      unlocked: gold >= 1000,
      reason: gold < 1000 ? `需要1000金币（当前：${gold}）` : undefined
    }
  },
  modifiers: {
    enemyHealthMultiplier: 3.0,
    rewardMultiplier: 2.0
  }
}
```

2. 在其他层级的 nextFloors 中添加该层级

```typescript
{
  key: "floor_3",
  nextFloors: ["floor_4", "floor_special"],  // 添加分支
  nextFloorSelectionMode: "manual"  // 让玩家选择
}
```

3. 层级会自动注册和生效

不需要修改任何其他代码，层级系统会自动处理。
