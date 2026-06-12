import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isEntity, isEffect, isEnemy } from "@/core/utils/typeGuards"
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"
import { getContextRandom } from "@/core/hooks/random"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { newLog } from "@/ui/hooks/global/log"
import { changeCurrentValue, getCurrentValue } from "@/core/objects/system/Current/current"
import { Organ } from "@/core/objects/target/Organ"
import { nowBattle } from "@/core/objects/game/battle"
import { stateList } from "@/static/list/target/stateList"

/**
 * 热量计时：不稳定电池器官每回合触发
 * 50% 概率给持有者 +1 热量；热量超过 3 层时爆炸造成 50 伤害并清空热量
 */
export const organ_heatTick: EffectFunc = (event, _effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const stateModifier = getStateModifier(target as any)
    const rng = getContextRandom("heatTick")

    if (rng.nextFloatRange(0, 1) < 0.5) {
        stateModifier.changeStack("heat", "default", 1)
        newLog([target, "热量 +1"])
    }

    const heatState = stateModifier.getState("heat")
    const heatStacks = heatState?.stacks.find(s => s.key === "default")?.stack ?? 0
    if (heatStacks > 3) {
        newLog([target, `热量达到 ${heatStacks} 层，引发爆炸！`])
        stateModifier.removeState("heat")
        doEvent({
            key: "damage",
            source: event.medium,
            medium: event.medium,
            target,
            effectUnits: [{ key: "damage", params: { value: 50 } }]
        })
    }

    return true
}

/**
 * 过期隔板：受到伤害时掷骰
 * 30% 将伤害值设为 0（完全抵消）
 * 20% 清零宿主护甲（装甲崩裂）
 * 50% 正常
 *
 * 在 before take damage 的 reaction 里触发，event.target 是 damage Effect
 */
export const organ_rustySeparator: EffectFunc = (event, _effect) => {
    const damageEffect = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEffect(damageEffect)) return false

    const host = event.source
    if (!isEntity(host)) return false

    const rng = getContextRandom("rustySeparator")
    const roll = rng.nextFloatRange(0, 1)

    if (roll < 0.3) {
        damageEffect.params.value = 0
        newLog([host, "过期隔板：完全抵消伤害"])
    } else if (roll < 0.5) {
        const currentArmor = getCurrentValue(host as any, "armor")
        if (currentArmor > 0) {
            changeCurrentValue(host as any, "armor", 0, event)
            newLog([host, "过期隔板：装甲崩裂，护甲清零"])
        }
    }

    return true
}

/**
 * 急救电池：受到伤害后，若生命低于阈值则自动回血，全局限用 N 次
 *
 * 在 after take damage 触发，event.medium 是器官本身
 * 器官需声明 charges status 作为剩余次数计数器
 *
 * params:
 *   threshold: number - 触发生命比例阈值（如 0.3 表示 30%）
 *   value: number     - 回血量
 */
export const organ_emergencyBattery: EffectFunc = (event, effect) => {
    const organ = event.medium
    if (!(organ instanceof Organ)) return false

    const charges = organ.status["charges"]
    if (!charges || Number(charges.value) <= 0) return false

    const owner = organ.owner
    if (!isEntity(owner)) return false

    const threshold = Number(effect.params.threshold ?? 0.3)
    const currentHealth = getCurrentValue(owner as any, "health")
    const maxHealth = Number((owner as any).status["max-health"]?.value ?? currentHealth)

    if (currentHealth / maxHealth > threshold) return false

    const healAmount = Number(effect.params.value ?? 10)
    doEvent({
        key: "heal",
        source: organ,
        medium: organ,
        target: owner,
        effectUnits: [{ key: "heal", params: { value: healAmount } }]
    })

    charges.setOriginalBaseValue(Number(charges.baseValue) - 1)
    newLog([organ, `急救电池触发，回复 ${healAmount} 生命，剩余 ${charges.value} 次`])

    return true
}

/**
 * 信息素腺体：每回合给所有存活友军（含自身）+N层指挥
 * params:
 *   stacks: number - 每回合指挥层数 (default: 1)
 */
export const organ_pheromoneGland: EffectFunc = (_event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const stacks = Number(effect.params?.stacks ?? 1)
    for (const ally of battle.getAliveEnemies()) {
        getStateModifier(ally).changeStack("command", "default", stacks)
    }
    newLog([`信息素扩散：所有友军 +${stacks} 指挥层`])
    return true
}

/**
 * 王室甲壳：每回合根据存活友军数量获得护甲
 * params:
 *   value: number - 每只友军提供的护甲值 (default: 3)
 */
export const gainArmorPerAlly: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const armorPerAlly = Number(effect.params?.value ?? 3)
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const allyCount = battle.getAliveEnemies().filter(e => e !== target).length
    if (allyCount <= 0) return false

    doEvent({
        key: "gainArmor",
        source: event.source,
        medium: event.medium,
        target,
        effectUnits: [{ key: "gainArmor", params: { value: allyCount * armorPerAlly } }]
    })
    return true
}

/**
 * 热量积累器：每回合固定积累热量，达到阈值时过载爆发
 * params:
 *   add: number           - 每回合增加的热量 (default: 2)
 *   threshold: number     - 过载阈值 (default: 6)
 *   overloadDamage: number - 过载对玩家造成的伤害 (default: 30)
 *   selfDamage: number    - 过载后自身失去的生命 (default: 15)
 */
export const organ_heatAccumulate: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const add = Number(effect.params?.add ?? 2)
    const threshold = Number(effect.params?.threshold ?? 6)
    const overloadDamage = Number(effect.params?.overloadDamage ?? 30)
    const selfDamage = Number(effect.params?.selfDamage ?? 15)

    const stateModifier = getStateModifier(target as any)
    stateModifier.changeStack("heat", "default", add)
    newLog([target, `热量 +${add}`])

    const heatStacks = stateModifier.getState("heat")?.stacks.find(s => s.key === "default")?.stack ?? 0
    if (heatStacks >= threshold) {
        newLog([target, `热量达到 ${heatStacks} 层，过载爆发！`])
        stateModifier.removeState("heat")

        const battle = nowBattle.value
        if (battle) {
            for (const player of battle.getAlivePlayers()) {
                doEvent({
                    key: "damage",
                    source: target,
                    medium: event.medium,
                    target: player,
                    effectUnits: [{ key: "damage", params: { value: overloadDamage } }]
                })
            }
        }

        doEvent({
            key: "loseHealth",
            source: target,
            medium: event.medium,
            target,
            effectUnits: [{ key: "loseHealth", params: { value: selfDamage } }]
        })
    }
    return true
}

/**
 * 毒素护甲：每回合首次受到伤害后获得护甲（通过 poisonArmorUsed 状态限制每回合只触发一次）
 * 配套：回合开始时需 removeState("poisonArmorUsed") 重置
 * params:
 *   value: number - 获得的护甲量 (default: 3)
 */
export const organ_poisonArmor: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const stateModifier = getStateModifier(target as any)
    const usedStacks = stateModifier.getState("poisonArmorUsed")?.stacks.find(s => s.key === "default")?.stack ?? 0
    if (usedStacks > 0) return false

    stateModifier.changeStack("poisonArmorUsed", "default", 1)
    const armorAmount = Number(effect.params?.value ?? 3)
    doEvent({
        key: "gainArmor",
        source: event.source,
        medium: event.medium,
        target,
        effectUnits: [{ key: "gainArmor", params: { value: armorAmount } }]
    })
    newLog([target, `毒素护甲：+${armorAmount} 护甲`])
    return true
}

/**
 * 毒素脉冲：每回合给自身和所有玩家施加中毒
 * params:
 *   stacks: number - 施加的中毒层数 (default: 1)
 */
export const organ_toxicPulse: EffectFunc = (event, effect) => {
    const battle = nowBattle.value
    if (!battle) return false

    const stacks = Number(effect.params?.stacks ?? 1)
    const target = Array.isArray(event.target) ? event.target[0] : event.target

    if (isEntity(target)) {
        doEvent({
            key: "applyState",
            source: event.medium,
            medium: event.medium,
            target,
            effectUnits: [{ key: "applyState", params: { stateKey: "poison", stacks } }]
        })
    }
    for (const player of battle.getAlivePlayers()) {
        doEvent({
            key: "applyState",
            source: event.medium,
            medium: event.medium,
            target: player,
            effectUnits: [{ key: "applyState", params: { stateKey: "poison", stacks } }]
        })
    }
    return true
}

/**
 * 护甲冲撞：消耗施法者当前所有护甲，对目标造成等量伤害
 */
export const organ_armorBash: EffectFunc = (event, _effect) => {
    const source = event.source
    if (!isEntity(source)) return false

    const armorAmount = getCurrentValue(source as any, "armor")
    if (armorAmount <= 0) return false

    changeCurrentValue(source as any, "armor", 0, event)
    newLog([source, `消耗 ${armorAmount} 护甲发动护甲冲撞`])

    doEvent({
        key: "damage",
        source: event.source,
        medium: event.medium,
        target: event.target,
        effectUnits: [{ key: "damage", params: { value: armorAmount } }]
    })

    return true
}

/**
 * 变硬：按层数百分比减少本次伤害（10%/层），然后移除变硬状态
 * target 为触发的 damage Effect
 */
export const state_hardenAbsorb: EffectFunc = (event, effect) => {
    const stacks = Number(effect.params.stacks)
    if (stacks <= 0) return false

    const target = event.target
    if (Array.isArray(target) || !isEffect(target) || target.key !== "damage") return false

    const oldValue = Number(target.params.value)
    const reduction = Math.min(stacks * 0.1, 1)
    target.params.value = Math.max(0, Math.round(oldValue * (1 - reduction)))

    return true
}

/**
 * 撕咬：造成 base + 力量层数×strengthMult 点伤害
 * params: base, strengthMult
 */
export const card_strengthBite: EffectFunc = (event, effect) => {
    const base = Number(effect.params.base)
    const mult = Number(effect.params.strengthMult ?? 2)
    const source = event.source
    if (!isEntity(source)) return false

    const strengthState = getStateModifier(source as any).getState("power")
    const strengthStacks = strengthState?.stacks.find(s => s.key === "default")?.stack ?? 0
    const totalDamage = base + strengthStacks * mult

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
 * 剧毒心核：拦截 applyState 效果，若目标是 poison 则 stacks+1
 * targetType: triggerEffect（event.target 是 applyState Effect 对象）
 */
export const organ_poisonAmplify: EffectFunc = (event, _effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEffect(target)) return false
    if (target.key !== "applyState") return false
    if (target.params.stateKey !== "poison") return false
    target.params.stacks = Number(target.params.stacks ?? 1) + 1
    return true
}

/**
 * 腐化铠甲：回合结束时，每有1个对手具备 debuff 则获得 n 点护甲
 * params: { value } — 每个对手的护甲量
 */
export const organ_corruptionArmor: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const battle = nowBattle.value
    if (!battle) return false

    const armorPerDebuffOpponent = Number(effect.params?.value ?? 3)

    // 对手列表：持有者是敌人→玩家；持有者是玩家→敌人
    const opponents = isEnemy(target) ? battle.getAlivePlayers() : battle.getAliveEnemies()

    let debuffCount = 0
    for (const opponent of opponents) {
        const states = getStateModifier(opponent as any).getAllStates()
        const hasDebuff = states.some(s => {
            const data = stateList.find(d => d.key === s.key)
            if (data?.category !== "debuff") return false
            return (s.stacks.find(st => st.key === "default")?.stack ?? 0) > 0
        })
        if (hasDebuff) debuffCount++
    }

    if (debuffCount <= 0) return false

    const armorGain = debuffCount * armorPerDebuffOpponent
    doEvent({
        key: "gainArmor",
        source: event.source,
        medium: event.medium,
        target,
        effectUnits: [{ key: "gainArmor", params: { value: armorGain } }]
    })
    newLog([target, `腐化铠甲：+${armorGain} 护甲（${debuffCount} 个对手有 debuff）`])
    return true
}

/**
 * 相位转换：当持有者 HP 降至阈值以下时，将 actions-per-turn 提升至目标值
 * params: { threshold, actions }
 */
export const organ_phaseShift: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return false

    const threshold = Number(effect.params?.threshold ?? 0.5)
    const actionsTarget = Number(effect.params?.actions ?? 2)

    const currentHealth = getCurrentValue(target as any, "health")
    const maxHealth = Number((target as any).status?.["max-health"]?.value ?? currentHealth)
    if (maxHealth <= 0) return false

    if (currentHealth / maxHealth >= threshold) return false

    const actionsStatus = (target as any).status?.["actions-per-turn"]
    if (!actionsStatus) return false
    if (Number(actionsStatus.value) >= actionsTarget) return false

    actionsStatus.setOriginalBaseValue(actionsTarget)
    newLog([target, `相位转换：每回合行动次数增加至 ${actionsTarget}`])
    return true
}

/**
 * 菌网扩散：给随机一个对手施加 n 层中毒
 * params: { stacks }
 */
export const organ_mycelialSpread: EffectFunc = (event, effect) => {
    const source = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(source)) return false

    const battle = nowBattle.value
    if (!battle) return false

    const stacks = Number(effect.params?.stacks ?? 2)
    const opponents = isEnemy(source) ? battle.getAlivePlayers() : battle.getAliveEnemies()
    if (opponents.length === 0) return false

    const rng = getContextRandom("mycelialSpread")
    const idx = Math.floor(rng.nextFloatRange(0, opponents.length))
    const randomOpponent = opponents[idx]

    doEvent({
        key: "applyState",
        source: event.source,
        medium: event.medium,
        target: randomOpponent,
        effectUnits: [{ key: "applyState", params: { stateKey: "poison", stacks } }]
    })
    newLog([source, `菌网扩散：对`, randomOpponent, `施加 ${stacks} 层中毒`])
    return true
}

/**
 * 腐食再生：使用攻击牌后，按缺失HP百分比回血，每场战斗上限为最大HP×50%
 * params: coefficient（回血系数，默认0.3）
 * 预算通过 lifeStealBudget 状态层数追踪（初始值 = maxHp×50%）
 */
export const organ_lifeSteal: EffectFunc = (event, effect) => {
    const source = event.source
    if (!isEntity(source)) return false

    const maxHp = (source as any).status?.["max-health"]?.value ?? 0
    const currentHp = getCurrentValue(source as any, "health", 0)
    if (maxHp <= 0 || currentHp >= maxHp) return false

    const stateModifier = getStateModifier(source as any)
    const budgetState = stateModifier.getState("lifeStealBudget")
    if (!budgetState) return false

    const defaultStack = budgetState.stacks.find(s => s.key === "default")
    const budget = defaultStack?.stack ?? 0
    if (budget <= 0) return false

    const coefficient = Number(effect.params.coefficient ?? 0.3)
    const missingPercent = (maxHp - currentHp) / maxHp
    const healAmount = Math.max(1, Math.round(missingPercent * coefficient * maxHp))
    const actualHeal = Math.min(healAmount, budget)

    changeCurrentValue(source as any, "health", currentHp + actualHeal, event)
    if (defaultStack) defaultStack.stack = Math.max(0, defaultStack.stack - actualHeal)

    newLog([source, `腐食再生：回复 ${actualHeal} 点生命，剩余预算 ${budget - actualHeal}`])
    return true
}
