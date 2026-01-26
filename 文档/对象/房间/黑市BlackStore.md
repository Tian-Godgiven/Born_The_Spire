# 黑市 BlackStore

房间的一种

*进行着可疑交易的窝点*

## 基本信息

层级内，概率出现的特殊房间，每层的数量为1~4个，在后半层出现的概率更大。

在黑市中，使用金钱或生命来进行交易。

## 金钱获取方式

	在黑市中出售物质，随着售出次数增加不断贬值
	在黑市中出售器官，根据器官的等级和稀有度决定售价（售价约为购买价的 50-70%）
	在黑市中出售生命值，基础价格 1生命 = 5金钱，每次售出后降低 20%
	通过部分事件/遗物/器官的效果获取

## 黑市功能

### 购买商品

黑市提供三类商品：器官、遗物、药水

商品数量（默认配置）：
	器官：5 个
	遗物：3 个
	药水：3 个

商品价格：
	器官：根据稀有度和等级计算（使用 `calculateBlackStorePrice` 函数）
	遗物：固定 200 金币（TODO: 未来会根据稀有度计算）
	药水：固定 75 金币

购买流程：
	1. 检查玩家金钱是否足够
	2. 扣除金钱
	3. 给予商品（器官/遗物/药水）
	4. 标记商品为已售出

### 出售器官

玩家可以出售自己拥有的器官以换取金钱

售价计算：
	基础购买价格的 50-70%（随机）
	使用 `calculateOrganSellPrice` 计算

出售流程：
	1. 打开器官选择弹窗
	2. 显示所有可出售的器官及售价
	3. 选择器官确认出售
	4. 移除器官
	5. 给予金钱

### 出售生命值

玩家可以出售生命值以换取金钱

价格机制：
	基础价格：1生命 = 5金钱
	贬值机制：每次售出后降低 20%（`depreciationRate = 0.8^售出次数`）
	示例：
		第1次：10生命 = 50金钱
		第2次：10生命 = 40金钱
		第3次：10生命 = 32金钱

出售流程：
	1. 检查当前生命值是否足够（必须保留至少 1 点）
	2. 计算售价（考虑贬值）
	3. 扣除最大生命值和当前生命值
	4. 给予金钱
	5. 增加售出次数

注意：出售生命值会同时减少最大生命值和当前生命值

### 离开黑市

点击"离开黑市"按钮完成房间，进入房间选择

## 黑市物品池

位置：`src/static/list/room/blackStore/blackStoreItemPool.ts`

黑市商品从物品池中随机选择

### 物品池结构

```typescript
interface ItemPoolConfig<T> {
    items: T[]          // 物品列表
    weights?: number[]  // 权重列表（可选，默认均等）
}
```

三个物品池：
	`blackStoreOrganPool` - 器官池
	`blackStoreRelicPool` - 遗物池
	`blackStorePotionPool` - 药水池

### 物品池初始化

```typescript
function initBlackStoreItemPools(): void {
    // 从全局列表加载所有器官
    const organList = getLazyModule('organList')
    blackStoreOrganPool.items = [...organList]
    blackStoreOrganPool.weights = new Array(organList.length).fill(1)

    // 从全局列表加载所有遗物
    const relicList = getLazyModule('relicList')
    blackStoreRelicPool.items = [...relicList]

    // 从全局列表加载所有药水
    const potionList = getLazyModule('potionList')
    blackStorePotionPool.items = [...potionList]
}
```

默认情况下，所有器官/遗物/药水都会加入黑市池，权重均等

### 随机选择算法

```typescript
function selectRandomItemsFromPool<T>(
    pool: ItemPoolConfig<T>,
    count: number,
    allowDuplicate: boolean = false
): T[]
```

根据权重随机选择物品：
	计算总权重
	使用加权随机算法选择
	默认不允许重复（同一商品不会出现两次）

### 自定义物品池

Mod 制作者可以添加自定义物品到黑市池

```typescript
// 添加器官
addOrganToBlackStorePool(organ, weight)

// 添加遗物
addRelicToBlackStorePool(relic, weight)

// 添加药水
addPotionToBlackStorePool(potion, weight)
```

## 可配置项

```typescript
interface BlackStoreRoomConfig extends RoomConfig {
    type: "blackStore"
    organCount?: number         // 器官数量（默认 5）
    relicCount?: number         // 遗物数量（默认 3）
    potionCount?: number        // 药水数量（默认 3）
    allowSellOrgan?: boolean    // 是否允许出售器官（默认 true）
    allowSellHealth?: boolean   // 是否允许出售生命值（默认 true）
}
```

示例：创建特殊黑市

```typescript
const specialBlackStore = new BlackStoreRoom({
    type: "blackStore",
    layer: 5,
    organCount: 10,         // 更多器官
    relicCount: 5,          // 更多遗物
    allowSellHealth: false  // 禁止出售生命值
})
```

## 核心方法

### 购买相关

```typescript
// 购买商品
async purchaseItem(itemId: string): Promise<boolean>

// 获取商品列表
getStoreItems(): StoreItem[]

// 获取可购买的商品
getAvailableItems(): StoreItem[]

// 获取已售出数量
getSoldItemCount(): number
```

### 出售相关

```typescript
// 出售器官
async sellOrgan(organ: Organ): Promise<number>

// 出售生命值
async sellHealth(amount: number): Promise<number>

// 获取生命值售价预览
getHealthSellPricePreview(amount: number): number

// 获取生命值售出次数
getHealthSoldCount(): number
```

## 商品接口

```typescript
interface StoreItem {
    id: string                      // 商品唯一标识
    type: StoreItemType             // 商品类型："organ" | "relic" | "potion"
    name: string                    // 商品名称
    description?: string            // 商品描述
    price: number                   // 价格（金钱）
    data: OrganMap | RelicMap | PotionMap  // 商品数据
    isPurchased: boolean            // 是否已购买
}
```

## UI 实现

位置：`src/ui/page/Scene/running/BlackStoreRoom.vue`

### 界面布局

	黑市标题和描述
	器官商品区域（网格布局）
	遗物商品区域（网格布局）
	药水商品区域（网格布局）
	出售区域（出售器官、出售生命值）
	离开按钮

### 商品显示

每个商品卡片显示：
	价格（右上角）
	商品名称
	商品描述
	已售出标记（如果已购买）

样式特性：
	可购买的商品：绿色边框
	已售出的商品：半透明 + 红色"已售出"标记
	悬停效果：浅灰色背景

### 出售器官弹窗

点击"出售器官"打开模态弹窗：
	显示所有可出售的器官
	显示每个器官的售价
	点击器官确认出售
	点击"取消"关闭弹窗

## 相关文件

核心逻辑：
	BlackStoreRoom.ts - `src/core/objects/room/BlackStoreRoom.ts`
	blackStoreItemPool.ts - `src/static/list/room/blackStore/blackStoreItemPool.ts`

UI 组件：
	BlackStoreRoom.vue - `src/ui/page/Scene/running/BlackStoreRoom.vue`

价格计算：
	organQuality.ts - `src/static/list/target/organQuality.ts`（`calculateBlackStorePrice` 函数）

## 注意事项

	1. **金钱系统**：黑市是游戏中主要的金钱消费场所，需要平衡金钱获取和消费
	2. **贬值机制**：出售生命值的贬值机制防止玩家无限刷金钱
	3. **商品不重复**：同一黑市中不会出现重复的商品
	4. **生命值保护**：出售生命值时必须保留至少 1 点，防止玩家自杀
	5. **器官售价随机**：器官售价有 50-70% 的随机范围，增加不确定性
	6. **物品池初始化**：物品池需要在应用启动时初始化（调用 `initBlackStoreItemPools`）

## 黑市房间注册

位置：`src/static/registry/rooms/initBlackStoreRooms.ts`

黑市房间的注册包括类型注册和配置注册

### 类型注册

```typescript
import { BlackStoreRoom } from "@/core/objects/room/BlackStoreRoom"
import { roomRegistry } from "../roomRegistry"

roomRegistry.registerRoomType("blackStore", BlackStoreRoom)
```

### 配置注册

黑市房间注册默认配置

```typescript
roomRegistry.registerRoomConfig({
    key: "blackStore_default",
    type: "blackStore",
    name: "黑市",
    description: "神秘的黑市商人"
})
```

### 配置文件位置

黑市房间类：`src/core/objects/room/BlackStoreRoom.ts`
黑市房间 UI：`src/ui/page/Scene/running/BlackStoreRoom.vue`
黑市物品池：`src/static/list/blackStore/blackStoreItemPool.ts`

### 自定义黑市配置

可以注册自定义的黑市配置

```typescript
roomRegistry.registerRoomConfig({
    key: "blackStore_special",
    type: "blackStore",
    name: "特殊黑市",
    description: "提供稀有商品的黑市",
    customData: {
        // 自定义黑市配置
    }
})
```

配置会在应用启动时自动注册到房间注册表