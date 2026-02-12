import { StatusMap } from "@/core/types/StatusMapData"

export function getMap(key: string) {
    if (isStatusKey(key)) {
        return statusMapList[key]
    }
    return false
}

/**
 * 属性注册表
 *
 * 用途：
 *   定义游戏中所有可用的属性（Status）
 *   为开发者提供类型提示和文档
 *   支持 mod 开发者注册自定义属性
 *
 * 分类：
 *   base - 基础属性（生命、能量等）
 *   combat - 战斗属性（力量、护甲等）
 *   card - 卡牌相关属性（费用、抽牌数等）
 *   special - 特殊属性（行动顺序等）
 */
export const statusMapList: Record<string, StatusMap> = {
    // === 基础属性 ===
    "health": {
        label: "生命",
        value: 0,
        describe: "当前生命值",
        category: "base"
    },
    "max-health": {
        label: "最大生命",
        value: 0,
        describe: "生命值上限",
        category: "base",
        notNegative: true
    },
    "energy": {
        label: "能量",
        value: 0,
        describe: "当前能量值",
        category: "base",
        notNegative: true
    },
    "max-energy": {
        label: "最大能量",
        value: 0,
        describe: "每回合恢复的能量上限",
        category: "base",
        notNegative: true
    },
    "max-potion": {
        label: "最大药水数",
        value: 0,
        describe: "可携带的药水数量上限",
        category: "base",
        notNegative: true
    },

    // === 战斗属性 ===
    "strength": {
        label: "力量",
        value: 0,
        describe: "增加攻击伤害",
        category: "combat"
    },
    "dexterity": {
        label: "敏捷",
        value: 0,
        describe: "增加格挡值",
        category: "combat"
    },
    "block": {
        label: "格挡",
        value: 0,
        describe: "抵挡伤害的护甲值",
        category: "combat",
        notNegative: true
    },
    "vulnerable": {
        label: "易伤",
        value: 0,
        describe: "受到的伤害增加50%",
        category: "combat",
        notNegative: true
    },
    "weak": {
        label: "虚弱",
        value: 0,
        describe: "造成的伤害减少25%",
        category: "combat",
        notNegative: true
    },
    "frail": {
        label: "脆弱",
        value: 0,
        describe: "获得的格挡减少25%",
        category: "combat",
        notNegative: true
    },

    // === 卡牌相关属性 ===
    "cost": {
        label: "消耗",
        value: 0,
        describe: "使用该卡牌消耗的能量",
        category: "card",
        notNegative: true
    },
    "draw-per-turn": {
        label: "每回合抽牌数",
        value: 5,
        describe: "回合开始时抽取的卡牌数量",
        category: "card",
        notNegative: true
    },

    // === 特殊属性 ===
    "action-order": {
        label: "行动顺序",
        value: 0,
        describe: "决定行动先后顺序，数字越小越先行动",
        category: "special"
    },
    "ifBloodMark": {
        label: "染血标记",
        value: 0,
        describe: "是否已染血（0=未染血，1=已染血）",
        category: "special",
        hidden: true
    }
} as const

// 获取 statusMapList 中键的类型
type StatusKey = keyof typeof statusMapList;

// 自定义类型保护函数，验证 key 是否是 statusMapList 的有效键
function isStatusKey(key: any): key is StatusKey {
    return key in statusMapList;
}

/**
 * 注册自定义属性（供 mod 开发者使用）
 * @param key 属性键名
 * @param config 属性配置
 * @returns 是否注册成功
 *
 * @example
 * registerStatus("my-custom-stat", {
 *     label: "我的自定义属性",
 *     value: 0,
 *     describe: "这是一个自定义属性",
 *     category: "special"
 * })
 */
export function registerStatus(key: string, config: StatusMap): boolean {
    if (key in statusMapList) {
        console.warn(`[statusMap] 属性 "${key}" 已存在，注册失败`)
        return false
    }
    // @ts-ignore - 动态添加属性
    statusMapList[key] = config
    return true
}

/**
 * 获取所有已注册的属性键
 */
export function getAllStatusKeys(): string[] {
    return Object.keys(statusMapList)
}

/**
 * 根据分类获取属性列表
 */
export function getStatusByCategory(category: "base" | "combat" | "card" | "special"): Record<string, StatusMap> {
    const result: Record<string, StatusMap> = {}
    for (const [key, value] of Object.entries(statusMapList)) {
        if (typeof value === 'object' && value.category === category) {
            result[key] = value
        }
    }
    return result
}