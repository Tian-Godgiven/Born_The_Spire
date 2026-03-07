import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Card } from "@/core/objects/item/Subclass/Card"
import { Player } from "@/core/objects/target/Player"
import { removeCardFromDeck } from "./cardRemove"

/**
 * 移除卡牌效果（基础效果）
 *
 * @params {
 *   card: Card - 要移除的卡牌实例
 * }
 */
export const removeCardEffect: EffectFunc = async (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!(target instanceof Player)) return

    const card = effect.params.card as Card

    if (!card || !(card instanceof Card)) {
        console.warn("[removeCardEffect] 无效的卡牌参数")
        return
    }

    removeCardFromDeck(target, card)
}
