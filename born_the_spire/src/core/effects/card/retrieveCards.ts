/**
 * 从牌堆中取回符合条件的卡牌到手牌
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isEnemy, isPlayer } from "@/core/utils/typeGuards"
import { getStatusValue } from "@/core/objects/system/status/Status"
import { cardMove } from "."
import { newLog } from "@/ui/hooks/global/log"

/**
 * 从指定牌堆中取回符合条件的卡牌到手牌
 *
 * params:
 * - sourcePile: string - 来源牌堆名："discardPile" | "drawPile" | "exhaustPile"
 *                       也支持 "any"，依次搜索 draw → discard → exhaust
 * - cost?: number - 按耗能过滤（等于该值的卡牌）
 * - cardId?: string - 按卡的 __id 精确匹配单张卡（找到即停）
 */
export const retrieveCardsToHand: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    const sourcePileName = effect.params.sourcePile as string
    if (!sourcePileName) return false

    if (isEnemy(target)) {
        if (sourcePileName !== "exhaustPile" && sourcePileName !== "any") return false
        const exhaustPile = target.exhaustPile
        const costFilter = effect.params.cost as number | undefined
        const cardIdFilter = effect.params.cardId as string | undefined
        const selected = exhaustPile.filter(card =>
            (cardIdFilter === undefined || card.__id === cardIdFilter) &&
            (costFilter === undefined || getStatusValue(card, "cost", undefined) === costFilter)
        )
        if (selected.length === 0) return false
        for (const card of selected) target.retrieveFromExhaust(card)
        newLog([target, `从消耗堆取回了${selected.length}张卡牌`])
        return true
    }

    if (!isPlayer(target)) return false

    const piles = (target as any).cardPiles
    const handPile = piles?.handPile
    if (!handPile) return false

    const costFilter = effect.params.cost as number | undefined
    const cardIdFilter = effect.params.cardId as string | undefined

    // cardId 过滤要求非空字符串，缺失就直接判负（比如遗物 markedCardId 未记录时）
    if (cardIdFilter !== undefined && (typeof cardIdFilter !== "string" || cardIdFilter === "")) {
        return false
    }

    const pileNames = sourcePileName === "any"
        ? ["drawPile", "discardPile", "exhaustPile"]
        : [sourcePileName]

    let movedCount = 0
    let movedFromPile = ""
    for (const pileName of pileNames) {
        const sourcePile = piles?.[pileName]
        if (!sourcePile) continue

        const toMove = sourcePile.filter((card: any) => {
            if (cardIdFilter !== undefined && card.__id !== cardIdFilter) return false
            if (costFilter !== undefined) {
                const cost = getStatusValue(card, "cost", undefined)
                if (cost !== costFilter) return false
            }
            return true
        })
        if (toMove.length === 0) continue

        for (const card of toMove) {
            cardMove(sourcePile, card, handPile, { handPile, owner: target })
        }
        movedCount += toMove.length
        movedFromPile = pileName

        // 精确按 id 找一张，找到就够，不再看其他堆
        if (cardIdFilter !== undefined) break
    }

    if (movedCount === 0) return false
    newLog([target, `从${movedFromPile}取回了${movedCount}张卡牌`])
    return true
}
