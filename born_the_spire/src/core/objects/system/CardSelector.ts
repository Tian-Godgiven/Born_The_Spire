import { Card } from "@/core/objects/item/Subclass/Card"
import { getStatusValue, ifHaveStatus } from "@/core/objects/system/status/Status"
import { Organ } from "@/core/objects/target/Organ"

/**
 * 卡牌筛选器（通用工具）
 *
 * 用于在各种场景中筛选卡牌：
 * - 敌人AI选择行动卡牌
 * - 玩家效果筛选手牌/牌堆
 * - 遗物/器官触发条件判断
 * - 任何需要筛选卡牌的场景
 *
 * 所有条件之间是 AND 关系（同时满足）
 */
export type CardSelector = {
    key?: string                    // 指定具体卡牌key
    tags?: string[]                 // 标签列表（满足任一tag即可）
    organ?: string                  // 来源器官key
    effect?: string                 // 包含指定效果类型
    costRange?: [number, number]    // 费用范围 [min, max]
    count?: number                  // 选择数量（默认全部）
    random?: boolean                // 是否随机选择（默认false）
}

/**
 * 根据筛选器选择卡牌
 *
 * @param availableCards 可用卡牌池
 * @param selector 筛选器
 * @returns 筛选后的卡牌列表
 */
export function selectCards(
    availableCards: Card[],
    selector: CardSelector
): Card[] {
    let filtered = [...availableCards]

    // 按 key 筛选（精确匹配）
    if (selector.key) {
        filtered = filtered.filter(card => card.key === selector.key)
    }

    // 按 tags 筛选（满足任一tag）
    if (selector.tags && selector.tags.length > 0) {
        filtered = filtered.filter(card => {
            if (!card.tags || card.tags.length === 0) return false
            return card.tags.some(tag => selector.tags!.includes(tag))
        })
    }

    // 按 organ 筛选（来源器官）
    if (selector.organ) {
        filtered = filtered.filter(card => {
            if (!card.source) return false
            if (card.source instanceof Organ) {
                return card.source.key === selector.organ
            }
            return false
        })
    }

    // 按 effect 筛选（包含指定效果类型）
    if (selector.effect) {
        filtered = filtered.filter(card => {
            const useInteraction = card.getInteraction("use")
            if (!useInteraction || !useInteraction.effects) return false

            return useInteraction.effects.some(effect =>
                effect.key === selector.effect
            )
        })
    }

    // 按费用范围筛选
    if (selector.costRange) {
        const [min, max] = selector.costRange
        filtered = filtered.filter(card => {
            if (!ifHaveStatus(card, "cost")) return false
            const cost = getStatusValue(card, "cost")
            return cost >= min && cost <= max
        })
    }

    // 随机选择
    if (selector.random) {
        filtered = shuffleArray(filtered)
    }

    // 限制数量
    if (selector.count !== undefined && selector.count > 0) {
        filtered = filtered.slice(0, selector.count)
    }

    return filtered
}

/**
 * 洗牌算法（Fisher-Yates）
 */
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

/**
 * 验证筛选器是否有效
 */
export function validateCardSelector(selector: CardSelector): boolean {
    // 空对象是有效的（表示不筛选）
    if (Object.keys(selector).length === 0) return true

    // 检查 costRange 格式
    if (selector.costRange) {
        const [min, max] = selector.costRange
        if (min < 0 || max < min) {
            console.warn("[CardSelector] 无效的费用范围:", selector.costRange)
            return false
        }
    }

    // 检查 count
    if (selector.count !== undefined && selector.count < 0) {
        console.warn("[CardSelector] 无效的数量:", selector.count)
        return false
    }

    return true
}
