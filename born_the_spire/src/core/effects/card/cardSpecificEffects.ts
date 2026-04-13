import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isPlayer } from "@/core/utils/typeGuards"
import type { CardPiles } from "@/core/objects/target/Player"
import type { Card } from "@/core/objects/item/Subclass/Card"
import { nowBattle } from "@/core/objects/game/battle"
import { cardMove } from "@/core/effects/card/index"
import { randomChoice } from "@/core/hooks/random"
import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "@/core/objects/system/ActionEvent"

/**
 * 余热回收：检查牌堆是否有指定标签的卡牌，若有则消耗一张并获得额外护甲
 * 专属于 enemy_waste_heat_recovery 和 player_waste_heat_recovery 卡牌
 *
 * @param effect.params.pile       - 牌堆名称："handPile" | "discardPile" | "drawPile"
 * @param effect.params.hasTag     - 要检查的卡牌标签
 * @param effect.params.targetType - "self"（event.target 作为玩家）| "player"（从战斗中取玩家）
 * @param effect.params.bonusArmor - 满足条件时额外获得的护甲值
 */
export const card_wasteHeatRecovery: EffectFunc = (event, effect) => {
    const params = effect.params || {}
    const pileName = String(params.pile ?? "handPile") as keyof CardPiles
    const hasTag = String(params.hasTag ?? "")
    const targetType = String(params.targetType ?? "self")
    const bonusArmor = Number(params.bonusArmor ?? 0)

    console.log("[card_wasteHeatRecovery] params:", { pileName, hasTag, targetType, bonusArmor })
    console.log("[card_wasteHeatRecovery] event.target:", event.target)

    let player: any | null = null

    if (targetType === "player") {
        const playerTeam = nowBattle.value?.getTeam("player")
        console.log("[card_wasteHeatRecovery] playerTeam:", playerTeam)
        const candidate = playerTeam?.[0]
        if (candidate && isPlayer(candidate)) {
            player = candidate
        }
    } else {
        const { target } = event
        const targetEntity = Array.isArray(target) ? target[0] : target
        if (targetEntity && isPlayer(targetEntity)) {
            player = targetEntity
        }
    }

    console.log("[card_wasteHeatRecovery] player found:", player)
    if (!player) {
        console.log("[card_wasteHeatRecovery] no player found, returning early")
        return
    }

    const pile = player.cardPiles[pileName] as Card[]
    console.log("[card_wasteHeatRecovery] pile:", pileName, "length:", pile?.length, "cards:", pile?.map((c:Card) => `${c.label}[${c.tags}]`))
    const matching = pile.filter((card: Card) => card.tags?.includes(hasTag))
    console.log("[card_wasteHeatRecovery] matching cards:", matching.map((c:Card) => c.label))

    if (matching.length === 0) {
        console.log("[card_wasteHeatRecovery] no matching cards, returning early")
        return
    }

    // 随机选择一张匹配的卡牌
    const card = randomChoice(matching, "wasteHeatRecovery")
    console.log("[card_wasteHeatRecovery] exhausting card:", card.label)

    // 消耗卡牌
    cardMove(pile, card, player.cardPiles.exhaustPile, {handPile:player.cardPiles.handPile, owner:player})
    newLog([`消耗了`, card.label])

    // 获得额外护甲（走事件系统，可被触发器拦截）
    doEvent({
        key: "gainArmor",
        source: event.source,
        medium: event.medium,
        target: event.target,
        effectUnits: [{
            key: "gainArmor",
            params: { value: bonusArmor }
        }]
    })
}
