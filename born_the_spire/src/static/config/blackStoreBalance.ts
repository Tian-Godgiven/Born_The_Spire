/**
 * 黑市数值平衡配置
 * 集中管理黑市相关的价格、折扣等数值设定
 */

/**
 * 遗物价格（按稀有度）
 */
export const relicPriceByRarity: Record<string, number> = {
    common: 150,
    uncommon: 250,
    rare: 350
}

/**
 * 遗物默认价格（未设置稀有度时使用）
 */
export const relicDefaultPrice = 200

/**
 * 药水价格
 */
export const potionDefaultPrice = 75

/**
 * 卡牌价格
 */
export const cardPriceConfig = {
    base: 50,           // 基础价格
    costMultiplier: 50   // 每点费用额外增加的价格
}

/**
 * 器官出售折扣范围
 */
export const organDiscountRange = {
    min: 0.5,   // 最低折扣 50%
    max: 0.7    // 最高折扣 70%
}

/**
 * 物质出售配置
 */
export const materialSellConfig = {
    pricePerMaterial: 3,        // 每点物质的基础价格（金钱）
    depreciationFactor: 0.85    // 每次出售后的贬值系数（0.85 = 降低 15%）
}

/**
 * 生命值出售配置
 */
export const healthSellConfig = {
    pricePerHp: 5,              // 每点生命值的基础价格
    depreciationFactor: 0.8     // 每次出售后的贬值系数（0.8 = 降低 20%）
}

/**
 * 遗物栏位配置类型
 *
 * 每个栏位描述一次抽取规则：
 *   固定规则：直接指定 pool / rarity 等条件
 *   概率规则：通过 chances 数组按权重随机选择一条规则
 */
export type RelicSlotConfig = DrawConfig | {
    chances: { weight: number, drawConfig: DrawConfig }[]
}

/**
 * 默认遗物栏位配置
 * 栏位1：必定商店遗物
 * 栏位2：必定罕见以上的通用遗物
 * 栏位3：30%商店遗物，70%通用遗物随机稀有度
 */
import type { DrawConfig } from "@/core/hooks/draw"

export const defaultRelicSlots: RelicSlotConfig[] = [
    { pool: "shop" },
    { pool: "common", rarity: ["uncommon", "rare"] },
    {
        chances: [
            { weight: 30, drawConfig: { pool: "shop" } },
            { weight: 70, drawConfig: { pool: "common" } },
        ]
    },
]
