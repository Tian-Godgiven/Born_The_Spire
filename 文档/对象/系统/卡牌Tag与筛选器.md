[toc]

# 卡牌Tag与筛选器系统

## Tag系统

Tag（标签）是卡牌的分类标识，用于筛选、识别和触发特定效果。所有卡牌（玩家和敌人）都可以拥有tag。

### Tag vs 词条

**Tag（标签）：**
- 卡牌的分类标识
- 用于筛选和识别
- 不影响卡牌行为
- 示例：`attack`、`skill`、`basic`

**Entry（词条）：**
- 影响卡牌行为的修饰器
- 会创建触发器等副作用
- 示例：`exhaust`（消耗）、`void`（虚无）

两者可以同时存在：
```typescript
{
  key: "card_001",
  label: "打击",
  tags: ["attack", "basic"],  // 分类标签
  entry: ["exhaust"],          // 行为词条
  // ...
}
```

### 标准Tag类型

**类型tag（互斥，每张卡只能有一个）：**
- `attack` - 攻击牌（造成伤害）
- `skill` - 技能牌（提供格挡、抽牌等）
- `power` - 能力牌（持续效果）

**特性tag（可叠加）：**
- `basic` - 基础牌（初始卡组）
- `curse` - 诅咒牌
- `status` - 状态牌（临时添加的牌）

**自定义tag：**
- Mod制作者可以添加自定义tag
- 用于特殊机制或效果触发

### 在卡牌数据中使用

```typescript
// CardMap 类型定义
type CardMap = {
  key: string
  label: string
  tags?: string[]  // 可选的标签数组
  entry?: string[] // 可选的词条数组
  // ... 其他属性
}

// 示例卡牌
{
  key: "original_card_00001",
  label: "打击",
  tags: ["attack", "basic"],
  describe: ["造成", { key: ["status", "damage"] }, "点伤害"],
  // ...
}
```

## CardSelector 筛选器系统

CardSelector 用于在AI配置、效果触发等场景中筛选卡牌。

### 数据结构

```typescript
type CardSelector = {
  key?: string                    // 指定具体卡牌key
  tags?: string[]                 // 标签列表（满足任一）
  organ?: string                  // 来源器官key
  effect?: string                 // 包含指定效果类型
  costRange?: [number, number]    // 费用范围 [min, max]
  count?: number                  // 选择数量（默认全部）
  random?: boolean                // 是否随机选择（默认false）
}
```

### 筛选逻辑

筛选器按以下顺序工作：
1. 从可用卡牌池开始
2. 应用所有条件（AND关系）
3. 如果指定count，选择指定数量
4. 如果random为true，随机选择

### 使用示例

**示例1：选择所有攻击牌**
```typescript
{
  tags: ["attack"]
}
```

**示例2：选择来自指定器官的卡牌**
```typescript
{
  organ: "original_organ_00002"
}
```

**示例3：随机选择1张费用0-2的攻击牌**
```typescript
{
  tags: ["attack"],
  costRange: [0, 2],
  count: 1,
  random: true
}
```

**示例4：选择具体卡牌**
```typescript
{
  key: "original_card_00001"
}
```

**示例5：选择所有可用卡牌**
```typescript
{}  // 空对象表示不筛选
```

## 在AI配置中使用

CardSelector 主要用于敌人AI的行为配置：

```typescript
// 敌人AI配置示例
behavior: [
  {
    // 条件：玩家血量低于50%
    condition: {
      playerHealth: { below: 50 }
    },
    // 行动：使用攻击牌
    action: {
      selector: {
        tags: ["attack"],
        count: 1,
        random: true
      }
    }
  },
  {
    // 默认行动：随机使用任意卡牌
    action: {
      selector: {
        count: 1,
        random: true
      }
    }
  }
]
```

## 实现要点

### 1. 筛选函数

```typescript
function selectCards(
  availableCards: Card[],
  selector: CardSelector
): Card[] {
  let filtered = availableCards

  // 按key筛选
  if (selector.key) {
    filtered = filtered.filter(card => card.key === selector.key)
  }

  // 按tags筛选（满足任一tag）
  if (selector.tags && selector.tags.length > 0) {
    filtered = filtered.filter(card =>
      card.tags?.some(tag => selector.tags!.includes(tag))
    )
  }

  // 按organ筛选
  if (selector.organ) {
    filtered = filtered.filter(card =>
      card.sourceOrgan?.key === selector.organ
    )
  }

  // 按费用范围筛选
  if (selector.costRange) {
    const [min, max] = selector.costRange
    filtered = filtered.filter(card => {
      const cost = getStatusValue(card, "cost")
      return cost >= min && cost <= max
    })
  }

  // 随机选择
  if (selector.random) {
    filtered = shuffle(filtered)
  }

  // 限制数量
  if (selector.count !== undefined) {
    filtered = filtered.slice(0, selector.count)
  }

  return filtered
}
```

### 2. 卡牌来源追踪

CardModifier 在添加卡牌时需要记录来源器官：

```typescript
// 在 CardModifier 中
addCardsFromSource(source: Entity, cardKeys: string[]) {
  const cards = cardKeys.map(key => {
    const card = getCardByKey(key)
    card.sourceOrgan = source  // 记录来源
    return card
  })
  // ...
}
```

### 3. Tag验证

建议添加tag验证，确保使用的是标准tag：

```typescript
const STANDARD_TAGS = [
  "attack", "skill", "power",
  "basic", "curse", "status"
]

function validateTags(tags: string[]) {
  const unknownTags = tags.filter(tag =>
    !STANDARD_TAGS.includes(tag)
  )
  if (unknownTags.length > 0) {
    console.warn("使用了非标准tag:", unknownTags)
  }
}
```

## 扩展性

### 自定义Tag

Mod制作者可以添加自定义tag：

```typescript
// 在mod中注册自定义tag
registerCustomTag("elemental")  // 元素牌
registerCustomTag("combo")      // 连击牌

// 在卡牌中使用
{
  key: "mod_card_001",
  label: "火球术",
  tags: ["attack", "elemental"],  // 使用自定义tag
  // ...
}
```

### 复杂筛选

未来可以扩展更复杂的筛选条件：

```typescript
type CardSelector = {
  // ... 现有字段

  // 扩展字段
  excludeTags?: string[]          // 排除指定tag
  minCost?: number                // 最小费用
  maxCost?: number                // 最大费用
  hasEntry?: string[]             // 包含指定词条
  customFilter?: (card: Card) => boolean  // 自定义筛选函数
}
```

## 相关文件

- `Card.ts` - 卡牌基础类
- `CardModifier.ts` - 卡牌管理器
- `cardList.ts` - 卡牌数据定义
- `Enemy.ts` - 敌人类（使用CardSelector）
