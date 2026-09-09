import type { Battle } from "./battle";
import type { Enemy } from "@/core/objects/target/Enemy"
import type { Player } from "@/core/objects/target/Player"
import { selectAction, selectTurnActions } from "@/core/objects/system/EnemyBehavior"
import { newLog } from "@/ui/hooks/global/log"
import { startCharaTurn, endCharaTurn } from "@/core/effects/turn"

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

    // 护甲清零、中毒结算、器官的回合开始效果都挂在 turnStart 上
    await startCharaTurn(enemy, battle)

    // 回合开始的结算（中毒扣血等）可能当场打死敌人，死了就不该再行动、也不该走回合结束
    if (enemy.current.isAlive?.value !== 1) {
        newLog([`${enemy.label} 在回合开始时死亡，跳过行动`])
        return
    }

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
 *   2. 有 moves 时选一招（可多张牌）；否则按 actions-per-turn 把 pattern 评 n 次
 *   3. 从抽牌堆抽 handSize 张组成手牌（行动牌保序，垃圾牌随机插入）
 *   4. 根据手牌中的行动牌设置意图（多张则多段意图并排）
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

        const handSize = enemy.behavior.handSize ?? 5

        // 2. 选本回合行动牌。有剧本 moves 时一回合只决定一招（可多张）；
        // 否则按 actions-per-turn 把 pattern 评 n 次。
        if (enemy.behavior.moves?.list?.length) {
            const result = await selectTurnActions(enemy.behavior, enemy, player, turnCount)
            result.cards.forEach((card, order) => {
                const intent = Array.isArray(result.intent) ? result.intent[order] : result.intent
                enemy.drawPile.actions.push({ card, order, intent })
            })
        } else {
            const actionsPerTurn = Number(enemy.status["actions-per-turn"]?.value || 1)
            for (let order = 0; order < actionsPerTurn; order++) {
                const result = await selectAction(enemy.behavior, enemy, player, turnCount)
                if (result.cards.length > 0) {
                    const intent = Array.isArray(result.intent) ? result.intent[0] : result.intent
                    enemy.drawPile.actions.push({
                        card: result.cards[0],
                        order,
                        intent
                    })
                }
            }
        }

        // 3. 构建手牌
        const drawnActions = enemy.buildHand(handSize)

        // 4. 设置意图（仅展示行动牌，让玩家可以预判）
        if (drawnActions.length > 0) {
            const intentCards = drawnActions.map(a => a.card)
            const declared = drawnActions.map(a => a.intent)
            const intentType = declared.some(type => type !== undefined) ? declared : undefined
            await enemy.setIntent(intentCards, "card", intentType, player)
        } else {
            enemy.clearIntent()
        }
    }
}
