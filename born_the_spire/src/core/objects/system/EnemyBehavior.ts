import type { Card } from "@/core/objects/item/Subclass/Card"
import type { CardSelector } from "./CardSelector"
import type { Enemy } from "../target/Enemy"
import type { Player } from "../target/Player"
import type { IntentType } from "./Intent"

import { selectCards } from "./CardSelector"
import { getCardByKey } from "@/static/list/item/cardList"
import { getStateStack } from "./State"
import { getOrganModifier } from "./modifier/OrganModifier"

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
        stacks?: number     // 最少层数（不填且无 below 时默认 > 0）
        below?: number      // 层数严格小于
    }
    // 自身是否仍持有指定器官
    hasOrgan?: string
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

    // 意图类型（可选，声明后直接使用，不声明则从卡牌效果推导）
    intent?: IntentType | IntentType[]

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
    }

    // 描述（用于调试）
    describe?: string
}

/**
 * 敌人行为配置
 *
 * 一个敌人的完整行为配置
 */
/**
 * 一招里的一张牌：指定 key，或从一组 key 里随机抽一张
 */
export type MoveCardSlot = string | string[]

/**
 * 剧本里的一招：本回合要打出的牌（可多张）
 */
export type EnemyMove = {
    condition?: BehaviorCondition
    intent?: IntentType | IntentType[]
    cards: MoveCardSlot[]
    weight?: number
    describe?: string
}

/**
 * 杀戮尖塔式行动剧本：每回合选一招，一招可以打出多张牌
 */
export type EnemyMovesConfig = {
    mode?: "loop" | "sequence" | "weighted"
    list: EnemyMove[]
}

/**
 * 敌人行为配置
 *
 * 一个敌人的完整行为配置
 */
export type EnemyBehaviorConfig = {
    // 行为模式列表（按优先级和顺序检查）
    patterns?: BehaviorPattern[]

    // 杀戮尖塔式剧本：每回合选一招（可多张牌）。patterns 仍可插队
    moves?: EnemyMovesConfig

    // 默认行为（当所有条件都不满足时）
    fallback?: BehaviorPattern

    // 每回合手牌数量（默认 5）
    handSize?: number
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
        const playerHealthPercent = (Number(player.current.health.value) / Number(player.status["max-health"].value)) * 100

        if (condition.playerHealth.below !== undefined && playerHealthPercent >= Number(condition.playerHealth.below)) {
            return false
        }
        if (condition.playerHealth.above !== undefined && playerHealthPercent <= Number(condition.playerHealth.above)) {
            return false
        }
        if (condition.playerHealth.equals !== undefined && Math.abs(playerHealthPercent - Number(condition.playerHealth.equals)) > 0.01) {
            return false
        }
    }

    // 检查敌人血量条件
    if (condition.selfHealth) {
        const selfHealthPercent = (Number(enemy.current.health.value) / Number(enemy.status["max-health"].value)) * 100

        if (condition.selfHealth.below !== undefined && selfHealthPercent >= Number(condition.selfHealth.below)) {
            return false
        }
        if (condition.selfHealth.above !== undefined && selfHealthPercent <= Number(condition.selfHealth.above)) {
            return false
        }
        if (condition.selfHealth.equals !== undefined && Math.abs(selfHealthPercent - Number(condition.selfHealth.equals)) > 0.01) {
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
        const stackValue = getStateStack(target as any, condition.hasState.stateKey)
        const stacks = stackValue === false ? 0 : stackValue
        const spec = condition.hasState
        if (spec.stacks !== undefined && stacks < spec.stacks) {
            return false
        }
        if (spec.below !== undefined && stacks >= spec.below) {
            return false
        }
        if (spec.stacks === undefined && spec.below === undefined && stacks <= 0) {
            return false
        }
    }

    if (condition.hasOrgan) {
        if (!getOrganModifier(enemy).hasOrgan(condition.hasOrgan)) {
            return false
        }
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
 * 获取兜底卡牌
 *
 * 当筛选器没有匹配到卡牌时，根据 selector 的 tags 返回兜底卡牌：
 * - tags 包含 "defence"：返回基础防御卡
 * - 其他情况（包括 "attack" 或无 tags）：返回基础打击卡
 */
async function getFallbackCard(availableCards: Card[], selector: CardSelector): Promise<Card | null> {
    // 指定了具体卡却没抽到：不要拿打击顶上，否则「没电池就不打重锤」会变成打出基础打击
    if (selector.key) {
        return null
    }

    const tags = selector.tags
    const hasDefenceTag = tags?.includes("defence")

    const fallbackKey = hasDefenceTag ? "original_card_00014" : "original_card_00001"

    // 优先从可用卡牌中找
    const fallbackCard = availableCards.find(card => card.key === fallbackKey)
    if (fallbackCard) return fallbackCard

    // 兜底中的兜底：动态创建
    try {
        return await getCardByKey(fallbackKey)
    } catch {
        return null
    }
}

/**
 * 根据行为模式选择卡牌
 *
 * @param pattern 行为模式
 * @param availableCards 可用卡牌列表
 * @returns 选择的卡牌列表
 */
export async function selectActionCards(
    pattern: BehaviorPattern,
    availableCards: Card[],
    enemy?: Enemy
): Promise<Card[]> {
    const { selector, mode = "random", weights, sequence } = pattern.action

    // 先用筛选器过滤卡牌
    let filteredCards = selectCards(availableCards, selector)

    if (filteredCards.length === 0) {
        // 兜底逻辑：根据 selector 的 tags 决定兜底卡牌
        const fallbackCard = await getFallbackCard(availableCards, selector)
        if (fallbackCard) {
            return [fallbackCard]
        }
        console.warn("[EnemyBehavior] 没有符合条件的卡牌，也无法兜底")
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
        case "loop": {
            // 序列模式：按顺序选择。指针存在敌人实例上，不会改共享配置
            if (!sequence || sequence.length === 0) {
                console.warn("[EnemyBehavior] sequence/loop 模式需要提供 sequence 配置")
                return [filteredCards[0]]
            }
            const cursor = enemy?.aiCursor ?? 0
            const selected = selectBySequence(filteredCards, sequence, cursor, mode === "loop")
            if (enemy && selected.length > 0) {
                enemy.aiCursor = cursor + 1
            }
            return selected
        }

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
export type SelectActionResult = {
    cards: Card[]
    intent?: IntentType | IntentType[]
}

function resolveMoveCards(slots: MoveCardSlot[], availableCards: Card[]): Card[] {
    const result: Card[] = []
    for (const slot of slots) {
        const keys = Array.isArray(slot) ? slot : [slot]
        const candidates = keys
            .map(key => availableCards.find(card => card.key === key))
            .filter((card): card is Card => card !== undefined)
        if (candidates.length === 0) {
            console.warn(`[EnemyBehavior] 剧本卡牌 ${keys.join(" / ")} 不在可用卡牌中`)
            return []
        }
        result.push(candidates[Math.floor(Math.random() * candidates.length)])
    }
    return result
}

function pickWeightedMove(moves: { move: EnemyMove, cards: Card[] }[]): { move: EnemyMove, cards: Card[] } | undefined {
    if (moves.length === 0) return undefined
    let totalWeight = 0
    for (const entry of moves) {
        totalWeight += entry.move.weight ?? 1
    }
    let random = Math.random() * totalWeight
    for (const entry of moves) {
        random -= entry.move.weight ?? 1
        if (random <= 0) return entry
    }
    return moves[0]
}

async function matchPatterns(
    behaviorConfig: EnemyBehaviorConfig,
    enemy: Enemy,
    player: Player,
    turnCount: number,
    availableCards: Card[]
): Promise<SelectActionResult | undefined> {
    const patterns = behaviorConfig.patterns ?? []
    const sortedPatterns = [...patterns].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

    for (const pattern of sortedPatterns) {
        if (pattern.condition && !evaluateCondition(pattern.condition, enemy, player, turnCount)) {
            continue
        }
        const selectedCards = await selectActionCards(pattern, availableCards, enemy)
        if (selectedCards.length > 0) {
            return { cards: selectedCards, intent: pattern.intent }
        }
    }
    return undefined
}

async function selectMove(
    movesConfig: EnemyMovesConfig,
    enemy: Enemy,
    player: Player,
    turnCount: number,
    availableCards: Card[]
): Promise<SelectActionResult> {
    const list = movesConfig.list
    if (!list || list.length === 0) return { cards: [] }

    const mode = movesConfig.mode ?? "loop"

    const eligible = (move: EnemyMove): Card[] | undefined => {
        if (move.condition && !evaluateCondition(move.condition, enemy, player, turnCount)) {
            return undefined
        }
        const cards = resolveMoveCards(move.cards, availableCards)
        return cards.length > 0 ? cards : undefined
    }

    if (mode === "weighted") {
        const candidates: { move: EnemyMove, cards: Card[] }[] = []
        for (const move of list) {
            const cards = eligible(move)
            if (cards) candidates.push({ move, cards })
        }
        const picked = pickWeightedMove(candidates)
        if (!picked) return { cards: [] }
        return { cards: picked.cards, intent: picked.move.intent }
    }

    const n = list.length
    if (mode === "sequence") {
        const start = enemy.aiCursor
        if (start >= n) return { cards: [] }
        for (let i = start; i < n; i++) {
            const cards = eligible(list[i])
            if (!cards) continue
            enemy.aiCursor = i + 1
            return { cards, intent: list[i].intent }
        }
        return { cards: [] }
    }

    // loop：从当前指针起绕一圈，条件不满足的招跳过
    const start = ((enemy.aiCursor % n) + n) % n
    for (let step = 0; step < n; step++) {
        const i = (start + step) % n
        const cards = eligible(list[i])
        if (!cards) continue
        enemy.aiCursor = (i + 1) % n
        return { cards, intent: list[i].intent }
    }
    return { cards: [] }
}

/**
 * 一回合的完整行动：先看 patterns 插队，再走剧本 moves。
 * 有 moves 时不要按 actions-per-turn 把同一套条件评多遍。
 */
export async function selectTurnActions(
    behaviorConfig: EnemyBehaviorConfig,
    enemy: Enemy,
    player: Player,
    turnCount: number
): Promise<SelectActionResult> {
    const availableCards = await enemy.getAvailableCards()
    if (availableCards.length === 0) {
        console.warn("[EnemyBehavior] 敌人没有可用卡牌")
        return { cards: [] }
    }

    const interrupt = await matchPatterns(behaviorConfig, enemy, player, turnCount, availableCards)
    if (interrupt) return interrupt

    if (behaviorConfig.moves?.list?.length) {
        const moved = await selectMove(behaviorConfig.moves, enemy, player, turnCount, availableCards)
        if (moved.cards.length > 0) return moved
    }

    if (behaviorConfig.fallback) {
        const selectedCards = await selectActionCards(behaviorConfig.fallback, availableCards, enemy)
        return { cards: selectedCards, intent: behaviorConfig.fallback.intent }
    }

    return { cards: [] }
}

export async function selectAction(
    behaviorConfig: EnemyBehaviorConfig,
    enemy: Enemy,
    player: Player,
    turnCount: number
): Promise<SelectActionResult> {
    const availableCards = await enemy.getAvailableCards()

    if (availableCards.length === 0) {
        console.warn("[EnemyBehavior] 敌人没有可用卡牌")
        return { cards: [] }
    }

    const matched = await matchPatterns(behaviorConfig, enemy, player, turnCount, availableCards)
    if (matched) return matched

    if (behaviorConfig.fallback) {
        const selectedCards = await selectActionCards(behaviorConfig.fallback, availableCards, enemy)
        return { cards: selectedCards, intent: behaviorConfig.fallback.intent }
    }

    console.warn("[EnemyBehavior] 没有匹配的行为模式，随机选择")
    const randomIndex = Math.floor(Math.random() * availableCards.length)
    return { cards: [availableCards[randomIndex]] }
}
