/**
 * 卡牌标签注册表
 *
 * 标签用于卡牌分类和筛选，不影响卡牌行为（行为由词条Entry控制）
 */

export type CardTagInfo = {
    label: string           // 显示名称
    describe: string        // 标签描述
    category: "type" | "feature" | "custom"  // 标签类别
}

/**
 * 卡牌标签注册表
 *
 * 标签类别说明：
 * - type: 类型标签（互斥，每张卡只能有一个）- attack/skill/power
 * - feature: 特性标签（可叠加）- basic/curse/status
 * - custom: 自定义标签（Mod制作者添加）
 */
export const cardTagMap: Record<string, CardTagInfo> = {
    // 类型标签（互斥）
    attack: {
        label: "攻击",
        describe: "造成伤害的卡牌",
        category: "type"
    },
    skill: {
        label: "技能",
        describe: "提供格挡、抽牌等效果的卡牌",
        category: "type"
    },
    power: {
        label: "能力",
        describe: "提供持续效果的卡牌",
        category: "type"
    },

    // 特性标签（可叠加）
    basic: {
        label: "基础",
        describe: "初始卡组中的卡牌",
        category: "feature"
    },
    curse: {
        label: "诅咒",
        describe: "负面效果的卡牌",
        category: "feature"
    },
    status: {
        label: "状态",
        describe: "临时添加的卡牌",
        category: "feature"
    }
}

/**
 * 注册自定义标签（供Mod使用）
 */
export function registerCardTag(key: string, info: CardTagInfo) {
    if (cardTagMap[key]) {
        console.warn(`[CardTag] 标签 ${key} 已存在，将被覆盖`)
    }
    cardTagMap[key] = info
}

/**
 * 验证标签是否存在
 */
export function validateCardTag(tagKey: string): boolean {
    return tagKey in cardTagMap
}

/**
 * 验证标签列表
 */
export function validateCardTags(tags: string[]): { valid: string[], invalid: string[] } {
    const valid: string[] = []
    const invalid: string[] = []

    for (const tag of tags) {
        if (validateCardTag(tag)) {
            valid.push(tag)
        } else {
            invalid.push(tag)
        }
    }

    return { valid, invalid }
}

/**
 * 获取标签信息
 */
export function getCardTagInfo(tagKey: string): CardTagInfo | undefined {
    return cardTagMap[tagKey]
}
