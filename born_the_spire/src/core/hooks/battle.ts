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
    console.log('[endBattle hook] 被调用，结果:', result)
    const battle = nowBattle.value
    if (!battle) {
        console.warn('[endBattle] 当前没有进行中的战斗')
        return
    }

    console.log('[endBattle hook] battle.isEnded:', battle.isEnded)
    if (battle.isEnded) {
        console.warn('[endBattle] 战斗已经结束')
        return
    }

    console.log('[endBattle hook] 调用 battle.endBattle')
    // 调用 Battle 实例的 endBattle 方法
    battle.endBattle(result === 'win' ? 'player_win' : 'player_lose')
    console.log('[endBattle hook] battle.endBattle 调用完成')
}
