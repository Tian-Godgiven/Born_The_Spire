import type { Entity } from "@/core/objects/system/Entity"
import { isEntity, isEnemy } from "@/core/utils/typeGuards"
import { nowBattle } from "@/core/objects/game/battle"

export interface TriggerMountTargetSpec {
    key: string
    count?: number
}

/**
 * 解析触发器挂载目标
 *
 * 根据 spec.key 和 owner 的阵营，返回应挂载触发器的目标实体列表。
 * 若 spec 为空或 key 无法匹配，返回 [owner]。
 *
 * 支持的 key 值：
 *   "player"          — 随机1个存活玩家（语法糖）
 *   "allOpponents"    — 所有对手
 *   "allPlayers"      — 所有存活玩家
 *   "allEnemies"      — 所有存活敌人
 *   "randomOpponents" — 随机 count 个对手（需提供 count）
 *
 * @param spec  挂载目标描述，可以是字符串或 { key, count? } 对象
 * @param owner 持有该触发器的实体，用于判断阵营和作为默认目标
 */
export function resolveTriggerMountTargets(
    spec: string | TriggerMountTargetSpec | null | undefined,
    owner: Entity
): Entity[] {
    if (!spec) return [owner]

    const { key, count } = typeof spec === "string"
        ? { key: spec, count: undefined }
        : spec

    const battle = nowBattle.value
    if (!battle) return []

    const opponentTeam = isEnemy(owner) ? "player" : "enemy"

    if (key === "player") {
        const all = battle.getAlivePlayers().filter(isEntity) as Entity[]
        return all.length ? [all[Math.floor(Math.random() * all.length)]] : []
    }
    if (key === "allOpponents") {
        return (battle.getTeam(opponentTeam) ?? []).filter(isEntity) as Entity[]
    }
    if (key === "allPlayers") {
        return battle.getAlivePlayers().filter(isEntity) as Entity[]
    }
    if (key === "allEnemies") {
        return battle.getAliveEnemies().filter(isEntity) as Entity[]
    }
    if (key === "randomOpponents" && count) {
        const all = (battle.getTeam(opponentTeam) ?? []).filter(isEntity) as Entity[]
        const shuffled = [...all]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled.slice(0, count)
    }

    return [owner]
}
