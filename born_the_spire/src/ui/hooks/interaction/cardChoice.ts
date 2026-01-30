import { Card } from "@/core/objects/item/Subclass/Card"
import type { CardSelector } from "@/core/objects/system/CardSelector"
import { showComponent } from "@/core/hooks/componentManager"
import CardChoice from "@/ui/components/interaction/CardChoice.vue"
import { Player } from "@/core/objects/target/Player"
import { getCardByKey } from "@/static/list/item/cardList"

/**
 * 卡牌选择配置
 */
export type CardChoiceConfig = {
  title: string                    // 标题
  description?: string             // 描述文本
  cards: Card[]                    // 可选卡牌列表
  selector?: CardSelector          // 筛选器（可选）
  minSelect?: number               // 最少选择数量（默认0）
  maxSelect?: number               // 最多选择数量（默认1）
  cancelable?: boolean             // 是否可取消（默认false）
  filter?: (card: Card) => boolean // 自定义筛选函数（可选）
}

/**
 * 显示卡牌选择界面
 *
 * @param config 选择配置
 * @returns Promise<Card[]> 选中的卡牌列表（取消时返回空数组）
 *
 * @example
 * // 单选卡牌升级
 * const cards = await showCardChoice({
 *   title: "选择要升级的卡牌",
 *   description: "选择一张卡牌进行升级",
 *   cards: player.getCardGroup(),
 *   maxSelect: 1
 * })
 * if (cards.length > 0) {
 *   upgradeCard(cards[0])
 * }
 *
 * @example
 * // 多选卡牌移除
 * const cards = await showCardChoice({
 *   title: "选择要移除的卡牌",
 *   description: "最多选择3张卡牌移除",
 *   cards: player.getCardGroup(),
 *   minSelect: 0,
 *   maxSelect: 3,
 *   cancelable: true
 * })
 * for (const card of cards) {
 *   removeCard(card)
 * }
 *
 * @example
 * // 使用筛选器
 * const cards = await showCardChoice({
 *   title: "选择攻击牌",
 *   cards: player.cardPiles.handPile,
 *   filter: (card) => card.tags?.includes("attack") ?? false,
 *   maxSelect: 1
 * })
 */
export async function showCardChoice(config: CardChoiceConfig): Promise<Card[]> {
  try {
    const result = await showComponent({
      component: CardChoice,
      data: config,
      layout: "modal"
    })
    // complete 事件返回选中的卡牌数组
    return result || []
  } catch (error) {
    // cancel 事件会 reject，返回空数组
    return []
  }
}

/**
 * 从随机卡牌中选择
 * @param cardKeys 卡牌key列表
 * @param count 随机抽取数量
 * @param selectCount 可选择数量（单个数字表示精确数量，数组 [min, max] 表示范围）
 * @param title 标题
 * @param description 描述
 * @param allowDuplicate 是否允许重复（默认false）
 */
export async function chooseFromRandomCards(
  cardKeys: string[],
  count: number,
  selectCount: number | [number, number] = 1,
  title: string = "选择卡牌",
  description?: string,
  allowDuplicate: boolean = false
): Promise<Card[]> {
  let selectedKeys: string[]

  if (allowDuplicate) {
    // 允许重复：随机抽取（可能重复）
    selectedKeys = []
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * cardKeys.length)
      selectedKeys.push(cardKeys[randomIndex])
    }
  } else {
    // 不允许重复：洗牌后抽取
    const shuffled = [...cardKeys].sort(() => Math.random() - 0.5)
    selectedKeys = shuffled.slice(0, Math.min(count, cardKeys.length))
  }

  // 创建卡牌实例
  const cards = selectedKeys.map(key => {
    return getCardByKey(key)  // getCardByKey 已经返回 Card 实例
  })

  // 解析 selectCount
  let minSelect: number
  let maxSelect: number
  if (Array.isArray(selectCount)) {
    [minSelect, maxSelect] = selectCount
  } else {
    minSelect = selectCount
    maxSelect = selectCount
  }

  return showCardChoice({
    title,
    description: description || `从 ${cards.length} 张卡牌中选择 ${minSelect === maxSelect ? minSelect : `${minSelect}-${maxSelect}`} 张`,
    cards,
    minSelect,
    maxSelect,
    cancelable: false
  })
}

/**
 * 选择要升级的卡牌
 * @param player 玩家
 * @param count 可选择数量（默认1）
 */
export async function chooseCardsToUpgrade(
  player: Player,
  count: number = 1
): Promise<Card[]> {
  return showCardChoice({
    title: "选择要升级的卡牌",
    description: count === 1 ? "选择一张卡牌进行升级" : `选择最多 ${count} 张卡牌进行升级`,
    cards: player.getCardGroup(),
    minSelect: 0,
    maxSelect: count,
    cancelable: true  // 升级可以取消
  })
}

/**
 * 选择要移除的卡牌
 * @param player 玩家
 * @param count 可选择数量（默认1）
 * @param minCount 最少选择数量（默认0）
 */
export async function chooseCardsToRemove(
  player: Player,
  count: number = 1,
  minCount: number = 0
): Promise<Card[]> {
  return showCardChoice({
    title: "选择要移除的卡牌",
    description: count === 1 ? "选择一张卡牌移除" : `选择最多 ${count} 张卡牌移除`,
    cards: player.getCardGroup(),
    minSelect: minCount,
    maxSelect: count,
    cancelable: minCount === 0  // 如果最少选择0张，可以取消
  })
}

/**
 * 选择要复制的卡牌
 * @param player 玩家
 * @param fromPile 从哪个牌堆选择（默认手牌）
 */
export async function chooseCardToDuplicate(
  player: Player,
  fromPile: "handPile" | "drawPile" | "discardPile" = "handPile"
): Promise<Card[]> {
  const pileNames = {
    handPile: "手牌",
    drawPile: "抽牌堆",
    discardPile: "弃牌堆"
  }

  return showCardChoice({
    title: "选择要复制的卡牌",
    description: `从${pileNames[fromPile]}中选择一张卡牌复制`,
    cards: player.cardPiles[fromPile],
    minSelect: 1,
    maxSelect: 1,
    cancelable: false
  })
}

/**
 * 选择特定标签的卡牌
 * @param player 玩家
 * @param tags 标签列表
 * @param count 可选择数量
 * @param title 标题
 */
export async function chooseCardsByTags(
  player: Player,
  tags: string[],
  count: number = 1,
  title?: string
): Promise<Card[]> {
  const tagNames = tags.join("、")

  return showCardChoice({
    title: title || `选择${tagNames}卡牌`,
    description: `选择最多 ${count} 张${tagNames}卡牌`,
    cards: player.getCardGroup(),
    filter: (card) => card.tags?.some(tag => tags.includes(tag)) ?? false,
    minSelect: 0,
    maxSelect: count,
    cancelable: true  // 可以取消
  })
}
