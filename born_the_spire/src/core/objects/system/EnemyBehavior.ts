import { Card } from "@/core/objects/item/Subclass/Card"
import { CardSelector, selectCards } from "./CardSelector"
import { Enemy } from "../target/Enemy"
import { Player } from "../target/Player"

/**
 * 敌人行为配置系统
 *
 * 定义敌人如何从可用卡牌中选择要使用的卡牌
 * 基于预设规则和条件判断，不涉及机器学习或智能算法
 */

/**
 * 条件类型
 *
 * 用于判断当前战斗状态
 */
export type BehaviorCondition = {
    // 玩家血量条件
    playerHealth?: {
        below?: number      // 低于百分比（0-100）
        above?: number      // 高于百分比
        equals?: number     // 等于百分比
    }
    // 敌人自身血量条件
    selfHealth?: {
        below?: number
        above?: number
        equals?: number
    }
    // 回合数条件
    turn?: {
        equals?: number     // 等于第几回合
        above?: number      // 大于第几回合
        below?: number      // 小于第几回合
        mod?: [number, number]  // [除数, 余数] 例如 [3, 0] 表示每3回合
    }
    // 状态层数条件
    hasState?: {
        target: "self" | "player"
        stateKey: string
        stacks?: number     // 层数要求（默认 > 0）
    }
    // 自定义条件函数
    custom?: (enemy: Enemy, player: Player) => boolean
}

/**
 * 行动选择模式
 */
export type ActionMode =
    | "random"      // 随机选择
    | "weighted"    // 权重随机
    | "sequence"    // 顺序执行
    | "loop"        // 循环执行

/**
 * 行为模式配置
 *
 * 定义一个行为规则：在满足条件时，如何选择卡牌
 */
export type BehaviorPattern = {
    // 条件（可选，不填表示无条件/默认行为）
    condition?: BehaviorCondition

    // 优先级（数字越大优先级越高，默认为 0）
    priority?: number

    // 行动配置
    action: {
        // 卡牌筛选器
        selector: CardSelector

        // 选择模式
        mode?: ActionMode

        // 权重配置（mode 为 weighted 时使用）
        weights?: Record<string, number>  // { cardKey: weight }

        // 序列配置（mode 为 sequence/loop 时使用）
        sequence?: string[]  // 卡牌 key 的顺序
        sequenceIndex?: number  // 当前执行到第几个（内部状态）
    }

    // 描述（用于调试）
    describe?: string
}

/**
 * 敌人行为配置
 *
 * 一个敌人的完整行为配置
 */
export type EnemyBehaviorConfig = {
    // 行为模式列表（按优先级和顺序检查）
    patterns: BehaviorPattern[]

    // 默认行为（当所有条件都不满足时）
    fallback?: BehaviorPattern
}

/**
 * 评估条件是否满足
 *
 * @param condition 条件配置
 * @param enemy 敌人
 * @param player 玩家
 * @param turnCount 当前回合数
 * @returns 是否满足条件
 */
export function evaluateCondition(
    condition: BehaviorCondition,
    enemy: Enemy,
    player: Player,
    turnCount: number
): boolean {
    // 检查玩家血量条件
    if (condition.playerHealth) {
        const playerHealthPercent = (player.current.health.value / player.status["max-health"].value) * 100

        if (condition.playerHealth.below !== undefined && playerHealthPercent >= condition.playerHealth.below) {
            return false
        }
        if (condition.playerHealth.above !== undefined && playerHealthPercent <= condition.playerHealth.above) {
            return false
        }
        if (condition.playerHealth.equals !== undefined && Math.abs(playerHealthPercent - condition.playerHealth.equals) > 0.01) {
            return false
        }
    }

    // 检查敌人血量条件
    if (condition.selfHealth) {
        const selfHealthPercent = (enemy.current.health.value / enemy.status["max-health"].value) * 100

        if (condition.selfHealth.below !== undefined && selfHealthPercent >= condition.selfHealth.below) {
            return false
        }
        if (condition.selfHealth.above !== undefined && selfHealthPercent <= condition.selfHealth.above) {
            return false
        }
        if (condition.selfHealth.equals !== undefined && Math.abs(selfHealthPercent - condition.selfHealth.equals) > 0.01) {
            return false
        }
    }

    // 检查回合数条件
    if (condition.turn) {
        if (condition.turn.equals !== undefined && turnCount !== condition.turn.equals) {
            return false
        }
        if (condition.turn.above !== undefined && turnCount <= condition.turn.above) {
            return false
        }
        if (condition.turn.below !== undefined && turnCount >= condition.turn.below) {
            return false
        }
        if (condition.turn.mod) {
            const [divisor, remainder] = condition.turn.mod
            if (turnCount % divisor !== remainder) {
                return false
            }
        }
    }

    // 检查状态层数条件
    if (condition.hasState) {
        const target = condition.hasState.target === "self" ? enemy : player
        // TODO: 需要实现 getStateStacks 方法
        // const stacks = target.getStateStacks?.(condition.hasState.stateKey) || 0
        // const requiredStacks = condition.hasState.stacks ?? 1
        // if (stacks < requiredStacks) {
        //     return false
        // }
    }

    // 检查自定义条件
    if (condition.custom) {
        if (!condition.custom(enemy, player)) {
            return false
        }
    }

    return true
}

/**
 * 根据行为模式选择卡牌
 *
 * @param pattern 行为模式
 * @param availableCards 可用卡牌列表
 * @returns 选择的卡牌列表
 */
export function selectActionCards(
    pattern: BehaviorPattern,
    availableCards: Card[]
): Card[] {
    const { selector, mode = "random", weights, sequence, sequenceIndex = 0 } = pattern.action

    // 先用筛选器过滤卡牌
    let filteredCards = selectCards(availableCards, selector)

    if (filteredCards.length === 0) {
        console.warn("[EnemyBehavior] 没有符合条件的卡牌")
        return []
    }

    // 根据模式选择卡牌
    switch (mode) {
        case "random":
            // 随机模式：已经在 selectCards 中处理（如果 selector.random 为 true）
            // 如果没有指定 random，这里随机选一张
            if (!selector.random) {
                const randomIndex = Math.floor(Math.random() * filteredCards.length)
                return [filteredCards[randomIndex]]
            }
            return filteredCards

        case "weighted":
            // 权重模式：根据权重随机选择
            if (!weights) {
                console.warn("[EnemyBehavior] weighted 模式需要提供 weights 配置")
                return [filteredCards[0]]
            }
            return selectByWeight(filteredCards, weights)

        case "sequence":
        case "loop":
            // 序列模式：按顺序选择
            if (!sequence || sequence.length === 0) {
                console.warn("[EnemyBehavior] sequence/loop 模式需要提供 sequence 配置")
                return [filteredCards[0]]
            }
            return selectBySequence(filteredCards, sequence, sequenceIndex, mode === "loop")

        default:
            return [filteredCards[0]]
    }
}

/**
 * 根据权重随机选择卡牌
 */
function selectByWeight(cards: Card[], weights: Record<string, number>): Card[] {
    // 计算总权重
    let totalWeight = 0
    const cardWeights: { card: Card, weight: number }[] = []

    for (const card of cards) {
        const weight = weights[card.key] ?? 1  // 默认权重为 1
        totalWeight += weight
        cardWeights.push({ card, weight })
    }

    // 随机选择
    let random = Math.random() * totalWeight
    for (const { card, weight } of cardWeights) {
        random -= weight
        if (random <= 0) {
            return [card]
        }
    }

    // 兜底
    return [cards[0]]
}

/**
 * 根据序列选择卡牌
 */
function selectBySequence(
    cards: Card[],
    sequence: string[],
    currentIndex: number,
    loop: boolean
): Card[] {
    // 获取当前应该使用的卡牌 key
    let index = currentIndex % sequence.length
    if (!loop && currentIndex >= sequence.length) {
        // 非循环模式且已经超出序列，使用最后一个
        index = sequence.length - 1
    }

    const targetKey = sequence[index]

    // 查找对应的卡牌
    const targetCard = cards.find(card => card.key === targetKey)
    if (targetCard) {
        return [targetCard]
    }

    // 如果找不到，返回第一张
    console.warn(`[EnemyBehavior] 序列中的卡牌 ${targetKey} 不在可用卡牌中`)
    return [cards[0]]
}

/**
 * 敌人行动决策
 *
 * 根据行为配置选择要使用的卡牌
 *
 * @param behaviorConfig 行为配置
 * @param enemy 敌人
 * @param player 玩家
 * @param turnCount 当前回合数
 * @returns 选择的卡牌列表
 */
export function selectAction(
    behaviorConfig: EnemyBehaviorConfig,
    enemy: Enemy,
    player: Player,
    turnCount: number
): Card[] {
    // 获取可用卡牌
    const availableCards = enemy.getAvailableCards()

    if (availableCards.length === 0) {
        console.warn("[EnemyBehavior] 敌人没有可用卡牌")
        return []
    }

    // 按优先级排序
    const sortedPatterns = [...behaviorConfig.patterns].sort((a, b) => {
        const priorityA = a.priority ?? 0
        const priorityB = b.priority ?? 0
        return priorityB - priorityA  // 降序
    })

    // 遍历行为模式，找到第一个满足条件的
    for (const pattern of sortedPatterns) {
        // 检查条件
        if (pattern.condition) {
            if (!evaluateCondition(pattern.condition, enemy, player, turnCount)) {
                continue  // 条件不满足，跳过
            }
        }

        // 条件满足，选择卡牌
        const selectedCards = selectActionCards(pattern, availableCards)
        if (selectedCards.length > 0) {
            console.log("[EnemyBehavior] 使用行为模式:", pattern.describe || "未命名")
            return selectedCards
        }
    }

    // 所有条件都不满足，使用默认行为
    if (behaviorConfig.fallback) {
        console.log("[EnemyBehavior] 使用默认行为")
        return selectActionCards(behaviorConfig.fallback, availableCards)
    }

    // 兜底：随机选择一张
    console.warn("[EnemyBehavior] 没有匹配的行为模式，随机选择")
    const randomIndex = Math.floor(Math.random() * availableCards.length)
    return [availableCards[randomIndex]]
}
