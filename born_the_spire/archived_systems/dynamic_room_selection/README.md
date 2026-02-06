# 动态房间选择系统（已归档）

## 归档说明

本系统是 Born The Spire 早期开发的动态房间选择系统，已于 2026-02-04 归档。

**归档原因：**
- 系统复杂度较高，需要复杂的概率计算来平衡房间出现频率
- 玩家无法提前规划路线，缺少战略深度
- 决定改用类似《杀戮尖塔》原版的预生成多路径地图系统

**未来用途：**
- 保留用于其他项目（如计划中的"劲爆3选1无尽地牢战斗游戏"）
- 作为动态房间生成的参考实现

## 系统概述

动态房间选择系统是一个基于规则的房间生成系统，每次玩家完成房间后，根据历史记录、层级配置和选择规则动态生成下一批房间选项。

### 核心特点

**动态生成：**
- 房间不是预先生成的，而是在玩家需要选择时实时计算
- 根据玩家的历史选择动态调整房间类型的出现概率

**规则驱动：**
- 使用多个选择规则（SelectionRule）协同工作
- 规则可以表达复杂的意图（必须包含、偏好、排除、数量限制等）
- 规则之间可以冲突，系统会自动解决冲突

**池管理：**
- 维护多个房间池（战斗、精英战斗、事件、商店、休息点）
- 追踪已使用的房间，避免重复
- 支持池耗尽策略（重置、允许重复、借用、跳过、报错）

**灵活配置：**
- 支持层级特定的房间池和生成规则
- 支持 roomLayout 配置（固定特定步数的房间）
- 支持自定义生成器函数

## 系统架构

### 核心组件

```
FloorManager (楼层管理器)
  ├── 追踪当前层级、房间历史
  ├── 根据规则计算房间权重
  └── 生成房间选项

RoomSelector (房间选择器)
  ├── 协调多个选择规则
  ├── 合并规则意图
  ├── 解决规则冲突
  └── 处理池耗尽

RoomPoolManager (房间池管理器)
  ├── 管理多个房间池
  ├── 追踪已使用的房间
  └── 支持序列化/反序列化

SelectionRule (选择规则)
  ├── DeduplicationRule (去重规则)
  ├── IncrementalProbabilityRule (递增概率规则)
  ├── PoolFrequencyRule (池频率规则)
  └── LayoutSelectionRule (布局选择规则)

RoomSelectRoom (房间选择房间)
  └── 特殊的房间类型，用于让玩家选择下一个房间
```

### 文件结构

**核心逻辑：**
- `src/core/objects/system/FloorManager.ts` - 楼层管理器（主要入口）
- `src/core/objects/system/RoomGenerationRules.ts` - 房间生成规则（旧版，基于权重）
- `src/core/objects/system/roomSelection/` - 新版选择系统
  - `types.ts` - 类型定义
  - `RoomSelector.ts` - 房间选择器
  - `RoomPoolManager.ts` - 房间池管理器
  - `SelectionRuleFactory.ts` - 规则工厂
  - `FloorSelectionState.ts` - 楼层选择状态
  - `rules/` - 具体规则实现
    - `DeduplicationRule.ts` - 去重规则
    - `IncrementalProbabilityRule.ts` - 递增概率规则
    - `PoolFrequencyRule.ts` - 池频率规则
    - `LayoutSelectionRule.ts` - 布局选择规则

**房间类型：**
- `src/core/objects/room/RoomSelectRoom.ts` - 房间选择房间

**UI 组件：**
- `src/ui/page/Scene/running/RoomSelectRoom.vue` - 房间选择界面

**配置：**
- `src/core/types/FloorConfig.ts` - 层级配置类型定义
- `src/static/list/floor/floorList.ts` - 层级配置数据

## 工作流程

### 1. 生成房间选项

```typescript
// 在 FloorManager 中
generateNextFloorRoomOptions(count: number = 3, player?: any): string[]
```

**流程：**
1. 检查 roomLayout 配置（最高优先级）
   - 如果当前步数匹配某个槽位，使用槽位配置
   - 支持固定房间、候选列表、按类型选择、自定义生成器

2. 应用房间生成规则
   - 使用层级特定规则或全局规则
   - 规则可以返回：固定房间列表、强制类型、权重配置

3. 根据权重随机生成
   - 计算房间类型权重（战斗、事件、休息点、商店）
   - 按权重随机选择类型
   - 为每个类型选择具体房间

4. 应用可用条件过滤
   - 检查房间的 availableCondition
   - 过滤掉不满足条件的房间

5. 处理池耗尽
   - 如果某类房间池耗尽，应用耗尽策略

### 2. 玩家选择房间

```typescript
// 在 RoomSelectRoom 中
async onRoomSelected(choice: Choice): Promise<void>
```

**流程：**
1. 创建 RoomSelectRoom 实例
2. 显示房间选项给玩家
3. 玩家点击选择
4. 完成 RoomSelectRoom
5. 进入选中的房间

### 3. 记录房间历史

```typescript
// 在 FloorManager 中
recordRoom(roomType: RoomType, roomKey?: string): void
```

**流程：**
- 记录房间类型到历史
- 记录房间 key 到已使用集合
- 用于后续的概率计算和去重

## 选择规则系统

### SelectionIntent（选择意图）

规则通过返回 SelectionIntent 来表达意图：

```typescript
interface SelectionIntent {
  mustHave?: Array<{
    type?: RoomType
    key?: string
    pool?: string[]
    count: number
  }>

  prefer?: Array<{
    type?: RoomType
    key?: string
    pool?: string[]
    count: number
    weight?: number
  }>

  maxCount?: {
    [roomType: string]: number
  }

  exclude?: string[]

  fallback?: 'random' | 'weighted' | ((roomPools: RoomPools) => string[])
}
```

### 规则类型

**DeduplicationRule（去重规则）：**
- 避免连续出现相同房间
- 追踪最近使用的房间
- 将最近使用的房间加入 exclude 列表

**IncrementalProbabilityRule（递增概率规则）：**
- 某类房间长时间未出现时，增加其出现概率
- 追踪每种房间类型的"饥饿度"
- 饥饿度越高，prefer 权重越高

**PoolFrequencyRule（池频率规则）：**
- 控制某类房间在一定步数内的出现频率
- 例如："每5步至少出现1次休息点"
- 如果频率不足，将该类型加入 mustHave

**LayoutSelectionRule（布局选择规则）：**
- 根据 roomLayout 配置生成固定布局
- 支持多种模式：固定房间、候选列表、按类型选择、自定义生成器

### 冲突解决

当多个规则产生冲突时，RoomSelector 会自动解决：

**优先级：**
1. `mustHave > exclude` - 必须包含的房间不会被排除
2. `exclude > prefer` - 排除的房间不会被偏好
3. `maxCount` 限制所有规则

## 池耗尽策略

当某类房间池耗尽时，可以配置不同的策略：

```typescript
interface ExhaustionStrategy {
  type: 'reset' | 'allow-repeat' | 'borrow' | 'skip' | 'error'
  borrowFrom?: string[]  // borrow 策略的配置
}
```

**策略说明：**
- `reset` - 重置池子，清空已使用记录
- `allow-repeat` - 允许重复，从原始池中选择
- `borrow` - 从其他类型借用（如从普通战斗借用到精英战斗）
- `skip` - 跳过，不生成该类型房间
- `error` - 抛出错误，停止游戏

## 配置示例

### 层级配置

```typescript
{
  key: "floor_1",
  order: 1,
  roomPools: {
    battles: ["battle_normal_slime", "battle_normal_cultist"],
    eliteBattles: ["battle_elite_lagavulin"],
    events: ["event_shrine", "event_merchant"],
    blackStores: ["blackStore_default"],
    pools: ["pool_default"]
  },

  // 房间布局（可选）
  roomLayout: [
    {
      step: 1,
      roomKey: "event_tutorial"  // 第1步固定是教程事件
    },
    {
      step: [6, 12],
      type: "pool",  // 第6步和第12步是休息点
      count: 1
    }
  ],

  // 耗尽策略（可选）
  exhaustionStrategies: {
    battles: { type: "reset" },
    events: { type: "allow-repeat" }
  },

  // 自定义生成规则（可选）
  roomGenerationRules: [
    {
      condition: (context) => context.consecutiveBattles >= 3,
      effect: (weights) => {
        weights.battle = 0
        weights.pool = 10
        return weights
      }
    }
  ]
}
```

### 房间可用条件

```typescript
{
  key: "event_boss_intro",
  type: "event",
  availableCondition: {
    floorKeys: ["floor_1"],  // 只在第1层出现
    steps: [14, 15],  // 只在第14或15步出现
    custom: (context) => {
      // 自定义条件
      return context.player.status.maxHealth.value > 50
    }
  }
}
```

## 优缺点分析

### 优点

**灵活性高：**
- 可以根据玩家状态动态调整房间生成
- 支持复杂的生成规则和条件
- 易于添加新的规则类型

**内存占用小：**
- 不需要预先生成整个地图
- 只在需要时计算房间选项

**可扩展性好：**
- 规则系统易于扩展
- 支持层级特定配置
- 支持自定义生成器

### 缺点

**复杂度高：**
- 概率平衡需要复杂的计算
- 规则之间可能产生冲突
- 难以预测生成结果

**玩家体验：**
- 玩家无法提前规划路线
- 缺少战略深度
- 每次选择都是"盲选"

**调试困难：**
- 随机性高，难以复现问题
- 规则交互复杂，难以追踪
- 需要大量测试才能平衡

## 与新系统的对比

### 动态选择系统（本系统）

**生成方式：** 实时计算
**玩家视野：** 只能看到当前选项
**战略深度：** 低（无法提前规划）
**实现复杂度：** 高（复杂的概率计算）
**调试难度：** 高（随机性强）

### 预生成地图系统（新系统）

**生成方式：** 预先生成整个地图
**玩家视野：** 可以看到多步路径
**战略深度：** 高（可以提前规划）
**实现复杂度：** 中（地图生成算法）
**调试难度：** 低（确定性强）

## 技术要点

### 1. 规则协调

RoomSelector 负责协调多个规则：
- 收集所有规则的意图
- 合并意图（mustHave、prefer、exclude、maxCount）
- 解决冲突（按优先级）
- 执行选择

### 2. 池管理

RoomPoolManager 管理房间池：
- 维护原始池和可用池
- 追踪已使用的房间
- 支持重置和序列化

### 3. 权重计算

FloorManager 计算房间类型权重：
- 基础权重（defaultRoomWeights）
- 应用生成规则修改权重
- 根据上下文动态调整

### 4. 上下文传递

SelectionContext 包含选择所需的所有信息：
- 当前层级信息（floorKey, floorOrder, step）
- 玩家状态（player）
- 房间历史（roomHistory）

## 使用示例

### 基础使用

```typescript
import { floorManager } from "@/core/objects/system/FloorManager"
import { nowPlayer } from "@/core/objects/game/run"

// 生成3个房间选项
const roomKeys = floorManager.generateNextFloorRoomOptions(3, nowPlayer)

// 创建房间选择房间
const roomSelectRoom = new RoomSelectRoom({
  type: "roomSelect",
  layer: floorManager.getCurrentFloor() + 1,
  roomKeys
})

// 进入房间选择
await nowGameRun.enterRoom(roomSelectRoom)
```

### 自定义规则

```typescript
import { SelectionRule, SelectionIntent } from "./types"

class MyCustomRule implements SelectionRule {
  getIntent(roomPools, count, context): SelectionIntent {
    // 如果玩家血量低，必须包含休息点
    if (context.player.current.health.value < 20) {
      return {
        mustHave: [{ type: "pool", count: 1 }]
      }
    }
    return {}
  }

  updateAfterSelection(selectedRooms, enteredRoom) {
    // 更新规则状态
  }
}
```

### 自定义生成器

```typescript
{
  roomLayout: [
    {
      step: "any",
      generator: (context) => {
        // 根据玩家状态动态生成
        if (context.player.status.gold.value > 100) {
          return ["blackStore_premium"]
        }
        return ["event_random"]
      }
    }
  ]
}
```

## 迁移到新系统

如果要将本系统迁移到其他项目，需要注意：

**依赖项：**
- Room 基类和房间类型系统
- FloorConfig 配置系统
- roomRegistry 房间注册表
- Choice 和 ChoiceGroup 选择系统

**可复用组件：**
- RoomSelector 和规则系统（核心逻辑）
- RoomPoolManager（池管理）
- SelectionRule 接口和具体规则实现

**需要调整：**
- 与游戏流程的集成方式
- UI 组件（根据新项目的 UI 风格）
- 配置格式（根据新项目的需求）

## 参考资料

**相关文件：**
- `文档/对象/房间/房间系统.md` - 房间系统文档
- `文档/对象/系统/楼层管理器.md` - 楼层管理器文档（如果存在）

**相关概念：**
- 房间类型（RoomType）
- 层级配置（FloorConfig）
- 选择系统（Choice/ChoiceGroup）

## 维护说明

本系统已归档，不再主动维护。如果需要使用或参考，请注意：

1. 代码可能与主项目的最新版本不兼容
2. 依赖的接口可能已经变化
3. 建议作为参考实现，而不是直接复制使用
4. 如果发现 bug，可以记录但不会修复

## 联系方式

如有问题或建议，请在项目 issue 中讨论。

---

归档日期：2026-02-04
归档版本：commit 77cb307
