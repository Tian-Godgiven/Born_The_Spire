import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { nowBattle } from "@/core/objects/game/battle"
import { getCompanionByKey } from "@/static/list/target/companionList"
import { getEnemyByKey, getEnemyMapByKey } from "@/static/list/target/enemyList"
import { createCompanion } from "@/core/factories"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { getActingPlayer, isCompanion, isEnemy } from "@/core/utils/typeGuards"
import { newLog } from "@/ui/hooks/global/log"

/** Summon a battle-only ally with its own lifecycle state. */
export const summonCompanion: EffectFunc = async (event, effect) => {
    const battle = nowBattle.value
    const companionKey = String(effect.params?.companionKey ?? "")
    const summonKey = String(effect.params?.summonKey ?? "")
    const maxCopies = Number(effect.params?.maxCopies)
    const successStateKey = String(effect.params?.successStateKey ?? "")
    const controller = getActingPlayer(event.source, event.target)
    if (!battle || !controller || (!companionKey && !summonKey)) return false

    const companion = companionKey
        ? await getCompanionByKey(companionKey)
        : await createCompanion({
            ...getEnemyMapByKey(summonKey),
            targetWeight: 1,
            autoAct: true,
            showIntent: true,
            uiSize: "small"
        })
    const copies = battle.getAliveCompanions(controller.__id)
        .filter(existing => existing.key === companion.key)
    if (Number.isFinite(maxCopies) && maxCopies > 0 && copies.length >= maxCopies) {
        newLog([controller, "的召唤物已达到数量上限"])
        return false
    }

    companion.controllerId = controller.__id
    if (!await battle.addCompanion(companion)) return false

    const duration = Number(effect.params?.duration)
    const lifecycleStateKey = Number.isFinite(duration) && duration > 0 ? "temporarySummon" : "summoned"
    await doEvent({
        key: "summonCompanion",
        source: controller,
        medium: event.medium,
        target: companion,
        effectUnits: [{ key: "applyState", params: {
            stateKey: lifecycleStateKey,
            stacks: lifecycleStateKey === "temporarySummon" ? duration : 1
        } }]
    })
    if (successStateKey) {
        await doEvent({
            key: "summonCompanionSuccess",
            source: controller,
            medium: controller,
            target: controller,
            effectUnits: [{ key: "applyState", params: { stateKey: successStateKey, stacks: 1 } }]
        })
    }
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
    const enemyKey = String(effect.params?.enemyKey ?? effect.params?.summonKey ?? "")
    const count = Math.max(1, Number(effect.params?.count ?? 1))
    const duration = Number(effect.params?.duration)
    const successStateKey = String(effect.params?.successStateKey ?? "")
    const summoner = Array.isArray(event.source) ? event.source[0] : event.source
    if (!battle || !enemyKey || !isEnemy(summoner)) return false

    let summonedCount = 0
    for (let index = 0; index < count; index++) {
        const enemy = await getEnemyByKey(enemyKey)
        const added = await battle.addSummonedEnemy(enemy)
        if (!added) continue
        summonedCount += 1
        const lifecycleStateKey = Number.isFinite(duration) && duration > 0 ? "temporarySummon" : "summoned"
        const effectUnits = [{ key: "applyState", params: {
            stateKey: lifecycleStateKey,
            stacks: lifecycleStateKey === "temporarySummon" ? duration : 1
        } }]
        await doEvent({
            key: "summonEnemy",
            source: summoner,
            medium: event.medium,
            target: enemy,
            effectUnits
        })
    }
    if (summonedCount > 0 && successStateKey) {
        await doEvent({
            key: "summonEnemySuccess",
            source: summoner,
            medium: summoner,
            target: summoner,
            effectUnits: [{ key: "applyState", params: { stateKey: successStateKey, stacks: 1 } }]
        })
    }
    return summonedCount > 0
}

/** 根据召唤者阵营选择召唤物类型的统一召唤入口。 */
export const summon: EffectFunc = async (event, effect) => {
    const source = Array.isArray(event.source) ? event.source[0] : event.source
    if (isEnemy(source)) return summonEnemy(event, effect)
    // 没有 companionKey 时，summonKey 会复用 enemyList 定义创建同源 Companion。
    return summonCompanion(event, effect)
}
