# discoverCard 效果的随机数生成原理

本文档详细解释 `discoverCard` 效果内部是如何使用确定性随机数系统的。

## 完整调用链

```
用户使用卡牌
    ↓
触发 discoverCard 效果
    ↓
discoverCard 函数 (src/core/effects/card/cardChoice.ts)
    ↓
chooseFromRandomCards 函数 (src/ui/hooks/interaction/cardChoice.ts)
    ↓
getContextRandom("chooseFromRandomCards") (src/core/hooks/random.ts)
    ↓
generateContextSeed("chooseFromRandomCards") (src/core/hooks/random.ts)
    ↓
new SeededRandom(seed) (src/core/utils/SeededRandom.ts)
    ↓
rng.shuffle(cardKeys) 或 rng.choice(cardKeys)
    ↓
返回随机选择的卡牌
```

## 第一步：discoverCard 效果函数

位置：`src/core/effects/card/cardChoice.ts`

```typescript
export const discoverCard: EffectFunc = async (event, effect) => {
  const target = Array.isArray(event.target) ? event.target[0] : event.target
  if (!(target instanceof Player)) return

  // 解析参数
  const {
    count = 3,              // 随机抽取数量
    selectCount = 1,        // 可选择数量
    tags = [],              // 筛选标签
    allowDuplicate = false, // 是否允许重复
    addToHand = true        // 是否加入手牌
  } = effect.params

  // 获取所有符合条件的卡牌key
  let availableCardKeys = cardList.map(card => card.key)

  // 按标签筛选
  if (tags.length > 0) {
    availableCardKeys = availableCardKeys.filter(key => {
      const cardData = cardList.find(c => c.key === key)
      return cardData?.tags?.some(tag => tags.includes(tag))
    })
  }

  // 调用随机选择函数
  const selectedCards = await chooseFromRandomCards(
    availableCardKeys,
    count,
    selectCount,
    "发现",
    `从 ${count} 张卡牌中选择 ${selectCount} 张`,
    allowDuplicate
  )

  // 将选中的卡牌加入手牌或卡组
  for (const card of selectedCards) {
    if (addToHand) {
      target.cardPiles.handPile.push(card)
    } else {
      const cardModifier = getCardModifier(target)
      cardModifier.addCardsFromSource(target, [card.key])
    }
  }
}
```

**职责**
  解析效果参数
  筛选符合条件的卡牌
  调用随机选择函数
  处理选中的卡牌

## 第二步：chooseFromRandomCards 函数

位置：`src/ui/hooks/interaction/cardChoice.ts`

```typescript
export async function chooseFromRandomCards(
  cardKeys: string[],
  count: number,
  selectCount: number | [number, number] = 1,
  title: string = "选择卡牌",
  description?: string,
  allowDuplicate: boolean = false
): Promise<Card[]> {
  // 关键：获取基于游戏状态的确定性随机数生成器
  const rng = getContextRandom("chooseFromRandomCards")

  let selectedKeys: string[]

  if (allowDuplicate) {
    // 允许重复：多次随机选择
    selectedKeys = []
    for (let i = 0; i < count; i++) {
      selectedKeys.push(rng.choice(cardKeys))
    }
  } else {
    // 不允许重复：洗牌后取前N张
    selectedKeys = rng.shuffle(cardKeys).slice(0, Math.min(count, cardKeys.length))
  }

  // 创建卡牌实例
  const cards = selectedKeys.map(key => getCardByKey(key))

  // 显示选择界面
  return showCardChoice({
    title,
    description,
    cards,
    minSelect: selectCount,
    maxSelect: selectCount,
    cancelable: false
  })
}
```

**职责**
  获取确定性随机数生成器
  使用生成器随机选择卡牌
  显示选择界面让玩家选择

**关键点**
  使用 `getContextRandom("chooseFromRandomCards")` 而不是 `Math.random()`
  这确保了相同的游戏状态会产生相同的随机结果

## 第三步：getContextRandom 函数

位置：`src/core/hooks/random.ts`

```typescript
export function getContextRandom(context?: string): SeededRandom {
    const seed = generateContextSeed(context)
    return new SeededRandom(seed)
}
```

**职责**
  生成包含游戏状态的种子字符串
  创建并返回随机数生成器实例

## 第四步：generateContextSeed 函数

位置：`src/core/hooks/random.ts`

```typescript
export function generateContextSeed(context?: string): string {
    const parts: string[] = []

    // 1. 游戏种子（基础种子）
    if (nowGameRun) {
        parts.push(`game:${nowGameRun.seed}`)
    }

    // 2. 当前层数
    if (nowGameRun) {
        parts.push(`floor:${nowGameRun.towerLevel}`)
    }

    // 3. 当前房间（使用房间历史长度作为房间索引）
    if (nowGameRun) {
        const roomIndex = nowGameRun.getCompletedRoomCount()
        parts.push(`room:${roomIndex}`)
    }

    // 4. 当前回合数（如果在战斗中）
    if (nowBattle.value) {
        parts.push(`turn:${nowBattle.value.turnNumber}`)
    }

    // 5. 额外上下文
    if (context) {
        parts.push(`ctx:${context}`)
    }

    return parts.join('|')
}
```

**职责**
  收集当前游戏状态信息
  组合成唯一的种子字符串

**种子组成部分**
  游戏种子：每局游戏的唯一标识
  层数：当前在第几层
  房间索引：当前是第几个房间
  回合数：当前是第几回合
  上下文：区分不同的随机事件

## 第五步：SeededRandom 类

位置：`src/core/utils/SeededRandom.ts`

```typescript
export class SeededRandom {
  private seed: number

  constructor(seed: string | number) {
    // 将字符串种子转换为数字
    if (typeof seed === 'string') {
      this.seed = this.hashString(seed)
    } else {
      this.seed = seed
    }
  }

  // 将字符串转换为数字哈希
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  // 生成下一个随机数 [0, 1)
  // 使用 Mulberry32 算法
  next(): number {
    this.seed += 0x6D2B79F5
    let t = this.seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  // 生成指定范围内的随机整数 [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  // 从数组中随机选择一个元素
  choice<T>(array: T[]): T {
    const index = this.nextInt(0, array.length - 1)
    return array[index]
  }

  // 打乱数组（Fisher-Yates shuffle）
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}
```

**职责**
  将种子字符串转换为数字
  使用 Mulberry32 算法生成确定性随机数
  提供便捷的随机操作方法

**关键特性**
  确定性：相同的种子产生相同的随机序列
  高质量：Mulberry32 算法保证随机性质量
  状态化：每次调用会改变内部状态

## 完整示例

假设当前游戏状态：
  游戏种子：`1234567890`
  当前层数：`1`
  已完成房间数：`0`（第一个房间）
  当前回合：`3`

### 第一次使用"发现"卡牌

```typescript
// 1. 生成种子字符串
const seed = "game:1234567890|floor:1|room:0|turn:3|ctx:chooseFromRandomCards"

// 2. 创建随机数生成器
const rng = new SeededRandom(seed)

// 3. 洗牌并选择前3张
const allCardKeys = ["card1", "card2", "card3", ..., "card100"]
const shuffled = rng.shuffle(allCardKeys)
const selected = shuffled.slice(0, 3)

// 结果：["card42", "card7", "card89"]
```

### 读档后再次使用

```typescript
// 游戏状态相同，种子字符串相同
const seed = "game:1234567890|floor:1|room:0|turn:3|ctx:chooseFromRandomCards"

// 创建相同的随机数生成器
const rng = new SeededRandom(seed)

// 洗牌结果完全相同
const shuffled = rng.shuffle(allCardKeys)
const selected = shuffled.slice(0, 3)

// 结果：["card42", "card7", "card89"]（完全相同）
```

### 下一回合使用

```typescript
// 回合数变化，种子字符串不同
const seed = "game:1234567890|floor:1|room:0|turn:4|ctx:chooseFromRandomCards"

// 创建不同的随机数生成器
const rng = new SeededRandom(seed)

// 洗牌结果不同
const shuffled = rng.shuffle(allCardKeys)
const selected = shuffled.slice(0, 3)

// 结果：["card15", "card63", "card28"]（不同的卡牌）
```

## 为什么支持 SL 大法

**确定性保证**
  相同的种子 → 相同的随机序列
  种子包含完整的游戏状态
  读档后游戏状态恢复 → 种子相同 → 随机结果相同

**状态隔离**
  不同的上下文产生不同的随机序列
  `"chooseFromRandomCards"` 和 `"battleReward"` 互不影响
  即使在同一回合，不同效果的随机结果也是独立的

**可预测性**
  玩家可以通过 SL 来"重抽"
  相同的时机使用相同的效果，结果可预测
  这是设计特性，不是 bug

## 如何在自己的效果中使用

### 方法1：使用便捷函数

```typescript
import { randomInt, randomChoice, randomChoices } from "@/core/hooks/random"

export const myEffect: EffectFunc = async (event, effect) => {
    // 随机整数
    const damage = randomInt(5, 10, "myEffect:damage")

    // 随机选择一个
    const item = randomChoice(items, "myEffect:selectItem")

    // 随机选择多个（不重复）
    const cards = randomChoices(allCards, 3, "myEffect:selectCards")
}
```

### 方法2：使用随机数生成器

```typescript
import { getContextRandom } from "@/core/hooks/random"

export const myEffect: EffectFunc = async (event, effect) => {
    // 获取生成器
    const rng = getContextRandom("myEffect")

    // 使用生成器的方法
    const value1 = rng.nextInt(1, 10)
    const value2 = rng.next()  // [0, 1)
    const item = rng.choice(items)
    const shuffled = rng.shuffle(items)

    // 派生独立的随机序列
    const rng2 = rng.derive("subContext")
    const value3 = rng2.nextInt(1, 10)
}
```

### 方法3：在效果参数中使用

```typescript
// 在卡牌定义中使用 $random 语法
{
    label: "随机打击",
    interaction: {
        use: {
            target: { faction: "enemy" },
            effects: [{
                key: "damage",
                params: { value: "$random[5,10]" }  // 自动使用确定性随机数
            }]
        }
    }
}
```

## 注意事项

**上下文的重要性**
  不同的效果应该使用不同的上下文
  避免使用相同的上下文导致随机结果相同
  推荐使用描述性的上下文名称

**随机数消耗顺序**
  每次调用 `next()` 或 `nextInt()` 都会改变生成器状态
  相同的调用顺序产生相同的随机序列
  改变调用顺序会改变随机结果

**性能考虑**
  每次调用 `getContextRandom()` 都会创建新实例
  如果需要多次使用，建议保存生成器实例

```typescript
// 不推荐：多次创建
const v1 = randomInt(1, 10, "ctx")
const v2 = randomInt(1, 10, "ctx")
const v3 = randomInt(1, 10, "ctx")

// 推荐：复用生成器
const rng = getContextRandom("ctx")
const v1 = rng.nextInt(1, 10)
const v2 = rng.nextInt(1, 10)
const v3 = rng.nextInt(1, 10)
```

## 相关文件

核心实现
  `src/core/utils/SeededRandom.ts` - 种子随机数生成器类
  `src/core/hooks/random.ts` - 随机数 Hook 函数
  `src/core/objects/system/GameRun.ts` - 游戏运行状态（包含游戏种子）

效果实现
  `src/core/effects/card/cardChoice.ts` - discoverCard 效果
  `src/ui/hooks/interaction/cardChoice.ts` - chooseFromRandomCards 函数

其他使用
  `src/core/hooks/variance.ts` - 数值波动系统
  `src/core/objects/system/effect/EffectFunc.ts` - 效果参数解析

文档
  `文档/未归档/种子随机数系统.md` - 系统详细文档
  `文档/未归档/如何在新效果中使用随机数.md` - 使用指南

## 总结

discoverCard 的随机数生成流程
  收集游戏状态（层数、房间、回合）
  组合成种子字符串
  创建确定性随机数生成器
  使用生成器洗牌或选择
  返回随机结果

支持 SL 大法的原理
  相同的游戏状态 → 相同的种子 → 相同的随机结果
  读档恢复游戏状态 → 种子相同 → 可以"重抽"

如何使用
  使用 `getContextRandom(context)` 获取生成器
  使用生成器的方法生成随机数
  或使用便捷函数 `randomInt`、`randomChoice` 等
