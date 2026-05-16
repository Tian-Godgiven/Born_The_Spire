import { Card } from "@/core/objects/item/Subclass/Card"
import { Player } from "@/core/objects/target/Player"
import { newLog } from "@/ui/hooks/global/log"
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier"

/**
 * 从玩家卡组中移除指定卡牌
 * @param player 玩家
 * @param card 要移除的卡牌
 * @returns 是否成功移除
 */
export function removeCardFromDeck(player: Player, card: Card): boolean {
    const cardModifier = getCardModifier(player)
    if (cardModifier.removeCard(card)) {
        newLog([player, "移除了卡牌", card])
        return true
    }

    console.warn(`[removeCardFromDeck] 卡牌 ${card.label} 不在玩家卡组中`)
    return false
}
