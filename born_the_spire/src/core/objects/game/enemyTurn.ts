import { Enemy } from "@/core/objects/target/Enemy"
import { Player } from "@/core/objects/target/Player"
import { selectAction } from "@/core/objects/system/EnemyBehavior"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 敌人回合管理
 *
 * 处理敌人回合的完整流程：
 * 1. 回合开始
 * 2. 选择行动（根据行为配置）
 * 3. 设置意图
 * 4. 执行意图
 * 5. 回合结束
 */

/**
 * 执行敌人回合
 *
 * 执行敌人已经设置好的意图（意图应该在玩家回合开始前通过 prepareEnemyIntents 设置）
 *
 * @param enemy 敌人
 * @param player 玩家
 * @param turnCount 当前回合数
 */
export async function executeEnemyTurn(
    enemy: Enemy,
    player: Player,
    turnCount: number
) {
    newLog(["===== 敌人回合开始 =====", enemy.label])

    // 检查是否有意图
    if (!enemy.intent) {
        console.warn(`[EnemyTurn] 敌人 ${enemy.label} 没有设置意图，尝试重新选择行动`)

        // 如果没有意图，尝试重新选择（容错处理）
        const selectedCards = selectAction(
            enemy.behavior,
            enemy,
            player,
            turnCount
        )

        if (selectedCards.length === 0) {
            console.warn(`[EnemyTurn] 敌人 ${enemy.label} 没有可用行动`)
            return
        }

        enemy.setIntent(selectedCards)
    }

    // 执行已经设置好的意图
    await enemy.executeIntent(player)

    newLog(["===== 敌人回合结束 =====", enemy.label])
}

/**
 * 执行所有敌人的回合
 *
 * @param enemies 敌人列表
 * @param player 玩家
 * @param turnCount 当前回合数
 */
export async function executeAllEnemiesTurn(
    enemies: Enemy[],
    player: Player,
    turnCount: number
) {
    for (const enemy of enemies) {
        // 跳过已死亡的敌人
        if (enemy.current.isAlive?.value !== 1) {
            continue
        }

        // 检查是否有多次行动
        const actionsPerTurn = enemy.status["actions-per-turn"]?.value || 1

        // 执行多次行动
        for (let i = 0; i < actionsPerTurn; i++) {
            if (i > 0) {
                newLog([`${enemy.label} 第 ${i + 1} 次行动`])
            }
            await executeEnemyTurn(enemy, player, turnCount)
        }
    }
}

/**
 * 准备敌人的意图（在玩家回合开始前调用）
 *
 * 让所有敌人选择下回合的行动并设置意图，供玩家查看
 *
 * @param enemies 敌人列表
 * @param player 玩家
 * @param turnCount 当前回合数
 */
export function prepareEnemyIntents(
    enemies: Enemy[],
    player: Player,
    turnCount: number
) {
    newLog(["准备敌人意图", `回合 ${turnCount}`])

    for (const enemy of enemies) {
        // 跳过已死亡的敌人
        if (enemy.current.isAlive?.value !== 1) {
            continue
        }

        // 选择行动
        const selectedCards = selectAction(
            enemy.behavior,
            enemy,
            player,
            turnCount
        )

        // 设置意图
        if (selectedCards.length > 0) {
            enemy.setIntent(selectedCards)
        }
    }
}
