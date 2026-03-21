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
        return
    }

    if (battle.isEnded) {
        return
    }

    // 调用 Battle 实例的 endBattle 方法
    battle.endBattle(result === 'win' ? 'player_win' : 'player_lose')
}
