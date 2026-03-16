# 地图配置系统使用指南

本文档说明如何使用地图配置系统来完全自定义地图结构。

## 配置优先级

配置的优先级从高到低：

1. **layerLayouts** - 层级布局（完全控制某一层）
2. **layerSpecificWeights** - 层级特定权重
3. **roomTypeWeights** - 默认权重
4. **roomTypeConstraints** - 房间类型约束（全局验证）

## 基础配置

### 1. 地图结构

```typescript
{
  layers: 15,  // 总层数

  nodesPerLayer: {
    min: 3,  // 每层最少3个节点
    max: 7   // 每层最多7个节点
  },

  connectionDensity: {
    min: 1,  // 每个节点至少连接1个下层节点
    max: 3   // 每个节点最多连接3个下层节点
  }
}
```

### 2. 房间类型权重（默认）

```typescript
{
  roomTypeWeights: {
    battle: 50,       // 普通战斗：50%
    eliteBattle: 10,  // 精英战斗：10%
    event: 20,        // 事件：20%
    pool: 10,         // 休息点：10%
    blackStore: 10    // 商店：10%
  }
}
```

## 高级配置

### 3. 层级特定权重

为不同层级设置不同的房间类型权重：

```typescript
{
  layerSpecificWeights: {
    // 第1层：80%战斗，20%事件
    0: {
      battle: 80,
      event: 20,
      pool: 0,
      blackStore: 0
    },

    // 第5层：开始出现商店
    4: {
      battle: 50,
      event: 20,
      pool: 10,
      blackStore: 20
    },

    // 第10层：精英战斗增多
    9: {
      battle: 30,
      eliteBattle: 30,
      event: 20,
      pool: 10,
      blackStore: 10
    }
  }
}
```

### 4. 层级布局（完全控制）

#### 模式1：指定具体房间列表

```typescript
{
  layerLayouts: {
    // 第3层：固定为这3个具体房间
    2: {
      roomKeys: [
        "battle_normal_slime",
        "battle_normal_cultist",
        "event_shrine"
      ]
    }
  }
}
```

#### 模式2：指定房间类型列表

```typescript
{
  layerLayouts: {
    // 第4层：1个事件 + 2个战斗 + 1个休息点
    3: {
      roomTypes: ["event", "battle", "battle", "pool"]
    }
  }
}
```

具体房间会从对应类型的房间池中随机选择。

#### 模式3：混合模式

```typescript
{
  layerLayouts: {
    // 第5层：混合配置
    4: {
      nodes: [
        { roomKey: "battle_boss_slime" },  // 固定：史莱姆Boss
        { roomType: "event" },             // 随机：任意事件
        { roomType: "battle" },            // 随机：任意战斗
        { roomKey: "event_shrine" }        // 固定：神龛事件
      ]
    }
  }
}
```

#### 模式4：部分固定 + 自动填充

```typescript
{
  layerLayouts: {
    // 第6层：前3个固定，剩余2个自动生成
    5: {
      roomTypes: ["battle", "event", "pool"],
      nodeCount: 5  // 总共5个节点，剩余2个按默认规则生成
    }
  }
}
```

### 5. 房间类型约束

#### 最大/最小数量

```typescript
{
  roomTypeConstraints: {
    minCount: {
      pool: 3,        // 整个地图至少3个休息点
      blackStore: 2,  // 整个地图至少2个商店
      event: 5        // 整个地图至少5个事件
    },

    maxCount: {
      eliteBattle: 5,  // 整个地图最多5个精英战斗
      blackStore: 4    // 整个地图最多4个商店
    }
  }
}
```

#### 不允许连续

```typescript
{
  roomTypeConstraints: {
    // 这些类型不能在路径上连续出现
    noConsecutive: ["pool", "blackStore", "event"]
  }
}
```

例如：玩家不能连续进入 休息点 → 休息点

#### 最小间隔

```typescript
{
  roomTypeConstraints: {
    minSpacing: {
      pool: 3,        // 两个休息点之间至少间隔3层
      blackStore: 4   // 两个商店之间至少间隔4层
    }
  }
}
```

## 完整示例

### 示例1：标准15层地图

```typescript
const standardMapConfig: FloorMapConfig = {
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

  layerLayouts: {
    0: { roomTypes: ["battle", "battle", "battle"] },
    14: { roomTypes: ["pool", "pool", "pool"] },
    15: { roomKeys: ["battle_boss_slime_king"] }
  },

  roomTypeConstraints: {
    minCount: { pool: 3, blackStore: 2 },
    maxCount: { eliteBattle: 5 },
    noConsecutive: ["pool", "blackStore"]
  },

  roomPools: { /* ... */ }
}
```

### 示例2：短地图（5层）

```typescript
const shortMapConfig: FloorMapConfig = {
  layers: 5,

  nodesPerLayer: { min: 2, max: 4 },
  connectionDensity: { min: 1, max: 2 },

  roomTypeWeights: {
    battle: 60,
    event: 30,
    pool: 10,
    blackStore: 0  // 不出现商店
  },

  layerLayouts: {
    0: { roomTypes: ["battle", "battle"] },
    2: { roomTypes: ["pool", "pool"] },  // 中间休息
    4: { roomKeys: ["battle_boss_mini"] }
  },

  roomPools: { /* ... */ }
}
```

### 示例3：完全自定义地图

```typescript
const customMapConfig: FloorMapConfig = {
  layers: 10,

  nodesPerLayer: { min: 3, max: 3 },  // 固定3个节点
  connectionDensity: { min: 2, max: 2 },  // 固定2个连接

  // 每一层都完全自定义
  layerLayouts: {
    0: { roomKeys: ["battle_tutorial_1", "battle_tutorial_2", "event_tutorial"] },
    1: { roomTypes: ["battle", "battle", "event"] },
    2: { roomTypes: ["battle", "event", "pool"] },
    3: { roomKeys: ["battle_elite_1", "event_special", "blackStore_1"] },
    4: { roomTypes: ["battle", "battle", "pool"] },
    5: { roomKeys: ["battle_miniboss_1", "battle_miniboss_2", "pool"] },
    6: { roomTypes: ["battle", "event", "blackStore"] },
    7: { roomTypes: ["battle", "battle", "event"] },
    8: { roomTypes: ["pool", "pool", "pool"] },  // 全休息
    9: { roomKeys: ["battle_boss_final"] }  // 只有1个Boss
  },

  roomPools: { /* ... */ }
}
```

### 示例4：无尽模式

```typescript
const endlessMapConfig: FloorMapConfig = {
  layers: 50,  // 50层

  nodesPerLayer: { min: 4, max: 8 },
  connectionDensity: { min: 1, max: 3 },

  // 随着层数增加，精英战斗越来越多
  layerSpecificWeights: {
    0: { battle: 80, event: 20, pool: 0, blackStore: 0 },
    10: { battle: 60, eliteBattle: 10, event: 20, pool: 5, blackStore: 5 },
    20: { battle: 40, eliteBattle: 30, event: 15, pool: 10, blackStore: 5 },
    30: { battle: 30, eliteBattle: 40, event: 15, pool: 10, blackStore: 5 },
    40: { battle: 20, eliteBattle: 50, event: 15, pool: 10, blackStore: 5 }
  },

  // 每10层一个休息点
  layerLayouts: {
    9: { roomTypes: ["pool", "pool", "pool"] },
    19: { roomTypes: ["pool", "pool", "pool"] },
    29: { roomTypes: ["pool", "pool", "pool"] },
    39: { roomTypes: ["pool", "pool", "pool"] },
    49: { roomKeys: ["battle_boss_endless"] }
  },

  roomTypeConstraints: {
    minCount: { pool: 10 },  // 至少10个休息点
    minSpacing: { pool: 5 }  // 休息点间隔至少5层
  },

  roomPools: { /* ... */ }
}
```

## Mod 制作指南

### 创建自定义地图

1. 创建配置文件：`myMod/maps/customMap.ts`

```typescript
import type { FloorMapConfig } from "@/core/types/FloorMapConfig"

export const myCustomMap: FloorMapConfig = {
  layers: 20,
  // ... 你的配置
}
```

2. 注册地图：

```typescript
import { floorRegistry } from "@/static/registry/floorRegistry"
import { myCustomMap } from "./maps/customMap"

floorRegistry.registerFloor({
  key: "my_custom_floor",
  mapConfig: myCustomMap
})
```

3. 使用地图：

```typescript
import { floorManager } from "@/core/objects/system/FloorManager"

// 生成地图
const map = floorManager.generateMap(myCustomMap)
```

## 注意事项

1. **layerLayouts 优先级最高**
   - 如果某一层配置了 layerLayouts，该层将完全按照配置生成
   - 忽略 roomTypeWeights 和 layerSpecificWeights

2. **约束验证**
   - roomTypeConstraints 在地图生成后验证
   - 如果不满足约束，会在控制台警告（但不会阻止生成）

3. **房间池**
   - 如果 roomPools 为空，会自动从 roomRegistry 填充
   - 确保你的房间已经注册到 roomRegistry

4. **连接生成**
   - 连接是自动生成的，基于节点的水平位置
   - 无法直接控制连接关系（未来可能添加）

5. **种子系统**
   - 目前 seed 配置还未实现
   - 未来会支持可重现的地图生成
