/**
 * 随机数生成 Hook
 * 提供基于游戏状态的确定性随机数生成，支持 SL 大法
 */

import { SeededRandom } from "@/core/utils/SeededRandom"
import { nowGameRun } from "@/core/objects/game/run"
import { nowBattle } from "@/core/objects/game/battle"

/**
 * 生成上下文种子
 * 根据当前游戏状态（层数、房间、回合等）生成唯一的种子字符串
 *
 * @param context - 额外的上下文信息（如卡牌ID、效果名称等）
 * @returns 种子字符串
 */
export function generateContextSeed(context?: string): string {
    const parts: string[] = []

    // 1. 游戏种子（基础种子）
    if (nowGameRun) {
        parts.push(`game:${nowGameRun.seed}`)
    }

    // 2. 当前层数
    if (nowGameRun) {
        parts.push(`floor:${nowGameRun.towerLevel}`)
    }

    // 3. 当前房间（使用房间历史长度作为房间索引）
    if (nowGameRun) {
        const roomIndex = nowGameRun.getCompletedRoomCount()
        parts.push(`room:${roomIndex}`)
    }

    // 4. 当前回合数（如果在战斗中）
    if (nowBattle.value) {
        parts.push(`turn:${nowBattle.value.turnNumber}`)
    }

    // 5. 额外上下文
    if (context) {
        parts.push(`ctx:${context}`)
    }

    return parts.join('|')
}

/**
 * 获取基于当前游戏状态的随机数生成器
 *
 * @param context - 额外的上下文信息（如 "discoverCard"、"cardId:123" 等）
 * @returns SeededRandom 实例
 *
 * @example
 * // 在卡牌效果中使用
 * const rng = getContextRandom("discoverCard")
 * const randomCards = rng.shuffle(allCards).slice(0, 3)
 *
 * @example
 * // 为特定卡牌生成随机数
 * const rng = getContextRandom(`card:${card.__id}`)
 * const damage = rng.nextInt(5, 10)
 */
export function getContextRandom(context?: string): SeededRandom {
    const seed = generateContextSeed(context)
    return new SeededRandom(seed)
}

/**
 * 生成随机整数 [min, max]
 *
 * @param min - 最小值（包含）
 * @param max - 最大值（包含）
 * @param context - 上下文信息
 * @returns 随机整数
 *
 * @example
 * const damage = randomInt(5, 10, "cardDamage")
 */
export function randomInt(min: number, max: number, context?: string): number {
    const rng = getContextRandom(context)
    return rng.nextInt(min, max)
}

/**
 * 从数组中随机选择一个元素
 *
 * @param array - 数组
 * @param context - 上下文信息
 * @returns 随机选中的元素
 *
 * @example
 * const card = randomChoice(availableCards, "selectReward")
 */
export function randomChoice<T>(array: T[], context?: string): T {
    const rng = getContextRandom(context)
    return rng.choice(array)
}

/**
 * 从数组中随机选择多个元素（不重复）
 *
 * @param array - 数组
 * @param count - 选择数量
 * @param context - 上下文信息
 * @returns 随机选中的元素数组
 *
 * @example
 * const cards = randomChoices(allCards, 3, "discoverCard")
 */
export function randomChoices<T>(array: T[], count: number, context?: string): T[] {
    const rng = getContextRandom(context)
    const shuffled = rng.shuffle(array)
    return shuffled.slice(0, Math.min(count, array.length))
}

/**
 * 打乱数组
 *
 * @param array - 数组
 * @param context - 上下文信息
 * @returns 打乱后的新数组
 *
 * @example
 * const shuffledDeck = randomShuffle(deck, "shuffleDeck")
 */
export function randomShuffle<T>(array: T[], context?: string): T[] {
    const rng = getContextRandom(context)
    return rng.shuffle(array)
}

/**
 * 生成随机浮点数 [0, 1)
 *
 * @param context - 上下文信息
 * @returns 随机浮点数
 *
 * @example
 * const chance = randomFloat("critChance")
 * if (chance < 0.3) { // 30% 暴击率
 *     // 暴击
 * }
 */
export function randomFloat(context?: string): number {
    const rng = getContextRandom(context)
    return rng.next()
}

/**
 * 根据概率返回布尔值
 *
 * @param probability - 概率 [0, 1]
 * @param context - 上下文信息
 * @returns 是否触发
 *
 * @example
 * if (randomChance(0.3, "critChance")) {
 *     // 30% 概率触发
 * }
 */
export function randomChance(probability: number, context?: string): boolean {
    return randomFloat(context) < probability
}
