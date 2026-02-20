# 交互 Hooks

## cardChoice - 卡牌选择

用于在游戏中显示卡牌选择界面，支持单选、多选、筛选等功能。

### 基本用法

```typescript
import { showCardChoice } from "@/ui/hooks/interaction/cardChoice"
import { nowPlayer } from "@/core/objects/game/run"

// 单选卡牌
const cards = await showCardChoice({
  title: "选择要升级的卡牌",
  description: "选择一张卡牌进行升级",
  cards: nowPlayer.getCardGroup(),
  maxSelect: 1
})

if (cards.length > 0) {
  // 用户选择了卡牌
  upgradeCard(cards[0])
} else {
  // 用户取消了选择
}
```

### 多选模式

```typescript
// 多选卡牌（最多3张）
const cards = await showCardChoice({
  title: "选择要移除的卡牌",
  description: "最多选择3张卡牌移除",
  cards: nowPlayer.getCardGroup(),
  minSelect: 1,    // 至少选择1张
  maxSelect: 3,    // 最多选择3张
  cancelable: true // 允许取消
})

for (const card of cards) {
  removeCard(card)
}
```

### 使用筛选器

```typescript
// 只显示攻击牌
const cards = await showCardChoice({
  title: "选择攻击牌",
  cards: nowPlayer.cardPiles.handPile,
  filter: (card) => card.tags?.includes("attack") ?? false,
  maxSelect: 1
})

// 只显示费用为0的卡牌
const cards = await showCardChoice({
  title: "选择0费卡牌",
  cards: nowPlayer.getCardGroup(),
  filter: (card) => {
    const cost = getStatusValue(card, "cost")
    return cost === 0
  },
  maxSelect: 2
})
```

### 便捷 Hook 函数

项目提供了常见场景的封装函数

#### chooseFromRandomCards - 从随机卡牌中选择

```typescript
import { chooseFromRandomCards } from "@/ui/hooks/interaction/cardChoice"

// 从3张随机卡牌中选择1张
const cards = await chooseFromRandomCards(
  ["card_001", "card_002", "card_003", "card_004", "card_005"],  // 卡牌池
  3,  // 随机抽取3张
  1,  // 选择1张
  "选择奖励卡牌",
  "从3张随机卡牌中选择1张加入卡组"
)
```

#### chooseCardsToUpgrade - 选择升级卡牌

```typescript
import { chooseCardsToUpgrade } from "@/ui/hooks/interaction/cardChoice"

// 选择最多2张卡牌升级
const cards = await chooseCardsToUpgrade(player, 2)
for (const card of cards) {
  card.upgrade()
}
```

#### chooseCardsToRemove - 选择移除卡牌

```typescript
import { chooseCardsToRemove } from "@/ui/hooks/interaction/cardChoice"

// 选择1张卡牌移除（必选）
const cards = await chooseCardsToRemove(player, 1, 1)

// 选择最多3张卡牌移除（可选）
const cards = await chooseCardsToRemove(player, 3, 0)
```

#### chooseCardToDuplicate - 选择复制卡牌

```typescript
import { chooseCardToDuplicate } from "@/ui/hooks/interaction/cardChoice"

// 从手牌中选择一张复制
const cards = await chooseCardToDuplicate(player, "handPile")

// 从弃牌堆中选择一张复制
const cards = await chooseCardToDuplicate(player, "discardPile")
```

#### chooseCardsByTags - 按标签选择卡牌

```typescript
import { chooseCardsByTags } from "@/ui/hooks/interaction/cardChoice"

// 选择攻击牌
const cards = await chooseCardsByTags(player, ["attack"], 1)

// 选择攻击或技能牌
const cards = await chooseCardsByTags(player, ["attack", "skill"], 2)
```

### 配置选项

```typescript
type CardChoiceConfig = {
  title: string                    // 标题（必填）
  description?: string             // 描述文本
  cards: Card[]                    // 可选卡牌列表（必填）
  selector?: CardSelector          // 筛选器（未来支持）
  minSelect?: number               // 最少选择数量（默认0）
  maxSelect?: number               // 最多选择数量（默认1）
  cancelable?: boolean             // 是否可取消（默认true）
  filter?: (card: Card) => boolean // 自定义筛选函数
}
```

### 在事件效果中使用

项目提供了专门的 Effect 函数用于事件系统

#### chooseRandomCard - 从随机卡牌中选择并获得

```typescript
// 在事件配置中
{
  key: "chooseRandomCard",
  params: {
    cardKeys: ["card_001", "card_002", "card_003", "card_004"],
    count: 3,        // 随机抽取3张
    selectCount: 1,  // 选择1张
    title: "选择奖励",
    description: "从3张随机卡牌中选择1张"
  }
}
```

#### chooseCardUpgrade - 选择卡牌升级

```typescript
{
  key: "chooseCardUpgrade",
  params: {
    count: 2  // 最多升级2张
  }
}
```

#### chooseCardRemove - 选择卡牌移除

```typescript
{
  key: "chooseCardRemove",
  params: {
    count: 1,     // 最多移除1张
    minCount: 1   // 至少移除1张
  }
}
```

#### chooseCardDuplicate - 选择卡牌复制

```typescript
{
  key: "chooseCardDuplicate",
  params: {
    fromPile: "handPile"  // 从手牌中选择
  }
}
```

#### customCardChoice - 自定义卡牌选择

```typescript
{
  key: "customCardChoice",
  params: {
    title: "选择卡牌",
    description: "选择一张卡牌",
    cardKeys: ["card_001", "card_002"],  // 指定卡牌（可选）
    fromPile: "all",  // 或 "handPile" | "drawPile" | "discardPile"
    minSelect: 0,
    maxSelect: 1,
    cancelable: true,
    action: "gain"  // "gain" | "remove" | "upgrade" | "duplicate" | "none"
  }
}
```

### 注意事项

  单选和多选都需要点击"确认"按钮完成选择
  取消选择会返回空数组
  筛选后的卡牌列表为空时，界面仍会显示（显示空列表）
  Effect 函数会自动处理卡牌的获得/移除/升级等操作
  使用 customCardChoice 时，可以通过 event.getEventResult("selectedCards") 获取选中的卡牌

