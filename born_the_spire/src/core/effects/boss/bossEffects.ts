import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isEntity, isEffect } from "@/core/utils/typeGuards"
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { newLog } from "@/ui/hooks/global/log"
import { changeCurrentValue, getCurrentValue } from "@/core/objects/system/Current/current"
import { nowBattle } from "@/core/objects/game/battle"

/**
 * 腐化积累：废堆融合体器官每回合触发
 * 每回合+2腐化层；达到10层时对所有对手造成30点直接伤害并清空腐化
 * 当玩家持有时：对所有敌人造成伤害；当Boss持有时：对所有玩家造成伤害
 */
export const boss_corruptionTick: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const battle = nowBattle.value
    if (!battle) return false

    const add = Number(effect.params?.add ?? 2)
    const threshold = Number(effect.params?.threshold ?? 10)
    const overloadDamage = Number(effect.params?.overloadDamage ?? 30)

    const stateModifier = getStateModifier(target as any)
    stateModifier.changeStack("corruption", "default", add)
    newLog([target, `腐化 +${add}`])

    const corruptionStacks = stateModifier.getState("corruption")?.stacks.find(s => s.key === "default")?.stack ?? 0
    if (corruptionStacks >= threshold) {
        newLog([target, `腐化达到 ${corruptionStacks} 层，腐化爆发！`])
        stateModifier.removeState("corruption")

        const isPlayer = battle.getAlivePlayers().includes(target as any)
        const opponents = isPlayer ? battle.getAliveEnemies() : battle.getAlivePlayers()

        for (const opponent of opponents) {
            doEvent({
                key: "loseHealth",
                source: target,
                medium: event.medium,
                target: opponent,
                effectUnits: [{ key: "loseHealth", params: { value: overloadDamage } }]
            })
        }
    }
    return true
}

/**
 * 护甲转力量：回合开始时，将当前护甲量/N转化为临时力量
 * 废铁骨架/过载引擎使用
 * params: armorPerPower (default: 5)
 */
export const boss_armorToPower: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const armorPerPower = Number(effect.params?.armorPerPower ?? 5)
    const currentArmor = getCurrentValue(target as any, "armor")
    const powerAmount = Math.floor(currentArmor / armorPerPower)

    if (powerAmount <= 0) return false

    const stateModifier = getStateModifier(target as any)
    stateModifier.changeStack("power", "default", powerAmount)
    stateModifier.changeStack("tempPower", "default", powerAmount)

    newLog([target, `护甲转力量：+${powerAmount} 临时力量（护甲=${currentArmor}）`])
    return true
}

/**
 * 孢子腺体被动：对所有玩家施加N层中毒
 * 当玩家持有时：对所有敌人施加中毒
 * params: stacks (default: 3)
 */
export const boss_sporePassive: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const source = Array.isArray(event.source) ? event.source[0] : event.source
    if (!isEntity(source)) return false

    const stacks = Number(effect.params?.stacks ?? 3)

    const isPlayer = battle.getAlivePlayers().includes(source as any)
    const opponents = isPlayer ? battle.getAliveEnemies() : battle.getAlivePlayers()

    for (const opponent of opponents) {
        doEvent({
            key: "applyState",
            source,
            medium: event.medium,
            target: opponent,
            effectUnits: [{ key: "applyState", params: { stateKey: "poison", stacks } }]
        })
    }
    return true
}

/**
 * 中毒爆发：若任意对手中毒层数≥阈值，对所有对手造成直接伤害
 * 当玩家持有时检查敌人中毒；当Boss持有时检查玩家中毒
 * params: threshold (default: 10), damage (default: 15)
 */
export const boss_poisonSurge: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const source = Array.isArray(event.source) ? event.source[0] : event.source
    if (!isEntity(source)) return false

    const surgeThreshold = Number(effect.params?.threshold ?? 10)
    const damage = Number(effect.params?.damage ?? 15)

    const isPlayer = battle.getAlivePlayers().includes(source as any)
    const opponents = isPlayer ? battle.getAliveEnemies() : battle.getAlivePlayers()

    let triggered = false
    for (const opponent of opponents) {
        const poisonStacks = getStateModifier(opponent).getState("poison")?.stacks.find(s => s.key === "default")?.stack ?? 0
        if (poisonStacks >= surgeThreshold) {
            triggered = true
            break
        }
    }

    if (!triggered) return false

    newLog([source, `中毒爆发触发（中毒≥${surgeThreshold}），造成${damage}点伤害！`])
    for (const opponent of opponents) {
        doEvent({
            key: "loseHealth",
            source,
            medium: event.medium,
            target: opponent,
            effectUnits: [{ key: "loseHealth", params: { value: damage } }]
        })
    }
    return true
}

/**
 * 过载积甲：废铁战甲器官每回合触发
 * 若当前护甲≥阈值，对所有对手造成直接伤害并清空护甲
 * params: threshold (default: 40), damage (default: 60)
 */
export const boss_armorOverload: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const battle = nowBattle.value
    if (!battle) return false

    const threshold = Number(effect.params?.threshold ?? 40)
    const damage = Number(effect.params?.damage ?? 60)

    const currentArmor = getCurrentValue(target as any, "armor")
    if (currentArmor < threshold) return false

    newLog([target, `钢铁压碾！护甲=${currentArmor}，造成${damage}点直接伤害并清空护甲！`])
    changeCurrentValue(target as any, "armor", 0, event)

    const isPlayer = battle.getAlivePlayers().includes(target as any)
    const opponents = isPlayer ? battle.getAliveEnemies() : battle.getAlivePlayers()

    for (const opponent of opponents) {
        doEvent({
            key: "loseHealth",
            source: target,
            medium: event.medium,
            target: opponent,
            effectUnits: [{ key: "loseHealth", params: { value: damage } }]
        })
    }
    return true
}

/**
 * 护甲冲击：造成基础伤害+护甲/N的伤害
 * params: base (default: 8), armorDivisor (default: 4)
 */
export const boss_armorScaleDamage: EffectFunc = (event, effect) => {
    const source = event.source
    if (!isEntity(source)) return false

    const base = Number(effect.params?.base ?? 8)
    const armorDivisor = Number(effect.params?.armorDivisor ?? 4)
    const currentArmor = getCurrentValue(source as any, "armor")
    const totalDamage = base + Math.floor(currentArmor / armorDivisor)

    doEvent({
        key: "damage",
        source: event.source,
        medium: event.medium,
        target: event.target,
        effectUnits: [{ key: "damage", params: { value: totalDamage } }]
    })
    return true
}

/**
 * 中毒放大：在施加中毒前，增加N层中毒层数
 * event.target = triggerEffect（applyState效果对象）
 * params: addStacks (default: 2)
 */
export const boss_toxicAmplify: EffectFunc = (event, _effect) => {
    const damageEffect = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEffect(damageEffect)) return false
    if ((damageEffect as any).key !== "applyState") return false
    if ((damageEffect as any).params?.stateKey !== "poison") return false

    const addStacks = Number((_effect as any).params?.addStacks ?? 2)
    ;(damageEffect as any).params.stacks = Number((damageEffect as any).params.stacks ?? 0) + addStacks

    return true
}

/**
 * 毒素回血：回合结束，按所有对手中毒总层数回血（上限N）
 * 当玩家持有时：按敌人中毒层数；当Boss持有时：按玩家中毒层数
 * params: maxHeal (default: 10)
 */
export const boss_toxicHeal: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const source = Array.isArray(event.source) ? event.source[0] : event.source
    if (!isEntity(source)) return false

    const maxHeal = Number(effect.params?.maxHeal ?? 10)

    const isPlayer = battle.getAlivePlayers().includes(source as any)
    const opponents = isPlayer ? battle.getAliveEnemies() : battle.getAlivePlayers()

    let totalPoison = 0
    for (const opponent of opponents) {
        totalPoison += getStateModifier(opponent).getState("poison")?.stacks.find(s => s.key === "default")?.stack ?? 0
    }

    const healAmount = Math.min(totalPoison, maxHeal)
    if (healAmount <= 0) return false

    doEvent({
        key: "heal",
        source,
        medium: event.medium,
        target: source,
        effectUnits: [{ key: "heal", params: { value: healAmount } }]
    })

    newLog([source, `孢子腺网：按中毒总层数(${totalPoison})回复 ${healAmount} 点生命`])
    return true
}

/**
 * 毒素护甲：回合开始，获得等于所有对手中毒总层数的护甲（上限N）
 * params: maxArmor (default: 20)
 */
export const boss_toxicArmor: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const maxArmor = Number(effect.params?.maxArmor ?? 20)

    const isPlayer = battle.getAlivePlayers().includes(target as any)
    const opponents = isPlayer ? battle.getAliveEnemies() : battle.getAlivePlayers()

    let totalPoison = 0
    for (const opponent of opponents) {
        totalPoison += getStateModifier(opponent).getState("poison")?.stacks.find(s => s.key === "default")?.stack ?? 0
    }

    const armorAmount = Math.min(totalPoison, maxArmor)
    if (armorAmount <= 0) return false

    doEvent({
        key: "gainArmor",
        source: target,
        medium: event.medium,
        target,
        effectUnits: [{ key: "gainArmor", params: { value: armorAmount } }]
    })

    newLog([target, `毒素硬化：按中毒总层数(${totalPoison})获得 ${armorAmount} 护甲`])
    return true
}

/**
 * 菌网扩散：对随机一名对手施加N层中毒
 * params: stacks (default: 3)
 */
export const boss_myceliumSpread: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const source = Array.isArray(event.source) ? event.source[0] : event.source
    if (!isEntity(source)) return false

    const stacks = Number(effect.params?.stacks ?? 3)

    const isPlayer = battle.getAlivePlayers().includes(source as any)
    const opponents = isPlayer ? battle.getAliveEnemies() : battle.getAlivePlayers()
    if (opponents.length === 0) return false

    const randomIndex = Math.floor(Math.random() * opponents.length)
    const randomTarget = opponents[randomIndex]

    doEvent({
        key: "applyState",
        source,
        medium: event.medium,
        target: randomTarget,
        effectUnits: [{ key: "applyState", params: { stateKey: "poison", stacks } }]
    })

    newLog([source, `菌网根系：对随机目标施加 ${stacks} 层中毒`])
    return true
}

/**
 * 钢铁意志：每场战斗1次，受到致命伤害时以1点生命存活
 * event.target = triggerEffect（damage效果对象），event.source = 器官持有者
 */
export const boss_steelWill: EffectFunc = (event, _effect) => {
    const damageEffect = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEffect(damageEffect) || (damageEffect as any).key !== "damage") return false

    const host = event.source
    if (!isEntity(host)) return false

    const stateModifier = getStateModifier(host as any)
    const usedStacks = stateModifier.getState("steelWillUsed")?.stacks.find(s => s.key === "default")?.stack ?? 0
    if (usedStacks > 0) return false

    const currentHp = getCurrentValue(host as any, "health")
    const currentArmor = getCurrentValue(host as any, "armor")
    const damageValue = Number((damageEffect as any).params.value ?? 0)

    const damageAfterArmor = Math.max(0, damageValue - currentArmor)
    if (damageAfterArmor < currentHp) return false

    stateModifier.changeStack("steelWillUsed", "default", 1)
    // 设置伤害刚好让HP剩余1点（护甲吸收后还剩1HP）
    ;(damageEffect as any).params.value = currentArmor + currentHp - 1

    newLog([host, "钢铁意志：抵御致命伤害，以1点生命存活！"])
    return true
}

/**
 * 腐化核心：当持有者打出一张牌时，对所有对手施加N层中毒
 * params: stacks (default: 1)
 */
export const boss_corruptionCorePoison: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const source = Array.isArray(event.source) ? event.source[0] : event.source
    if (!isEntity(source)) return false

    const stacks = Number(effect.params?.stacks ?? 1)

    const isPlayer = battle.getAlivePlayers().includes(source as any)
    const opponents = isPlayer ? battle.getAliveEnemies() : battle.getAlivePlayers()

    for (const opponent of opponents) {
        doEvent({
            key: "applyState",
            source,
            medium: event.medium,
            target: opponent,
            effectUnits: [{ key: "applyState", params: { stateKey: "poison", stacks } }]
        })
    }
    return true
}
