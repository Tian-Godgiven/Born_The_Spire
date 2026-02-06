/**
 * 随机波动系统
 * 为游戏内的数值提供随机波动，增加游戏体验的多样性
 */

import { getContextRandom } from "./random"

/**
 * 波动配置
 */
export interface VarianceConfig {
    min?: number        // 最小倍率（默认 0.9，即 -10%）
    max?: number        // 最大倍率（默认 1.1，即 +10%）
    variance?: number   // 对称波动范围（0-1），例如 0.1 表示 ±10%，会覆盖 min/max
    context?: string    // 随机数上下文（用于确定性随机）
}

/**
 * 为数值添加随机波动
 * @param baseValue 基础值
 * @param config 波动配置
 * @returns 波动后的值（向下取整）
 *
 * @example
 * // 使用对称波动
 * applyVariance(100, { variance: 0.1 })  // 90-110 之间随机
 *
 * // 使用自定义上下限
 * applyVariance(100, { min: 0.8, max: 1.3 })  // 80-130 之间随机
 *
 * // 只有下限
 * applyVariance(100, { min: 0.5 })  // 50-110 之间随机
 *
 * // 指定上下文（用于确定性随机）
 * applyVariance(100, { variance: 0.1, context: "cardDamage" })
 */
export function applyVariance(baseValue: number, config?: VarianceConfig): number {
    if (!config) {
        return baseValue
    }

    let minMultiplier: number
    let maxMultiplier: number

    // 如果指定了 variance，使用对称波动
    if (config.variance !== undefined) {
        minMultiplier = 1 - config.variance
        maxMultiplier = 1 + config.variance
    } else {
        // 否则使用自定义上下限
        minMultiplier = config.min ?? 0.9
        maxMultiplier = config.max ?? 1.1
    }

    // 计算波动后的值
    const minValue = baseValue * minMultiplier
    const maxValue = baseValue * maxMultiplier

    // 使用确定性随机数生成器
    const rng = getContextRandom(config.context || "variance")
    const randomValue = minValue + rng.next() * (maxValue - minValue)

    return Math.floor(randomValue)
}

/**
 * 为数值添加随机波动（返回整数）
 * 这是 applyVariance 的别名，语义更清晰
 */
export const randomVariance = applyVariance

/**
 * 预设的波动配置
 */
export const VariancePresets = {
    /** 无波动 */
    None: {},

    /** 微小波动 ±5% */
    Tiny: { variance: 0.05 },

    /** 小波动 ±10% */
    Small: { variance: 0.1 },

    /** 中等波动 ±15% */
    Medium: { variance: 0.15 },

    /** 大波动 ±20% */
    Large: { variance: 0.2 },

    /** 巨大波动 ±30% */
    Huge: { variance: 0.3 },

    /** 伤害波动（-10% ~ +20%）*/
    Damage: { min: 0.9, max: 1.2 },

    /** 治疗波动（-5% ~ +15%）*/
    Heal: { min: 0.95, max: 1.15 },

    /** 成本波动（-15% ~ +5%）*/
    Cost: { min: 0.85, max: 1.05 },
}

/**
 * 在指定范围内生成随机整数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @param context 随机数上下文（用于确定性随机）
 * @returns 随机整数
 */
export function randomInt(min: number, max: number, context?: string): number {
    const rng = getContextRandom(context || "randomInt")
    return rng.nextInt(min, max)
}

/**
 * 在指定范围内生成随机浮点数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @param context 随机数上下文（用于确定性随机）
 * @returns 随机浮点数
 */
export function randomFloat(min: number, max: number, context?: string): number {
    const rng = getContextRandom(context || "randomFloat")
    return min + rng.next() * (max - min)
}

/**
 * 根据概率返回 true 或 false
 * @param probability 概率（0-1）
 * @param context 随机数上下文（用于确定性随机）
 * @returns 是否触发
 */
export function randomChance(probability: number, context?: string): boolean {
    const rng = getContextRandom(context || "randomChance")
    return rng.next() < probability
}
