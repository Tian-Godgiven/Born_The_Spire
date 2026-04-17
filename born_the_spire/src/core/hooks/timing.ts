/**
 * 统一时机注册系统
 *
 * 提供统一入口，将回调注册到指定时机，触发后自动移除
 * 类似 ReferenceResolver 对 $ 语法的统一处理
 *
 * 支持的时机：
 *   battleEnd   → 战斗结束时
 *   battleStart → 战斗开始时
 *   turnEnd     → 回合结束时
 *   turnStart   → 回合开始时
 *
 * @param timing - 时机字符串
 * @param callback - 到达时机时执行的回调
 * @returns 取消注册的函数（提前移除）
 */

import { nowBattle } from "@/core/objects/game/battle"

export function registerTimingCallback(timing: string, callback: () => void): () => void {
    const player = nowBattle.value?.getTeam("player")?.[0]
    if (!player) {
        console.warn(`[registerTimingCallback] 无法注册时机 "${timing}"：找不到玩家`)
        return () => {}
    }

    const { remove } = player.appendTrigger({
        when: "after",
        how: "make",
        key: timing,
        callback: () => {
            callback()
            remove()
        }
    })

    return remove
}
