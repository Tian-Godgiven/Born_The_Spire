# 房间 Room

房间是玩家在爬塔过程中每一层的遭遇内容，所有游戏内容（战斗、事件、休息点、黑市、房间选择）都是房间。

## 房间类型

type RoomType = "battle" | "event" | "pool" | "blackStore" | "roomSelect"

1.battle - 战斗房间
   子类型：normal（普通）、elite（精英）、boss（Boss）
   战斗结束后自动进入奖励选择

2.event - 事件房间
   基于 Choice 系统的选择机制
   可以有多个选项，每个选项有不同的效果

3.pool - 水池房间
   提供汲取、升级、染血三种行为
   升级可重复，染血是全局唯一的一次性选择

4.blackStore - 黑市房间
   购买/出售物品，使用金币交易
   商品随机生成

5.roomSelect - 房间选择
   通常提供 3 个房间选项
   由 FloorManager 根据规则生成

## 房间生命周期

```typescript
abstract class Room {
    abstract enter(): void | Promise<void>      // 进入房间
    abstract process(): void | Promise<void>    // 处理房间内容
    abstract complete(): void | Promise<void>   // 完成房间
    abstract exit(): void | Promise<void>       // 离开房间
}
```

生命周期流程：enter() → process() → complete() → exit()

enter() - 进入房间
- 初始化房间内容、显示 UI
- 设置房间状态为 "active"
- 记录房间到楼层管理器

process() - 处理房间
- 执行房间的核心逻辑
- UI 驱动的房间（水池、事件、黑市）方法为空
- 自动进行的房间（战斗）在这里执行主要流程

complete() - 完成房间
- 结算奖励、清理状态
- 设置房间状态为 "completed"
- 将房间加入历史记录

exit() - 离开房间
- 清理资源、保存状态

房间状态：pending（已创建未进入）
          active（进行中）
          completed（已完成）

## 房间配置

```typescript
interface RoomConfig {
    key?: string              // 房间唯一标识
    type: RoomType           // 房间类型
    layer: number            // 所在层级
    name?: string            // 房间名称
    description?: string     // 房间描述
}
```

不同房间会有不同的细分配置，请参见对应的房间内容

## 房间切换

推荐使用 step.ts 提供的封装函数：

```typescript
import { completeAndGoNext, goToRoomType, completeAndGoToRoomType } from "@/core/hooks/step"

// 完成当前房间并前往下一步（最常用）
await completeAndGoNext()

// 或者：直接进入指定类型的房间
await goToRoomType("pool", { absorbAmount: 100 })

// 或者：完成当前房间并进入指定房间
await completeAndGoToRoomType("battle", { battleType: "elite" })
```

进阶：手动控制

```typescript
// 分步操作
await nowGameRun.completeCurrentRoom()
await goToNextStep()

// 或者：手动创建房间并进入
const poolRoom = new PoolRoom({ type: "pool", layer: 1 })
await nowGameRun.enterRoom(poolRoom)
```

## 通过 GameRun 管理房间

位置：`src/core/objects/system/GameRun.ts`

核心属性：
- currentRoom: 当前房间
- roomHistory: 已完成的房间历史
- floorManager: 楼层管理器
- towerLevel: 当前层数

核心方法：
- enterRoom(room): 进入房间
- completeCurrentRoom(): 完成当前房间
- exitCurrentRoom(): 离开当前房间（不完成）
- generateNextFloorRoomOptions(count): 生成下一层的房间选项

## 楼层生成管理器

位置：`src/core/objects/game/FloorManager.ts`

工作原理：
    每进入一个房间，楼层 +1
    记录房间历史，影响下次房间生成
    根据规则自动调整房间概率

规则上下文：
- currentFloor: 当前楼层
- consecutiveBattles: 连续战斗次数
- consecutiveNonBattles: 连续非战斗次数
- floorsSinceLastPool: 距离上次休息点的楼层数
- floorsSinceLastBlackStore: 距离上次黑市的楼层数
- floorsSinceLastEvent: 距离上次事件的楼层数

房间生成规则示例：

```typescript
// RoomGenerationRules.ts
{
    name: "连续3次非战斗后强制战斗",
    priority: 100,
    condition: (context) => context.consecutiveNonBattles >= 3,
    effect: () => "battle"  // 强制返回战斗类型
}
```

## UI 组件映射

位置：`src/ui/registry/roomComponentRegistry.ts`

```typescript
const roomComponentMap = new Map<RoomType, Component>()
roomComponentMap.set('battle', BattleRoom)
roomComponentMap.set('event', EventRoom)
roomComponentMap.set('pool', PoolRoom)
roomComponentMap.set('blackStore', BlackStoreRoom)
roomComponentMap.set('roomSelect', RoomSelectRoom)
```

在 Running.vue 中根据当前房间类型动态加载对应组件：

```typescript
const currentRoomComponent = computed(() => {
    const roomType = nowGameRun.currentRoom?.type
    return roomType ? getRoomComponent(roomType) : null
})
```

## 使用示例

从水池离开并选择下一个房间：

```typescript
// 在 PoolRoom.vue 中
async function leavePool() {
    const room = currentRoom.value
    if (room) {
        // 1. 完成当前房间
        await nowGameRun.completeCurrentRoom()

        // 2. 创建房间选择
        const roomSelectRoom = new RoomSelectRoom({
            type: "roomSelect",
            layer: room.layer + 1,
            targetLayer: room.layer + 1,
            roomCount: 3
        })

        // 3. 进入房间选择
        await nowGameRun.enterRoom(roomSelectRoom)
    }
}
```

战斗胜利后的流程：

```typescript
// 在 BattleRoom 中
async onBattleVictory() {
    // 1. 显示奖励
    await this.showRewards()

    // 2. 完成战斗房间
    await nowGameRun.completeCurrentRoom()

    // 3. 自动进入房间选择
    const roomSelectRoom = new RoomSelectRoom({
        type: "roomSelect",
        layer: this.layer + 1,
        targetLayer: this.layer + 1,
        roomCount: 3
    })

    await nowGameRun.enterRoom(roomSelectRoom)
}
```

## 注意事项

1. 房间切换必须通过 GameRun，不要直接修改 nowGameRun.currentRoom
2. 完成顺序：先调用 completeCurrentRoom()，再创建并进入新房间
3. 不要在 complete() 方法内部调用 completeCurrentRoom()（会循环）
4. UI 驱动 vs 自动进行：
   - 水池、事件、黑市：UI 驱动，process() 为空
   - 战斗：自动进行，process() 包含战斗逻辑
5. 房间选择是必经之路，大部分房间完成后都要进入房间选择
6. 每次进入房间，楼层会自动前进，房间选择时使用 layer + 1 作为目标层级











## 高级：房间注册系统

位置：`src/static/registry/roomRegistry.ts`

房间注册系统是一个两层注册机制，用于管理房间类型和房间配置，支持动态创建房间实例和 mod 扩展。

### 两层注册机制

第一层：注册房间类型 RoomType

将类型字符串映射到房间类

```typescript
roomRegistry.registerRoomType("battle", BattleRoom)
roomRegistry.registerRoomType("event", EventRoom)
```

第二层：注册房间配置 RoomConfig

定义具体的房间实例配置

```typescript
roomRegistry.registerRoomConfig({
    key: "battle_elite_001",
    type: "battle",
    name: "精英战斗：守卫",
    description: "强大的守卫挡住了去路",
    customData: {
        battleType: "elite",
        enemyConfigs: [{ key: "enemy_guard", level: 5 }]
    }
})
```

### 工作流程

FloorManager 生成房间时的完整流程：

```typescript
// 1. FloorManager 根据规则决定房间类型
const roomType = floorManager.determineNextRoomType()  // 返回 "battle"

// 2. 获取该类型的所有可用配置
const availableRooms = roomRegistry.getRoomConfigsByType("battle")
// 返回：[{ key: "battle_elite_001", ... }, { key: "battle_elite_002", ... }]

// 3. 随机选择一个配置
const selectedKey = availableRooms[randomIndex].key  // "battle_elite_001"

// 4. 创建房间实例
const room = roomRegistry.createRoom("battle_elite_001", currentLayer)
```

createRoom 内部实现：

```typescript
createRoom(key: string, layer: number): Room {
    // 1. 查找配置
    const config = this.getRoomConfig(key)  // { key: "battle_elite_001", type: "battle", ... }

    // 2. 查找类型注册信息
    const typeReg = this.getRoomType(config.type)  // { roomClass: BattleRoom, ... }

    // 3. 使用类创建实例
    const room = new typeReg.roomClass({ ...config, layer })

    return room
}
```

### 注册系统的作用

1. 解耦类型和配置

房间类型是代码层面的类，房间配置是数据层面的实例定义

2. 支持随机生成

FloorManager 可以从同类型的多个配置中随机选择

3. 支持 mod 扩展

Mod 可以注册新类型和新配置，无需修改核心代码

4. 统一创建入口

所有房间实例都通过 createRoom 创建，便于管理和调试

### 核心 API

注册房间类型

```typescript
roomRegistry.registerRoomType(
    type: string,              // 类型标识，如 "battle"
    roomClass: RoomConstructor, // 房间类，如 BattleRoom
    defaultComponent?: Component // 默认 Vue 组件（可选）
): void
```

注册房间配置

```typescript
roomRegistry.registerRoomConfig(config: RoomMap): void

interface RoomMap {
    key: string                    // 房间唯一标识
    type: RoomType | string        // 房间类型
    name?: string                  // 房间名称
    description?: string           // 房间描述
    component?: RoomComponent      // 房间组件（可选）
    customData?: Record<string, any> // 自定义数据
}
```

批量注册配置

```typescript
roomRegistry.registerRoomConfigs(configs: RoomMap[]): void
```

创建房间实例

```typescript
roomRegistry.createRoom(
    key: string,                   // 房间配置 key
    layer: number,                 // 层级
    additionalConfig?: Record<string, any> // 额外配置
): Room | null
```

查询 API

```typescript
// 获取类型注册信息
roomRegistry.getRoomType(type: string): RoomTypeRegistration | undefined

// 获取房间配置
roomRegistry.getRoomConfig(key: string): RoomMap | undefined

// 获取所有配置
roomRegistry.getAllRoomConfigs(): RoomMap[]

// 按类型获取配置列表
roomRegistry.getRoomConfigsByType(type: RoomType | string): RoomMap[]
```

### 模块化注册结构

位置：`src/static/registry/rooms/`

每种房间类型有独立的注册模块

```
src/static/registry/rooms/
├── initBattleRooms.ts      # 战斗房间注册
├── initEventRooms.ts       # 事件房间注册
├── initPoolRooms.ts        # 水池房间注册
├── initBlackStoreRooms.ts  # 黑市房间注册
└── initRoomSelectRooms.ts  # 房间选择注册
```

每个模块负责：
- 注册自己的房间类型
- 注册自己的房间配置
- 导出 initXxxRooms() 函数

具体的注册实现请参见各房间类型的文档：
- 战斗房间：参见 `文档/对象/房间/战斗.md`
- 事件房间：参见 `文档/对象/房间/事件.md`
- 水池房间：参见 `文档/对象/房间/水池.md`
- 黑市房间：参见 `文档/对象/房间/黑市BlackStore.md`

### Mod 扩展接口

位置：`src/static/registry/initRoomRegistry.ts`

注册自定义房间类型

```typescript
import { registerCustomRoomType } from '@/static/registry/initRoomRegistry'

// 定义自定义房间类
class MyCustomRoom extends Room {
    // 实现 Room 接口
}

// 注册类型
registerCustomRoomType("myCustom", MyCustomRoom)
```

注册自定义房间配置

```typescript
import { registerCustomRoom } from '@/static/registry/initRoomRegistry'

registerCustomRoom({
    key: "my_custom_room_001",
    type: "myCustom",
    name: "我的自定义房间",
    description: "这是一个自定义房间",
    customData: {
        // 自定义数据
    }
})
```

完整的 Mod 扩展流程

```typescript
// 1. 定义房间类
class TreasureRoom extends Room {
    async enter() {
        console.log("进入宝藏房间")
    }

    async process() {
        // 房间逻辑
    }

    async complete() {
        // 完成逻辑
    }

    async exit() {
        // 清理逻辑
    }
}

// 2. 注册房间类型
registerCustomRoomType("treasure", TreasureRoom)

// 3. 注册多个房间配置
registerCustomRoom({
    key: "treasure_gold",
    type: "treasure",
    name: "黄金宝藏",
    customData: { rewardType: "gold", amount: 500 }
})

registerCustomRoom({
    key: "treasure_relic",
    type: "treasure",
    name: "遗物宝藏",
    customData: { rewardType: "relic" }
})

// 4. FloorManager 会自动识别并生成这些房间
```

### 初始化时机

房间注册在应用启动时完成

```typescript
// main.ts
import { initAllRooms } from '@/static/registry/roomRegistry'

async function initApp() {
    // 1. 预加载懒加载模块
    await preloadAllLazyModules()

    // 2. 初始化房间注册表
    await initAllRooms()

    // 3. 启动应用
    app.mount('#app')
}
```

initAllRooms 执行流程

```typescript
export async function initAllRooms() {
    // 导入各个房间类型的注册模块
    const { initBattleRooms } = await import('./rooms/initBattleRooms')
    const { initEventRooms } = await import('./rooms/initEventRooms')
    const { initPoolRooms } = await import('./rooms/initPoolRooms')
    const { initBlackStoreRooms } = await import('./rooms/initBlackStoreRooms')
    const { initRoomSelectRooms } = await import('./rooms/initRoomSelectRooms')

    // 依次初始化各个房间类型
    await initBattleRooms()
    await initEventRooms()
    await initPoolRooms()
    await initBlackStoreRooms()
    await initRoomSelectRooms()
}
```

### 注意事项

1. 类型必须先注册

必须先调用 registerRoomType，再注册该类型的配置

2. key 必须唯一

每个房间配置的 key 必须全局唯一，重复会被覆盖

3. customData 的使用

customData 会被合并到房间构造函数的 config 参数中，房间类可以通过 config 访问

```typescript
class BattleRoom extends Room {
    constructor(config: any) {
        super(config)
        // 可以访问 config.customData.battleType
        this.battleType = config.customData?.battleType || "normal"
    }
}
```

4. 动态创建 vs 直接 new

推荐使用 roomRegistry.createRoom 而不是直接 new，这样可以利用注册系统的配置管理

```typescript
// 推荐
const room = roomRegistry.createRoom("battle_elite_001", layer)

// 不推荐（除非有特殊需求）
const room = new BattleRoom({ type: "battle", layer, ... })
```

5. FloorManager 只识别注册的配置

如果配置没有注册，FloorManager 无法随机选择该房间

## 文件位置

房间类：`src/core/objects/room/`
- BattleRoom.ts
- EventRoom.ts
- PoolRoom.ts
- BlackStoreRoom.ts
- RoomSelectRoom.ts

系统管理：
- FloorManager.ts - `src/core/objects/game/FloorManager.ts`
- GameRun.ts - `src/core/objects/system/GameRun.ts`
- RoomGenerationRules.ts - `src/core/objects/system/RoomGenerationRules.ts`

配置文件：
- roomList.ts - `src/static/list/room/roomList.ts`
- eventList.ts - `src/static/list/event/eventList.ts`
- eventEffectMap.ts - `src/static/list/event/eventEffectMap.ts`
- blackStoreItemPool.ts - `src/static/list/blackStore/blackStoreItemPool.ts`

注册表：
- roomRegistry.ts - `src/static/registry/roomRegistry.ts`
- roomComponentRegistry.ts - `src/ui/registry/roomComponentRegistry.ts`

UI 组件：`src/ui/page/Scene/running/`
- Battle.vue
- EventRoom.vue
- PoolRoom.vue
- BlackStoreRoom.vue
- RoomSelectRoom.vue
