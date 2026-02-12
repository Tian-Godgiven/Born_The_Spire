/**
 * 器官稀有度系统
 */

import { applyVariance } from "@/core/hooks/variance"
import { OrganQuality, QualityConfig } from "@/core/types/OrganTypes"

/**
 * 稀有度配置列表
 */
export const qualityConfigList: QualityConfig[] = [
    {
        key: OrganQuality.Common,
        label: "普通",
        color: "#FFFFFF",           // 白色
        baseAbsorbValue: 20,        // 吞噬获得 20 物质
        upgradeCostMultiplier: 1.1, // 升级消耗 110% 吞噬获取量
        upgradeVariance: 0.1,       // 升级成本 ±10% 波动
        repairCostMultiplier: 0.6,  // 修复消耗 60% 吞噬获取量
        assimilateCostMultiplier: 0.2, // 同化消耗 20% 吞噬获取量
        blackStorePrice: 100        // 黑市售价 100 金币
    },
    {
        key: OrganQuality.Uncommon,
        label: "罕见",
        color: "#1EFF00",           // 绿色
        baseAbsorbValue: 35,
        upgradeCostMultiplier: 1.1,
        upgradeVariance: 0.1,
        repairCostMultiplier: 0.6,
        assimilateCostMultiplier: 0.2,
        blackStorePrice: 180
    },
    {
        key: OrganQuality.Rare,
        label: "稀有",
        color: "#0070DD",           // 蓝色
        baseAbsorbValue: 55,
        upgradeCostMultiplier: 1.1,
        upgradeVariance: 0.1,
        repairCostMultiplier: 0.6,
        assimilateCostMultiplier: 0.2,
        blackStorePrice: 280
    },
    {
        key: OrganQuality.Epic,
        label: "史诗",
        color: "#A335EE",           // 紫色
        baseAbsorbValue: 80,
        upgradeCostMultiplier: 1.1,
        upgradeVariance: 0.1,
        repairCostMultiplier: 0.6,
        assimilateCostMultiplier: 0.2,
        blackStorePrice: 400
    },
    {
        key: OrganQuality.Legendary,
        label: "传说",
        color: "#FF8000",           // 橙色
        baseAbsorbValue: 120,
        upgradeCostMultiplier: 1.1,
        upgradeVariance: 0.1,
        repairCostMultiplier: 0.6,
        assimilateCostMultiplier: 0.2,
        blackStorePrice: 600
    }
]

/**
 * 根据稀有度获取配置
 */
export function getQualityConfig(quality: OrganQuality): QualityConfig {
    const config = qualityConfigList.find(c => c.key === quality)
    if (!config) {
        throw new Error(`未找到稀有度配置: ${quality}`)
    }
    return config
}

/**
 * 根据稀有度获取显示名称
 */
export function getQualityLabel(quality: OrganQuality): string {
    return getQualityConfig(quality).label
}

/**
 * 根据稀有度获取颜色
 */
export function getQualityColor(quality: OrganQuality): string {
    return getQualityConfig(quality).color
}

/**
 * 计算器官的吞噬获取量
 * @param quality 稀有度
 * @param customValue 自定义值（可选）
 * @returns 吞噬获取量
 */
export function calculateAbsorbValue(quality: OrganQuality, customValue?: number): number {
    if (customValue !== undefined) {
        return customValue
    }
    return getQualityConfig(quality).baseAbsorbValue
}

/**
 * 计算升级成本
 * @param quality 稀有度
 * @param absorbValue 吞噬获取量
 * @param applyVariance 是否应用随机波动（默认 true）
 * @returns 升级成本
 */
export function calculateUpgradeCost(quality: OrganQuality, absorbValue: number, ifApplyVariance: boolean = true): number {
    const config = getQualityConfig(quality)
    const baseCost = Math.floor(absorbValue * config.upgradeCostMultiplier)

    if (!ifApplyVariance || !config.upgradeVariance) {
        return baseCost
    }

    // 应用随机波动
    return applyVariance(baseCost, { variance: config.upgradeVariance })
}

/**
 * 计算修复成本
 * @param quality 稀有度
 * @param absorbValue 吞噬获取量
 * @returns 修复成本
 */
export function calculateRepairCost(quality: OrganQuality, absorbValue: number): number {
    const config = getQualityConfig(quality)
    return Math.floor(absorbValue * config.repairCostMultiplier)
}

/**
 * 计算同化成本
 * @param quality 稀有度
 * @param absorbValue 吞噬获取量
 * @returns 同化成本
 */
export function calculateAssimilateCost(quality: OrganQuality, absorbValue: number): number {
    const config = getQualityConfig(quality)
    return Math.floor(absorbValue * config.assimilateCostMultiplier)
}

/**
 * 计算黑市价格
 * @param quality 稀有度
 * @param level 器官等级
 * @returns 黑市价格
 */
export function calculateBlackStorePrice(quality: OrganQuality, level: number): number {
    const config = getQualityConfig(quality)
    // 基础价格 + 等级加成（每级增加 20%）
    return Math.floor(config.blackStorePrice * (1 + (level - 1) * 0.2))
}
