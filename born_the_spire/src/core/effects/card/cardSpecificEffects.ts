import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isPlayer, isEntity } from "@/core/utils/typeGuards"
import type { CardPiles } from "@/core/objects/target/Player"
import type { Card } from "@/core/objects/item/Subclass/Card"
import { nowBattle } from "@/core/objects/game/battle"
import { cardMove } from "@/core/effects/card/index"
import { randomChoice, getContextRandom } from "@/core/hooks/random"
import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"

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

/**
 * 不稳定充能：随机改变充能层数
 * 1% 清空充能 / 9% 无效果 / 60% +1 / 20% +2 / 10% +3
 * 专属于 enemy_card_unstable_charge 卡牌
 */
export const card_unstableCharge: EffectFunc = (event, _effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!target || !isEntity(target)) return false

    const rng = getContextRandom("unstableCharge")
    const roll = rng.nextFloatRange(0, 100)

    const stateModifier = getStateModifier(target as any)

    if (roll < 1) {
        // 1%：清空充能
        stateModifier.removeState("charge")
        newLog(["不稳定充能：充能归零！"])
    } else if (roll < 10) {
        // 9%：无效果
        newLog(["不稳定充能：什么都没发生"])
    } else if (roll < 70) {
        // 60%：+1
        stateModifier.changeStack("charge", "default", 1)
        newLog(["不稳定充能：+1 充能"])
    } else if (roll < 90) {
        // 20%：+2
        stateModifier.changeStack("charge", "default", 2)
        newLog(["不稳定充能：+2 充能"])
    } else {
        // 10%：+3
        stateModifier.changeStack("charge", "default", 3)
        newLog(["不稳定充能：+3 充能"])
    }

    return true
}

/**
 * 指挥嘶鸣：给所有存活友军（含自身）+N层指挥
 * params:
 *   stacks: number - 指挥层数 (default: 3)
 */
export const card_commandScreech: EffectFunc = (_event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const stacks = Number(effect.params?.stacks ?? 3)
    for (const ally of battle.getAliveEnemies()) {
        getStateModifier(ally).changeStack("command", "default", stacks)
    }
    newLog([`指挥嘶鸣：所有友军 +${stacks} 指挥层`])
    return true
}

/**
 * 指挥连击：所有友军每N层指挥对目标造成1次M点伤害
 * params:
 *   n: number      - 触发一次伤害所需的指挥层数 (default: 2)
 *   damage: number - 每次伤害值 (default: 3)
 */
export const card_commandStrike: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const n = Number(effect.params?.n ?? 2)
    const damage = Number(effect.params?.damage ?? 3)
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    for (const ally of battle.getAliveEnemies()) {
        const stacks = getStateModifier(ally).getState("command")?.stacks.find(s => s.key === "default")?.stack ?? 0
        const hits = Math.floor(stacks / n)
        for (let i = 0; i < hits; i++) {
            doEvent({
                key: "damage",
                source: ally,
                medium: event.medium,
                target,
                effectUnits: [{ key: "damage", params: { value: damage } }]
            })
        }
    }
    return true
}

/**
 * 热能冲击：造成 base + floor(热量层数/2) 伤害
 * params:
 *   base: number - 基础伤害 (default: 6)
 */
export const card_heatBlast: EffectFunc = (event, effect) => {
    const source = event.source
    if (!isEntity(source)) return false

    const heat = getStateModifier(source as any).getState("heat")?.stacks.find(s => s.key === "default")?.stack ?? 0
    const base = Number(effect.params?.base ?? 6)
    const totalDamage = base + Math.floor(heat / 2)

    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    doEvent({
        key: "damage",
        source,
        medium: event.medium,
        target,
        effectUnits: [{ key: "damage", params: { value: totalDamage } }]
    })
    return true
}

/**
 * 腐蚀爆发：对目标造成 damage+腐蚀×2 伤害，对自身造成 selfDamage+腐蚀×1 伤害；使用后腐蚀+1
 * params:
 *   damage: number     - 基础对敌伤害 (default: 6)
 *   selfDamage: number - 基础自伤 (default: 2)
 */
export const card_corrosiveBurst: EffectFunc = (event, effect) => {
    const source = event.source
    if (!isEntity(source)) return false

    const battle = nowBattle.value
    if (!battle) return false

    const corrosion = getStateModifier(source as any).getState("corrosion")?.stacks.find(s => s.key === "default")?.stack ?? 0
    const baseDamage = Number(effect.params?.damage ?? 6)
    const baseSelf = Number(effect.params?.selfDamage ?? 2)

    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (isEntity(target)) {
        doEvent({
            key: "damage",
            source,
            medium: event.medium,
            target,
            effectUnits: [{ key: "damage", params: { value: baseDamage + corrosion * 2 } }]
        })
    }
    doEvent({
        key: "damage",
        source,
        medium: event.medium,
        target: source,
        effectUnits: [{ key: "damage", params: { value: baseSelf + corrosion } }]
    })

    getStateModifier(source as any).changeStack("corrosion", "default", 1)
    newLog([source, `腐蚀度 +1（当前 ${corrosion + 1} 层）`])
    return true
}
