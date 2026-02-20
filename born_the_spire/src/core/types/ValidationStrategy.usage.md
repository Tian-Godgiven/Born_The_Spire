# 验证策略配置指南

本文档说明如何配置地图生成的验证策略。

## 什么是验证策略？

地图生成后，系统会验证地图是否满足所有约束（如最小数量、最大数量、放置规则等）。验证策略决定了当地图不满足约束时应该如何处理。

## 配置项

```typescript
interface ValidationStrategy {
  maxRetries?: number           // 最大重试次数
  fixOnFailure?: boolean        // 失败后是否修正
  revalidateAfterFix?: boolean  // 修正后是否再次验证
  throwOnFailure?: boolean      // 失败时是否抛出错误
  customFix?: Function          // 自定义修正函数
}
```

## 默认配置（推荐）

```typescript
validationStrategy: {
  maxRetries: 3,           // 重试3次
  fixOnFailure: true,      // 失败后修正
  revalidateAfterFix: true, // 修正后验证
  throwOnFailure: false    // 不抛出错误
}
```

**行为：**
1. 生成地图
2. 验证约束
3. 如果不满足，重新生成（最多3次）
4. 如果3次都失败，修正地图
5. 修正后再次验证，输出警告
6. 返回地图（无论是否完全满足）

## 预设方案

### 方案1：严格模式

```typescript
validationStrategy: {
  maxRetries: 10,
  fixOnFailure: true,
  revalidateAfterFix: true,
  throwOnFailure: true  // 不满足就报错
}
```

**适用场景：**
- 约束非常重要，必须满足
- 开发/测试阶段，发现配置问题

**行为：**
- 最多重试10次
- 失败后修正
- 修正后如果仍不满足，抛出错误，阻止游戏

### 方案2：宽松模式

```typescript
validationStrategy: {
  maxRetries: 0,         // 不重试
  fixOnFailure: false,   // 不修正
  revalidateAfterFix: false,
  throwOnFailure: false
}
```

**适用场景：**
- 约束只是建议，不强制
- 追求性能，不在意约束
- 测试随机性

**行为：**
- 生成一次就返回
- 不满足约束也不管
- 只输出警告

### 方案3：快速修正

```typescript
validationStrategy: {
  maxRetries: 0,         // 不重试
  fixOnFailure: true,    // 直接修正
  revalidateAfterFix: false,
  throwOnFailure: false
}
```

**适用场景：**
- 追求性能
- 约束比较重要
- 可以接受修正后的"不自然"

**行为：**
- 生成一次
- 不满足就修正
- 不再验证，直接返回

### 方案4：平衡模式（默认）

```typescript
validationStrategy: {
  maxRetries: 3,
  fixOnFailure: true,
  revalidateAfterFix: true,
  throwOnFailure: false
}
```

**适用场景：**
- 大部分情况
- 平衡性能和质量

**行为：**
- 重试3次
- 失败后修正
- 修正后验证并警告

## 自定义修正函数

如果默认的修正逻辑不满足需求，可以提供自定义修正函数：

```typescript
validationStrategy: {
  maxRetries: 3,
  fixOnFailure: true,
  customFix: (map, violations, config) => {
    console.log("使用自定义修正逻辑")

    for (const violation of violations) {
      if (violation.type === "minCount") {
        // 自定义的修正逻辑
        myCustomFixForMinCount(map, violation, config)
      }
    }
  }
}
```

**参数：**
- `map`: FloorMap - 需要修正的地图
- `violations`: Violation[] - 违规列表
- `config`: FloorMapConfig - 地图配置

**注意：** `customFix` 只负责修正，验证和重试逻辑仍由系统控制。

**示例：自定义修正逻辑**

```typescript
function myCustomFix(map, violations, config) {
  for (const violation of violations) {
    if (violation.type === "minCount" && violation.roomType === "pool") {
      // 找到所有事件房间，改成休息点
      const eventNodes = map.getAllNodes().filter(n => n.roomType === "event")
      const needed = violation.needed

      for (let i = 0; i < needed && i < eventNodes.length; i++) {
        eventNodes[i].roomType = "pool"
        eventNodes[i].roomKey = selectRandomPoolRoom(config)
      }
    }
  }
}
```

## 完全自定义策略

如果需要完全控制验证流程（包括验证、重试、修正等），可以使用 `customStrategy`：

```typescript
validationStrategy: {
  customStrategy: (map, config, generateFn) => {
    console.log("使用完全自定义策略")

    // 完全自定义的验证和处理逻辑
    let attempts = 0
    let currentMap = map

    while (attempts < 5) {
      // 自定义验证
      const isValid = myCustomValidation(currentMap, config)

      if (isValid) {
        console.log(`✅ 第${attempts + 1}次验证通过`)
        return currentMap
      }

      // 自定义处理
      if (attempts < 3) {
        // 前3次：重新生成
        console.log(`❌ 第${attempts + 1}次验证失败，重新生成...`)
        currentMap = generateFn()
      } else {
        // 后2次：修正
        console.log(`❌ 第${attempts + 1}次验证失败，进行修正...`)
        myCustomFix(currentMap, config)
      }

      attempts++
    }

    // 5次都失败，返回最后一次的结果
    console.warn("⚠️ 5次尝试都失败，使用最后一次的结果")
    return currentMap
  }
}
```

**参数：**
- `map`: FloorMap - 第一次生成的地图
- `config`: FloorMapConfig - 地图配置
- `generateFn`: () => FloorMap - 地图生成函数（可用于重新生成）

**注意：** 如果提供了 `customStrategy`，所有其他配置（`maxRetries`、`fixOnFailure` 等）都会被忽略。

**使用场景：**

### 场景1：特殊的重试策略

```typescript
customStrategy: (map, config, generateFn) => {
  // 指数退避重试
  let attempts = 0
  let currentMap = map

  while (attempts < 10) {
    if (validateMap(currentMap)) {
      return currentMap
    }

    // 等待时间随尝试次数增加
    const waitTime = Math.pow(2, attempts) * 100
    console.log(`等待 ${waitTime}ms 后重试...`)
    // await sleep(waitTime)  // 如果支持异步

    currentMap = generateFn()
    attempts++
  }

  throw new Error("无法生成有效地图")
}
```

### 场景2：渐进式修正

```typescript
customStrategy: (map, config, generateFn) => {
  let currentMap = map

  // 第1阶段：尝试重新生成
  for (let i = 0; i < 3; i++) {
    if (validateMap(currentMap)) return currentMap
    currentMap = generateFn()
  }

  // 第2阶段：轻度修正
  console.log("尝试轻度修正...")
  lightFix(currentMap)
  if (validateMap(currentMap)) return currentMap

  // 第3阶段：重度修正
  console.log("尝试重度修正...")
  heavyFix(currentMap)
  if (validateMap(currentMap)) return currentMap

  // 第4阶段：强制修正
  console.log("强制修正...")
  forceFix(currentMap)
  return currentMap
}
```

### 场景3：多目标优化

```typescript
customStrategy: (map, config, generateFn) => {
  let bestMap = map
  let bestScore = evaluateMap(map)

  // 生成多个候选地图，选择最好的
  for (let i = 0; i < 10; i++) {
    const candidate = generateFn()
    const score = evaluateMap(candidate)

    if (score > bestScore) {
      bestMap = candidate
      bestScore = score
    }
  }

  console.log(`选择了得分最高的地图：${bestScore}`)
  return bestMap
}

function evaluateMap(map) {
  let score = 0

  // 评分标准1：满足约束
  if (validateConstraints(map)) score += 100

  // 评分标准2：房间分布均匀
  score += evaluateDistribution(map) * 50

  // 评分标准3：路径多样性
  score += evaluatePathDiversity(map) * 30

  return score
}
```

### 场景4：条件性策略

```typescript
customStrategy: (map, config, generateFn) => {
  // 根据配置选择不同的策略
  if (config.layers <= 10) {
    // 短地图：严格验证
    return strictValidationStrategy(map, config, generateFn)
  } else if (config.layers <= 30) {
    // 中等地图：平衡策略
    return balancedStrategy(map, config, generateFn)
  } else {
    // 长地图：宽松策略
    return relaxedStrategy(map, config, generateFn)
  }
}
```

### 场景5：带缓存的策略

```typescript
const mapCache = new Map()

customStrategy: (map, config, generateFn) => {
  // 使用配置的哈希作为缓存键
  const cacheKey = hashConfig(config)

  // 检查缓存
  if (mapCache.has(cacheKey)) {
    console.log("使用缓存的地图")
    return mapCache.get(cacheKey)
  }

  // 生成新地图
  let validMap = map
  let attempts = 0

  while (!validateMap(validMap) && attempts < 5) {
    validMap = generateFn()
    attempts++
  }

  // 缓存结果
  if (validateMap(validMap)) {
    mapCache.set(cacheKey, validMap)
  }

  return validMap
}
```

## 实际使用示例

### 示例1：标准游戏

```typescript
const gameMapConfig: FloorMapConfig = {
  layers: 15,
  // ... 其他配置

  validationStrategy: {
    maxRetries: 3,
    fixOnFailure: true,
    revalidateAfterFix: true,
    throwOnFailure: false
  }
}
```

### 示例2：挑战模式（严格约束）

```typescript
const challengeMapConfig: FloorMapConfig = {
  layers: 20,
  // ... 其他配置

  constraints: {
    global: {
      minCount: { pool: 5, blackStore: 3 },
      maxCount: { eliteBattle: 3 }
    }
  },

  validationStrategy: {
    maxRetries: 10,      // 多重试几次
    fixOnFailure: true,
    revalidateAfterFix: true,
    throwOnFailure: true  // 必须满足
  }
}
```

### 示例3：无尽模式（宽松约束）

```typescript
const endlessMapConfig: FloorMapConfig = {
  layers: 50,
  // ... 其他配置

  validationStrategy: {
    maxRetries: 1,       // 只重试1次
    fixOnFailure: false, // 不修正
    throwOnFailure: false
  }
}
```

### 示例4：教程模式（完全控制）

```typescript
const tutorialMapConfig: FloorMapConfig = {
  layers: 5,

  // 每一层都完全固定
  layerLayouts: {
    0: { roomKeys: ["battle_tutorial_1"] },
    1: { roomKeys: ["event_tutorial_1"] },
    2: { roomKeys: ["pool_tutorial"] },
    3: { roomKeys: ["battle_tutorial_2"] },
    4: { roomKeys: ["battle_boss_tutorial"] }
  },

  // 不需要验证（因为完全固定）
  validationStrategy: {
    maxRetries: 0,
    fixOnFailure: false,
    throwOnFailure: false
  }
}
```

## 调试技巧

### 查看验证结果

```typescript
import { floorManager } from "@/core/objects/system/FloorManager"

const map = floorManager.generateMap(config)

// 手动验证
const violations = validateConstraints(map, config.constraints)

if (violations.length > 0) {
  console.log("约束违规：")
  for (const v of violations) {
    console.log(`  - ${v.type}: ${v.message}`)
  }
}
```

### 测试不同策略

```typescript
// 测试严格模式
try {
  const strictMap = floorManager.generateMap({
    ...config,
    validationStrategy: {
      maxRetries: 5,
      fixOnFailure: true,
      throwOnFailure: true
    }
  })
  console.log("✅ 严格模式生成成功")
} catch (error) {
  console.error("❌ 严格模式生成失败:", error)
}

// 测试宽松模式
const relaxedMap = floorManager.generateMap({
  ...config,
  validationStrategy: {
    maxRetries: 0,
    fixOnFailure: false,
    throwOnFailure: false
  }
})
console.log("✅ 宽松模式生成完成（可能不满足约束）")
```

## 注意事项

1. **约束冲突**
   - 如果约束之间冲突（如 minCount 总和超过节点总数），无论如何都无法满足
   - 建议使用 `throwOnFailure: true` 在开发时发现问题

2. **性能考虑**
   - `maxRetries` 越大，性能越差
   - 建议在发布版本使用较小的值（1-3）

3. **修正的副作用**
   - 修正可能破坏其他规则（如父母房间规则）
   - 如果约束很复杂，建议使用自定义修正函数

4. **种子系统**
   - 如果使用种子系统，相同种子应该生成相同地图
   - 但如果触发了修正，可能导致结果不同
   - 建议种子模式使用 `fixOnFailure: false`

## 常见问题

**Q: 为什么我的约束总是不满足？**

A: 可能的原因：
1. 约束太严格（如 minCount 总和超过节点数）
2. 约束之间冲突（如同时要求 minCount 和 uniqueInLayer）
3. 权重配置不合理（某类房间权重太低）

解决方法：
- 使用 `throwOnFailure: true` 查看详细错误
- 检查约束配置是否合理
- 调整权重或增加 `maxRetries`

**Q: 修正后的地图看起来不自然怎么办？**

A: 修正逻辑是简单的替换，可能破坏地图的自然性。建议：
1. 增加 `maxRetries`，减少修正的概率
2. 使用自定义修正函数，实现更智能的修正
3. 调整约束，使其更容易满足

**Q: 如何完全禁用验证？**

A:
```typescript
validationStrategy: {
  maxRetries: 0,
  fixOnFailure: false,
  revalidateAfterFix: false,
  throwOnFailure: false
}
```

但不建议这样做，因为可能生成不合理的地图。
