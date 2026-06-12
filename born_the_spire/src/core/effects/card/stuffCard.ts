import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Player } from "@/core/objects/target/Player"
import { Enemy } from "@/core/objects/target/Enemy"
import { getCardByKey, cardList } from "@/static/list/item/cardList"
import { washPile } from "."

/**
 * 向目标牌堆塞入指定卡牌
 *
 * 玩家目标：塞入 drawPile，同时应用词条（如 card_void），战斗结束后自动消失
 * 敌人目标：塞入 drawPile.junk，回合结束后自动清理
 *
 * params:
 *   cardKey: string  - 要塞入的卡牌 key
 *   count?: number   - 塞入数量（默认 1）
 */
export const stuffCard: EffectFunc = async (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    const cardKey = String(effect.params.cardKey)
    const count = Number(effect.params.count ?? 1)

    const cardMap = cardList.find(c => c.key === cardKey)
    const entries = cardMap?.entry ?? []

    if (target instanceof Player) {
        for (let i = 0; i < count; i++) {
            const card = await getCardByKey(cardKey)
            card.setOwner(target, entries)
            target.cardPiles.drawPile.push(card)
        }
        washPile(target.cardPiles.drawPile)
    } else if (target instanceof Enemy) {
        for (let i = 0; i < count; i++) {
            const card = await getCardByKey(cardKey)
            card.owner = target
            target.drawPile.junk.push(card)
        }
    }

    return true
}
