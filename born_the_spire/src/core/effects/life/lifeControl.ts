import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent"
import { changeCurrentValue, getCurrentValue } from "@/core/objects/system/Current/current"
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isEntity } from "@/core/utils/typeGuards"
import { newError } from "@/ui/hooks/global/alert"
import { newLog } from "@/ui/hooks/global/log"
import { nowBattle } from "@/core/objects/game/battle"
import { endBattle } from "@/core/hooks/battle"

/**
 * 杀死目标
 *
 * 将目标的 isAlive 设置为 0
 * 可以被 before 触发器阻止（如不死效果）
 *
 * params:
 * - reason?: string - 死亡原因（用于日志）
 */
export const killTarget: EffectFunc = (event: ActionEvent, effect) => {
    const reason = effect.params.reason || "未知原因"
    const { target } = event

    handleEventEntity(target, (t) => {
        // kill 只能作用于实体对象
        if (!isEntity(t)) {
            newError(["kill 效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }

        // 检查是否有 isAlive 当前值
        if (!t.current.isAlive) {
            newError(["目标没有 isAlive 当前值，无法杀死:", t.label])
            return
        }

        // 如果已经死亡，不重复处理
        if (getCurrentValue(t, "isAlive", 1) === 0) {
            newLog(["目标已经死亡", t.label])
            return
        }

        newLog(["杀死目标", t.label, `原因: ${reason}`])

        // 将 isAlive 设置为 0
        changeCurrentValue(t, "isAlive", 0, event)

        console.log('[killTarget] 目标已死亡:', t.label)
        console.log('[killTarget] nowBattle.value:', nowBattle.value)
        console.log('[killTarget] nowBattle.value?.isEnded:', nowBattle.value?.isEnded)

        // 检查战斗是否应该结束
        if (nowBattle.value && !nowBattle.value.isEnded) {
            console.log('[killTarget] 检查战斗是否结束...')
            const battleResult = nowBattle.value.checkBattleEnd()
            console.log('[killTarget] 战斗结果:', battleResult)
            if (battleResult) {
                console.log('[killTarget] 调用 endBattle:', battleResult)
                endBattle(battleResult === 'player_win' ? 'win' : 'lose')
            }
        } else {
            console.log('[killTarget] 跳过战斗结束检查，原因:',
                !nowBattle.value ? '没有战斗' : '战斗已结束')
        }
    })

    return true
}

/**
 * 复活目标
 *
 * 将目标的 isAlive 设置为 1
 *
 * params:
 * - healAmount?: number - 复活时恢复的生命值（可选）
 */
export const reviveTarget: EffectFunc = (event: ActionEvent, effect) => {
    const healAmount = effect.params.healAmount
    const { target } = event

    handleEventEntity(target, (t) => {
        // revive 只能作用于实体对象
        if (!isEntity(t)) {
            newError(["revive 效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }

        // 检查是否有 isAlive 当前值
        if (!t.current.isAlive) {
            newError(["目标没有 isAlive 当前值，无法复活:", t.label])
            return
        }

        // 如果已经存活，不重复处理
        if (getCurrentValue(t, "isAlive", 1) === 1) {
            newLog(["目标已经存活", t.label])
            return
        }

        newLog(["复活目标", t.label])

        // 将 isAlive 设置为 1
        changeCurrentValue(t, "isAlive", 1, event)

        // 如果指定了恢复生命值
        if (healAmount !== undefined && t.current.health) {
            const currentHealth = getCurrentValue(t, "health", 0)
            const newHealth = currentHealth + Number(healAmount)
            changeCurrentValue(t, "health", newHealth, event)
            newLog(["复活时恢复生命", t.label, `+${healAmount}`])
        }
    })

    return true
}
