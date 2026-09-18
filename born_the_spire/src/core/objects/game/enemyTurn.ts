import type { Battle } from "./battle";
import type { Enemy } from "@/core/objects/target/Enemy"
import type { Companion } from "@/core/objects/target/Companion"
import type { Chara } from "@/core/objects/target/Target"
import { selectAction, selectTurnActions } from "@/core/objects/system/EnemyBehavior"
import { isEnemy } from "@/core/utils/typeGuards"
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
    target: Chara,
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
        await enemy.executeHandInOrder(target)
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
    turnCount: number,
    battle: Battle
) {
    for (const enemy of enemies) {
        if (enemy.current.isAlive?.value !== 1) continue
        const target = battle.getRandomAliveCombatant("player")
        if (!target) return
        await executeEnemyTurn(enemy, target, turnCount, battle)
    }
}

/** 玩家回合结束后，友军召唤物按敌人的自动行动规则行动。 */
export async function executeAllCompanionsTurn(
    companions: Companion[],
    turnCount: number,
    battle: Battle
) {
    for (const companion of companions) {
        if (!companion.autoAct) continue
        if (companion.current.isAlive?.value !== 1) continue
        const plannedTarget = companion._intentTarget
        const target = isEnemy(plannedTarget) && plannedTarget.current.isAlive?.value === 1
            ? plannedTarget
            : battle.getRandomAliveCombatant("enemy")
        if (!target) return
        if (companion.hand.length === 0) {
            await prepareEnemyIntents([companion], target, turnCount)
        }
        await executeEnemyTurn(companion, target, turnCount, battle)
        // 自动单位的本回合意图已经消耗；showIntent 只决定 UI 是否可显示一个待执行意图。
        companion.clearIntent()
    }
}

/** 为友军召唤物预先选择行动，供玩家在自己的回合中查看。 */
export async function prepareCompanionIntents(companions: Companion[], turnCount: number, battle: Battle) {
    for (const companion of companions) {
        if (!companion.autoAct || companion.hand.length > 0) continue
        const target = battle.getRandomAliveCombatant("enemy")
        if (!target) return
        await prepareEnemyIntents([companion], target, turnCount)
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
    target: Chara,
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
            const result = await selectTurnActions(enemy.behavior, enemy, target as any, turnCount)
            result.cards.forEach((card, order) => {
                const intent = Array.isArray(result.intent) ? result.intent[order] : result.intent
                enemy.drawPile.actions.push({ card, order, intent })
            })
        } else {
            const actionsPerTurn = Number(enemy.status["actions-per-turn"]?.value || 1)
            for (let order = 0; order < actionsPerTurn; order++) {
                const result = await selectAction(enemy.behavior, enemy, target as any, turnCount)
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
            await enemy.setIntent(intentCards, "card", intentType, target)
        } else {
            enemy.clearIntent()
        }
    }
}
