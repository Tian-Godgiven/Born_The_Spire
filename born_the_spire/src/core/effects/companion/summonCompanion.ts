import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { nowBattle } from "@/core/objects/game/battle"
import { getCompanionByKey } from "@/static/list/target/companionList"
import { getEnemyByKey } from "@/static/list/target/enemyList"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { getActingPlayer, isCompanion, isEnemy } from "@/core/utils/typeGuards"
import { newLog } from "@/ui/hooks/global/log"

/** Summon a battle-only ally with its own lifecycle state. */
export const summonCompanion: EffectFunc = async (event, effect) => {
    const battle = nowBattle.value
    const companionKey = String(effect.params?.companionKey ?? "")
    const maxCopies = Number(effect.params?.maxCopies)
    const controller = getActingPlayer(event.source, event.target)
    if (!battle || !controller || !companionKey) return false

    const copies = battle.getAliveCompanions(controller.__id)
        .filter(companion => companion.key === companionKey)
    if (Number.isFinite(maxCopies) && maxCopies > 0 && copies.length >= maxCopies) {
        newLog([controller, "的召唤物已达到数量上限"])
        return false
    }

    const companion = await getCompanionByKey(companionKey)
    companion.controllerId = controller.__id
    if (!await battle.addCompanion(companion)) return false

    await doEvent({
        key: "summonCompanion",
        source: controller,
        medium: event.medium,
        target: companion,
        effectUnits: [{ key: "applyState", params: { stateKey: "summoned", stacks: 1 } }]
    })
    await battle.prepareCompanionIntents()
    newLog([controller, "召唤了", companion])
    return true
}

/** Remove a summon without firing death events or changing isAlive. */
export const removeCompanion: EffectFunc = (event, effect) => {
    return removeSummonedCombatant(event, effect)
}

/** Remove any battle-only combatant without firing death events. */
export const removeSummonedCombatant: EffectFunc = (event) => {
    const battle = nowBattle.value
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!battle || (!isCompanion(target) && !isEnemy(target))) return false
    const removed = battle.removeCombatant(target)
    if (removed) newLog([target, "消灭了"])
    return removed
}

/** Enemy-side summons reuse Enemy behavior and join the enemy team. */
export const summonEnemy: EffectFunc = async (event, effect) => {
    const battle = nowBattle.value
    const enemyKey = String(effect.params?.enemyKey ?? "")
    const count = Math.max(1, Number(effect.params?.count ?? 1))
    const duration = Number(effect.params?.duration)
    const summoner = Array.isArray(event.source) ? event.source[0] : event.source
    if (!battle || !enemyKey || !isEnemy(summoner)) return false

    for (let index = 0; index < count; index++) {
        const enemy = await getEnemyByKey(enemyKey)
        if (!await battle.addSummonedEnemy(enemy)) continue
        const effectUnits = [{ key: "applyState", params: { stateKey: "summoned", stacks: 1 } }]
        if (Number.isFinite(duration) && duration > 0) {
            effectUnits.push({ key: "applyState", params: { stateKey: "summonedDuration", stacks: duration } })
        }
        await doEvent({
            key: "summonEnemy",
            source: summoner,
            medium: event.medium,
            target: enemy,
            effectUnits
        })
    }
    return true
}
