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
 * 生命值出售配置
 */
export const healthSellConfig = {
    pricePerHp: 5,              // 每点生命值的基础价格
    depreciationFactor: 0.8     // 每次出售后的贬值系数（0.8 = 降低 20%）
}
