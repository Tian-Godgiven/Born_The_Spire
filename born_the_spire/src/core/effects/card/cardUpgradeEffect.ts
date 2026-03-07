import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Card } from "@/core/objects/item/Subclass/Card"
import { upgradeCard } from "./cardUpgrade"

/**
 * 升级卡牌效果（基础效果）
 *
 * @params {
 *   card: Card - 要升级的卡牌实例
 * }
 */
export const upgradeCardEffect: EffectFunc = async (_event, effect) => {
    const card = effect.params.card as Card

    if (!card || !(card instanceof Card)) {
        console.warn("[upgradeCardEffect] 无效的卡牌参数")
        return
    }

    upgradeCard(card)
}
