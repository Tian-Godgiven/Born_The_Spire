import type { DescribeSegment } from "./describe"
import type { Card as CardType } from "@/core/objects/item/Subclass/Card"
import type { Organ } from "@/core/objects/target/Organ"
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier"
import { isChara } from "@/core/utils/typeGuards"
import { nowPlayer } from "@/core/objects/game/run"

/**
 * 按 key 创建一张临时卡牌实例，仅用于预览展示，不进入任何牌堆
 */
export async function createCardFromKey(cardKey: string): Promise<CardType | null> {
    try {
        const { getLazyModule } = await import("@/core/utils/lazyLoader")
        const cardList = getLazyModule<any[]>("cardList")
        const cardData = cardList.find((c: any) => c.key === cardKey)
        if (!cardData) return null

        const { createCard } = await import("@/core/factories")
        return await createCard(cardData)
    } catch (error) {
        console.error("[cardSegment] 创建临时卡牌失败:", cardKey, error)
        return null
    }
}

/**
 * 按实例 ID 查找已存在的卡牌实例
 * 先在器官持有者名下、由该器官提供的卡牌中查找（敌人器官同样有效），
 * 找不到再退回玩家的四个牌堆
 */
export function findCardInstance(cardId: string, organ?: Organ): CardType | null {
    const owner = organ?.owner
    if (organ && owner && isChara(owner)) {
        try {
            const fromOrgan = getCardModifier(owner).getCardsFromSource(organ)
            const hit = fromOrgan.find((card: any) => card.__id === cardId)
            if (hit) return hit
        } catch {
            // 持有者尚未初始化卡牌管理器，走下面的兜底
        }
    }

    const piles = nowPlayer?.cardPiles
    if (!piles) return null

    const allCards = [
        ...piles.handPile,
        ...piles.drawPile,
        ...piles.discardPile,
        ...piles.exhaustPile
    ]
    return allCards.find((card: any) => card.__id === cardId) || null
}

/**
 * 按索引取器官提供的卡牌 key，先查 cards 数组，再退回 cardsByOwner.player
 */
function getCardKeyByIndex(index: number, organ?: Organ): string | null {
    if (!organ) return null

    const cards = organ.cards
    if (Array.isArray(cards) && cards[index]) {
        return cards[index]
    }

    const playerCards = organ.cardsByOwner?.player
    if (playerCards) {
        const arr = Array.isArray(playerCards) ? playerCards : [playerCards]
        return arr[index] ?? null
    }

    return null
}

/**
 * 从描述片段解析出可预览的卡牌
 * 描述里的卡牌引用有三种形态：
 *     {"#": "card_key"}  → cardRefType "key"，按 key 创建临时实例
 *     {"@": 0}           → cardRefType "instance" + 数字，是器官卡牌列表的索引
 *     {"@": "__id"}      → cardRefType "instance" + 字符串，是运行时卡牌实例 ID
 */
export async function resolveCardFromSegment(
    segment: DescribeSegment,
    organ?: Organ
): Promise<CardType | null> {
    if (segment.type !== "card") return null

    const ref = segment.cardRef
    // 索引 0 是合法引用，不能用 falsy 判断
    if (ref === undefined || ref === null) return null

    if (segment.cardRefType === "key") {
        return typeof ref === "string" ? await createCardFromKey(ref) : null
    }

    if (typeof ref === "string") {
        return findCardInstance(ref, organ)
    }

    const cardKey = getCardKeyByIndex(ref, organ)
    return cardKey ? await createCardFromKey(cardKey) : null
}
