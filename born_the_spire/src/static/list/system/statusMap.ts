import type { StatusMap } from "@/core/types/StatusMapData"

export function getMap(key: string) {
    if (isStatusKey(key)) {
        return statusMapList[key]
    }
    return false
}

/**
 * 属性注册表
 *
 * 只登记"系统会读取的属性"——核心代码按 key 取值、或需要 notNegative 这类行为配置的。
 * createStatusFromMap 用 key 查这里拿配置，实体数据里的值再覆盖上去。
 *
 * 不登记卡牌/器官上的数值参数（damage / armor / weakStacks 这些）：
 *   它们是内容数据，每张卡自己定义就够了，没有跨内容复用的语义。
 *   未登记的 key 照样能创建 Status，只是拿不到 label / notNegative。
 *
 * 分类：
 *   base - 基础属性（生命上限、能量上限等）
 *   card - 卡牌相关属性（费用、抽牌数等）
 *   special - 特殊属性（行动顺序、各类开关与计数器）
 */
export const statusMapList: Record<string, StatusMap> = {
    // === 基础属性 ===
    "max-health": {
        label: "最大生命",
        value: 0,
        describe: "生命值上限",
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
    },
    "retain-on-turn-end": {
        label: "回合末保留",
        value: 0,
        describe: "大于 0 时，回合结束时该卡不会被自动丢弃（0=不保留，>=1=保留）",
        category: "card",
        hidden: true,
        notNegative: true
    },
    "cannot-play": {
        label: "不可打出",
        value: 0,
        describe: "大于 0 时，该卡无法主动打出（0=可打出，>=1=不可打出）",
        category: "card",
        hidden: true,
        notNegative: true
    },
    "cannot-remove": {
        label: "无法舍弃",
        value: 0,
        describe: "大于 0 时，该器官无法被舍弃（事件丢弃、移除、出售、部位吞噬）",
        category: "special",
        hidden: true,
        notNegative: true
    },
    "disabled": {
        label: "已失效",
        value: 0,
        describe: "大于 0 时，该物品被视为失效（使用方在 trigger 上加 condition 检查即可短路）",
        category: "special",
        hidden: true,
        notNegative: true
    },
    "hungry-beast-favor": {
        label: "宠物好感度",
        value: 0,
        describe: "饥饿的怪物 - 好感度计数（≥3 陪睡 / ≥6 共战 / ≥9 挡刀）",
        category: "special",
        hidden: true,
        notNegative: true
    },
    "hungry-beast-refuse-count": {
        label: "宠物未喂计数",
        value: 0,
        describe: "饥饿的怪物 - 连续未喂计数，≥3 时下场战斗强制占据",
        category: "special",
        hidden: true,
        notNegative: true
    },
    "hungry-beast-blocked-once": {
        label: "宠物本场已挡刀",
        value: 0,
        describe: "饥饿的怪物 - 大于 0 表示本场战斗已消耗挡刀（每场 battleStart 时清零，由遗物 possess.triggers 负责）",
        category: "special",
        hidden: true,
        notNegative: true
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