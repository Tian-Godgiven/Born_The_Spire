/**
 * 从指定牌堆随机消耗一张指定标签的卡牌
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isPlayer } from "@/core/utils/typeGuards"
import type { CardPiles } from "@/core/objects/target/Player"
import type { Card } from "@/core/objects/item/Subclass/Card"
import { nowBattle } from "@/core/objects/game/battle"
import { cardMove } from "@/core/effects/card/index"
import { newLog } from "@/ui/hooks/global/log"
import { randomInt } from "@/core/hooks/variance"

/**
 * 从指定目标的牌堆中随机消耗一张带有指定 tag 的卡牌
 *
 * @param effect.params.pile       - 牌堆名称："handPile" | "discardPile" | "drawPile"
 * @param effect.params.hasTag     - 要消耗的卡牌标签
 * @param effect.params.targetType - 检查谁的牌堆："self"（event.target）| "player"（从战斗中取玩家）
 *                                   默认为 "self"
 */
export const exhaustRandomCardByTag: EffectFunc = (event, effect) => {
    const params = effect.params || {}
    const pileName = String(params.pile ?? "handPile") as keyof CardPiles
    const hasTag = String(params.hasTag ?? "")
    const targetType = String(params.targetType ?? "self")

    let player: any | null = null

    if (targetType === "player") {
        const playerTeam = nowBattle.value?.getTeam("player")
        const candidate = playerTeam?.[0]
        if (candidate && isPlayer(candidate)) {
            player = candidate
        }
    } else {
        const { target } = event
        if (!Array.isArray(target) && isPlayer(target)) {
            player = target
        }
    }

    if (!player) {
        console.warn('[exhaustRandomCardByTag] 找不到玩家')
        return
    }

    const pile = player.cardPiles[pileName] as Card[]
    const matching = pile.filter((card: Card) => card.tags?.includes(hasTag))

    if (matching.length === 0) return

    const card = matching[randomInt(0, matching.length - 1)]
    cardMove(pile, card, player.cardPiles.exhaustPile)
    newLog([`消耗了`, card.label])
}
