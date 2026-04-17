/**
 * 从牌堆中取回符合条件的卡牌到手牌
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isPlayer } from "@/core/utils/typeGuards"
import { getStatusValue } from "@/core/objects/system/status/Status"
import { cardMove } from "."
import { newLog } from "@/ui/hooks/global/log"

/**
 * 从指定牌堆中取回符合条件的卡牌到手牌
 *
 * params:
 * - sourcePile: string - 来源牌堆名（"discardPile" | "drawPile" | "exhaustPile"）
 * - cost?: number - 按耗能过滤（等于该值的卡牌）
 */
export const retrieveCardsToHand: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isPlayer(target)) return false

    const sourcePileName = effect.params.sourcePile as string
    if (!sourcePileName) return false

    const piles = (target as any).cardPiles
    const sourcePile = piles?.[sourcePileName]
    const handPile = piles?.handPile
    if (!sourcePile || !handPile) return false

    const costFilter = effect.params.cost as number | undefined

    // 收集符合条件的卡牌（先收集再移动，避免遍历中修改数组）
    const toMove = sourcePile.filter((card: any) => {
        if (costFilter !== undefined) {
            const cost = getStatusValue(card, "cost", undefined)
            if (cost !== costFilter) return false
        }
        return true
    })

    if (toMove.length === 0) return false

    for (const card of toMove) {
        cardMove(sourcePile, card, handPile, { handPile, owner: target })
    }

    newLog([target, `从${sourcePileName}取回了${toMove.length}张卡牌`])
    return true
}
