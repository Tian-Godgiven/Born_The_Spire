import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Player } from "@/core/objects/target/Player"
import { chooseFromRandomCards, chooseCardsToUpgrade, chooseCardsToRemove, chooseCardToDuplicate, showCardChoice } from "@/ui/hooks/interaction/cardChoice"
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier"
import { Card } from "@/core/objects/item/Subclass/Card"
import { getCardByKey, cardList } from "@/static/list/item/cardList"

/**
 * 发现卡牌（从卡牌池中随机抽取并选择，加入手牌）
 *
 * @params {
 *   count?: number       - 随机抽取数量（默认3）
 *   selectCount?: number - 可选择数量（默认1）
 *   tags?: string[]      - 筛选标签（如 ["attack"]）
 *   allowDuplicate?: boolean - 是否允许重复（默认false）
 *   addToHand?: boolean  - 是否加入手牌（默认true，false则加入卡组）
 * }
 */
export const discoverCard: EffectFunc = async (event, effect) => {

  // target 可能是数组，取第一个
  const target = Array.isArray(event.target) ? event.target[0] : event.target

  if (!(target instanceof Player)) {
    return
  }

  const {
    count = 3,
    selectCount = 1,
    tags = [],
    allowDuplicate = false,
    addToHand = true
  } = effect.params


  // 获取所有符合条件的卡牌key
  let availableCardKeys = cardList.map(card => card.key)

  // 按标签筛选
  const tagsArray = Array.isArray(tags) ? tags : []
  if (tagsArray.length > 0) {
    availableCardKeys = availableCardKeys.filter(key => {
      const cardData = cardList.find(c => c.key === key)
      return cardData?.tags?.some((tag: string) => tagsArray.includes(tag)) ?? false
    })
  }

  // 随机选择卡牌
  const selectedCards = await chooseFromRandomCards(
    availableCardKeys,
    Number(count),
    Number(selectCount),
    "发现",
    `从 ${count} 张卡牌中选择 ${selectCount} 张`,
    Boolean(allowDuplicate)
  )

  // 将选中的卡牌加入手牌或卡组
  for (const card of selectedCards) {
    if (addToHand) {
      // 加入手牌
      target.cardPiles.handPile.push(card)
    } else {
      // 加入卡组
      const cardModifier = getCardModifier(target)
      cardModifier.addCardsFromSource(target, [card.key])
    }
  }
}

/**
 * 从随机卡牌中选择并获得
 *
 * @params {
 *   cardKeys: string[]  - 卡牌key列表
 *   count: number       - 随机抽取数量
 *   selectCount: number - 可选择数量（默认1）
 *   title?: string      - 标题
 *   description?: string - 描述
 *   allowDuplicate?: boolean - 是否允许重复（默认false）
 * }
 */
export const chooseRandomCard: EffectFunc = async (event, effect) => {
  const target = Array.isArray(event.target) ? event.target[0] : event.target
  if (!(target instanceof Player)) return

  const { cardKeys, count, selectCount = 1, title, description, allowDuplicate = false } = effect.params

  const selectedCards = await chooseFromRandomCards(
    Array.isArray(cardKeys) ? cardKeys as string[] : [],
    Number(count),
    Number(selectCount),
    String(title || "选择卡牌"),
    String(description || ""),
    Boolean(allowDuplicate)
  )

  // 将选中的卡牌添加到玩家卡组
  const cardModifier = getCardModifier(target)
  for (const card of selectedCards) {
    cardModifier.addCardsFromSource(target, [card.key])
  }
}

/**
 * 选择卡牌升级
 *
 * @params {
 *   count?: number - 可选择数量（默认1）
 * }
 */
export const chooseCardUpgrade: EffectFunc = async (event, effect) => {
  const target = Array.isArray(event.target) ? event.target[0] : event.target
  if (!(target instanceof Player)) return

  const { count = 1 } = effect.params

  const selectedCards = await chooseCardsToUpgrade(target, Number(count))

  // 升级选中的卡牌
  for (const card of selectedCards) {
    // TODO: 实现卡牌升级逻辑
    console.log(`升级卡牌: ${card.label}`)
  }
}

/**
 * 选择卡牌移除
 *
 * @params {
 *   count?: number    - 可选择数量（默认1）
 *   minCount?: number - 最少选择数量（默认0）
 * }
 */
export const chooseCardRemove: EffectFunc = async (event, effect) => {
  const target = Array.isArray(event.target) ? event.target[0] : event.target
  if (!(target instanceof Player)) return

  const { count = 1, minCount = 0 } = effect.params

  const selectedCards = await chooseCardsToRemove(target, Number(count), Number(minCount))

  // 移除选中的卡牌
  // const cardModifier = getCardModifier(target)
  for (const card of selectedCards) {
    // TODO: 实现 removeCard 方法
    console.log(`移除卡牌: ${card.label}`)
    // cardModifier.removeCard(card)
  }
}

/**
 * 选择卡牌复制
 *
 * @params {
 *   fromPile?: "handPile" | "drawPile" | "discardPile" - 从哪个牌堆选择（默认手牌）
 * }
 */
export const chooseCardDuplicate: EffectFunc = async (event, effect) => {
  const target = Array.isArray(event.target) ? event.target[0] : event.target
  if (!(target instanceof Player)) return

  const { fromPile = "handPile" } = effect.params
  const pile = String(fromPile) as "handPile" | "drawPile" | "discardPile"

  const selectedCards = await chooseCardToDuplicate(target, pile)

  if (selectedCards.length > 0) {
    const card = selectedCards[0]
    // 复制卡牌（添加一张相同的卡牌到卡组）
    const cardModifier = getCardModifier(target)
    cardModifier.addCardsFromSource(target, [card.key])
  }
}

/**
 * 自定义卡牌选择
 *
 * @params {
 *   title: string
 *   description?: string
 *   cardKeys?: string[]  - 指定卡牌key列表（可选）
 *   fromPile?: "handPile" | "drawPile" | "discardPile" | "all" - 从哪里选择（默认all）
 *   minSelect?: number
 *   maxSelect?: number
 *   cancelable?: boolean
 *   filter?: (card: Card) => boolean
 *   action?: "gain" | "remove" | "upgrade" | "duplicate" | "none" - 选择后的操作（默认none）
 * }
 */
export const customCardChoice: EffectFunc = async (event, effect) => {
  const target = Array.isArray(event.target) ? event.target[0] : event.target
  if (!(target instanceof Player)) return

  const {
    title,
    description,
    cardKeys,
    fromPile = "all",
    minSelect = 0,
    maxSelect = 1,
    cancelable = true,
    filter,
    action = "none"
  } = effect.params

  // 确定卡牌来源
  let cards: Card[]
  if (cardKeys && Array.isArray(cardKeys)) {
    // 使用指定的卡牌key列表
    cards = (cardKeys as string[]).map((key: string) => {
      return getCardByKey(key)
    })
  } else if (fromPile === "all") {
    cards = target.getCardGroup()
  } else {
    const pile = String(fromPile) as keyof typeof target.cardPiles
    cards = target.cardPiles[pile]
  }

  const selectedCards = await showCardChoice({
    title: String(title),
    description: description ? String(description) : undefined,
    cards,
    minSelect: Number(minSelect),
    maxSelect: Number(maxSelect),
    cancelable: Boolean(cancelable),
    filter: typeof filter === 'function' ? (filter as (card: Card) => boolean) : undefined
  })

  // 执行操作
  const cardModifier = getCardModifier(target)
  const actionStr = String(action)
  for (const card of selectedCards) {
    switch (actionStr) {
      case "gain":
        cardModifier.addCardsFromSource(target, [card.key])
        break
      case "remove":
        // TODO: 实现 removeCard 方法
        console.log(`移除卡牌: ${card.label}`)
        // cardModifier.removeCard(card)
        break
      case "upgrade":
        // TODO: 实现升级逻辑
        console.log(`升级卡牌: ${card.label}`)
        break
      case "duplicate":
        cardModifier.addCardsFromSource(target, [card.key])
        break
      case "none":
      default:
        // 不执行任何操作，只是选择
        break
    }
  }

  // 将选中的卡牌存储到事件结果中，供后续使用
  event.setEventResult("selectedCards", selectedCards)
}
