import type { Card } from "@/core/objects/item/Subclass/Card"
import { nowPlayer } from "@/core/objects/game/run"
import { showCardGroup } from "@/ui/hooks/interaction/cardGroupModal"

type DefaultCardGroupName = "draw"      // 抽牌堆
    | "discard"                          // 弃牌堆
    | "hand"                             // 手牌
    | "exhaust"                          // 消耗堆

/**
 * 显示卡牌组弹窗
 * @param cardGroup - 卡牌数组或卡牌组名称（draw/discard/hand/exhaust），不传则显示所有卡牌
 * @returns Promise，弹窗关闭时resolve
 *
 * @example
 * // 显示抽牌堆
 * await showCardGroupPopup("draw")
 *
 * // 显示手牌
 * await showCardGroupPopup("hand")
 *
 * // 显示自定义卡牌列表
 * await showCardGroupPopup([card1, card2, card3])
 */
export async function showCardGroupPopup(cardGroup?: Card[] | DefaultCardGroupName): Promise<void> {
    let cardList: Card[] = []
    let title = "卡牌组"

    // 默认情况显示角色持有的所有卡牌
    if (!cardGroup) {
        cardList = nowPlayer.getCardGroup()
        title = "所有卡牌"
    }
    else if (Array.isArray(cardGroup)) {
        // 如果是卡牌数组
        cardList = cardGroup
        title = "卡牌列表"
    }
    else {
        // 如果是名称
        switch (cardGroup) {
            case "draw":
                cardList = nowPlayer.cardPiles.drawPile
                title = `抽牌堆 (${cardList.length})`
                break
            case "hand":
                cardList = nowPlayer.cardPiles.handPile
                title = `手牌 (${cardList.length})`
                break
            case "discard":
                cardList = nowPlayer.cardPiles.discardPile
                title = `弃牌堆 (${cardList.length})`
                break
            case "exhaust":
                cardList = nowPlayer.cardPiles.exhaustPile || []
                title = `消耗堆 (${cardList.length})`
                break
            default:
                cardList = []
                title = "卡牌组"
        }
    }

    // 显示弹窗
    await showCardGroup(title, cardList)
}

/**
 * 快捷方法：显示抽牌堆
 */
export function showDrawPile(): Promise<void> {
    return showCardGroupPopup("draw")
}

/**
 * 快捷方法：显示弃牌堆
 */
export function showDiscardPile(): Promise<void> {
    return showCardGroupPopup("discard")
}

/**
 * 快捷方法：显示手牌
 */
export function showHandPile(): Promise<void> {
    return showCardGroupPopup("hand")
}

/**
 * 快捷方法：显示消耗堆
 */
export function showExhaustPile(): Promise<void> {
    return showCardGroupPopup("exhaust")
}
