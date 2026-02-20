/**
 * 器官相关类型定义
 */

/**
 * 器官部位枚举
 */
export enum OrganPart {
    Heart = "heart",        // 心脏
    Lung = "lung",          // 肺
    Liver = "liver",        // 肝脏
    Stomach = "stomach",    // 胃
    Brain = "brain",        // 大脑
    Eye = "eye",            // 眼睛
    Skin = "skin",          // 皮肤
    Bone = "bone",          // 骨骼
    Muscle = "muscle",      // 肌肉
    Blood = "blood",        // 血液
    Nerve = "nerve",        // 神经
    Gland = "gland",        // 腺体
    Core = "core",          // 核心
}

/**
 * 部位配置
 */
export type PartConfig = {
    key: OrganPart          // 部位标识
    label: string           // 显示名称
    maxCount: number        // 该部位最多可装备几个器官
    description?: string    // 部位描述
}

/**
 * 器官稀有度枚举
 */
export enum OrganQuality {
    Common = "common",          // 普通
    Uncommon = "uncommon",      // 罕见
    Rare = "rare",              // 稀有
    Epic = "epic",              // 史诗
    Legendary = "legendary"     // 传说
}

/**
 * 稀有度配置
 */
export type QualityConfig = {
    key: OrganQuality           // 稀有度标识
    label: string               // 显示名称
    color: string               // 颜色代码（用于 UI 显示）
    baseAbsorbValue: number     // 基础吞噬获取量
    upgradeCostMultiplier: number   // 升级成本倍率（相对于吞噬获取量）
    upgradeVariance?: number    // 升级成本波动范围（可选，默认 ±10%）
    repairCostMultiplier: number    // 修复成本倍率
    assimilateCostMultiplier: number // 同化成本倍率
    blackStorePrice: number     // 黑市基础价格
}
