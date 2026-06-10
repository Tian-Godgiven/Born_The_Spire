import type { Battle } from "./battle";
import type { Enemy } from "@/core/objects/target/Enemy"
import type { Player } from "@/core/objects/target/Player"
import { selectAction } from "@/core/objects/system/EnemyBehavior"
import { newLog } from "@/ui/hooks/global/log"
import { endCharaTurn } from "@/core/effects/turn"

/**
 * 敌人回合管理
 *
 * 处理敌人回合的完整流程，基于双牌堆系统：
 *   prepareEnemyIntents：行为选牌 → 进抽牌堆 → 抽手牌 → 设置意图
 *   executeEnemyTurn：按手牌顺序打出 → 清空手牌
 */

/**
 * 执行单个敌人的回合
 *
 * 按 hand 中的顺序依次打出卡牌（无 use 交互的牌自动跳过）。
 * 手牌全为垃圾牌（无可打出的牌）时直接跳过回合。
 */
export async function executeEnemyTurn(
    enemy: Enemy,
    player: Player,
    _turnCount: number,
    battle: Battle
) {
    newLog(["===== 敌人回合开始 =====", enemy.label])

    if (enemy.hand.length === 0) {
        newLog([`${enemy.label} 手牌为空，跳过回合`])
    } else {
        await enemy.executeHandInOrder(player)
        enemy.clearHandAfterTurn()
    }

    newLog(["===== 敌人回合结束 =====", enemy.label])
    await endCharaTurn(enemy, battle)
}

/**
 * 执行所有敌人的回合
 */
export async function executeAllEnemiesTurn(
    enemies: Enemy[],
    player: Player,
    turnCount: number,
    battle: Battle
) {
    for (const enemy of enemies) {
        if (enemy.current.isAlive?.value !== 1) continue
        await executeEnemyTurn(enemy, player, turnCount, battle)
    }
}

/**
 * 准备敌人的意图（在玩家回合开始前调用）
 *
 * 流程：
 *   1. 清理上回合残留的行动牌条目
 *   2. 行为模式执行 n 次（n = actions-per-turn），将 n 张行动牌放入抽牌堆
 *   3. 从抽牌堆抽 handSize 张组成手牌（行动牌保序，垃圾牌随机插入）
 *   4. 根据手牌中的行动牌设置意图
 */
export async function prepareEnemyIntents(
    enemies: Enemy[],
    player: Player,
    turnCount: number
) {
    newLog(["准备敌人意图", `回合 ${turnCount}`])

    for (const enemy of enemies) {
        if (enemy.current.isAlive?.value !== 1) continue
        if (!enemy.behavior) {
            console.warn(`[prepareEnemyIntents] 敌人 ${enemy.label} 没有行为配置`)
            continue
        }

        // 1. 清理上回合未消耗的行动牌条目（实际卡牌仍在 CardModifier，只清引用）
        enemy.drawPile.actions = []

        const actionsPerTurn = Number(enemy.status["actions-per-turn"]?.value || 1)
        const handSize = enemy.behavior.handSize ?? 5

        // 2. 行为模式执行 n 次，将选出的行动牌放入抽牌堆
        for (let order = 0; order < actionsPerTurn; order++) {
            const result = await selectAction(enemy.behavior, enemy, player, turnCount)
            if (result.cards.length > 0) {
                enemy.drawPile.actions.push({
                    card: result.cards[0],
                    order,
                    intent: result.intent
                })
            }
        }

        // 3. 构建手牌
        const drawnActions = enemy.buildHand(handSize)

        // 4. 设置意图（仅展示行动牌，让玩家可以预判）
        if (drawnActions.length > 0) {
            const intentCards = drawnActions.map(a => a.card)
            const intentType  = drawnActions[0].intent
            await enemy.setIntent(intentCards, "card", intentType, player)
        } else {
            enemy.clearIntent()
        }
    }
}
