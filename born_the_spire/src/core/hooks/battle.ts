/**
 * 战斗相关的 hook 函数
 */

import { nowBattle } from "@/core/objects/game/battle"
import { nowPlayer } from "@/core/objects/game/run"
import { doEvent } from "@/core/objects/system/ActionEvent"

/**
 * 结束战斗
 *
 * 设置战斗结束标志并触发 battleEnd 事件
 *
 * @param result - 战斗结果 ('win' | 'lose')
 */
export function endBattle(result: 'win' | 'lose'): void {
    const battle = nowBattle.value
    if (!battle) {
        console.warn('[endBattle] 当前没有进行中的战斗')
        return
    }

    if (battle.isEnded) {
        console.warn('[endBattle] 战斗已经结束')
        return
    }

    // 设置战斗结束标志
    battle.isEnded = true

    // 触发 battleEnd 事件
    doEvent({
        key: "battleEnd",
        source: nowPlayer,
        medium: nowPlayer,
        target: nowPlayer,
        info: { result },
        effectUnits: []
    })
}
