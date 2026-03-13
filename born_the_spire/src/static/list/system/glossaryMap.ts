import { Describe } from "@/ui/hooks/express/describe"

/**
 * 术语解释条目
 */
export type GlossaryEntry = {
    label: string        // 显示名称
    describe: Describe   // 描述
    style?: {           // 可选的样式配置
        color?: string
        fontWeight?: string
        textDecoration?: string
        // 可以添加更多CSS属性
    }
}

/**
 * 术语注册表
 * 包含游戏中所有需要解释的术语（状态、效果、词条等）
 */
export const glossaryMap: Record<string, GlossaryEntry> = {
    // ========== 词条 ==========
    "消耗": {
        label: "消耗",
        describe: ["使用后，将其移入消耗堆，而非弃牌堆"],
        style: {
            color: "#d97706",
            fontWeight: "bold"
        }
    },
    "虚无": {
        label: "虚无",
        describe: ["若回合结束时仍在手牌中，会移入消耗堆而非弃牌堆"],
        style: {
            color: "#7c3aed",
            fontWeight: "bold"
        }
    },
    "固有": {
        label: "固有",
        describe: ["战斗开始时，必定会抽到此卡片"],
        style: {
            color: "#059669",
            fontWeight: "bold"
        }
    },

    // ========== 状态 ==========
    "力量": {
        label: "力量",
        describe: ["提升你从卡牌造成的伤害"],
        style: {
            color: "#dc2626",
            fontWeight: "bold"
        }
    },
    "易伤": {
        label: "易伤",
        describe: ["受到的伤害增加50%"],
        style: {
            color: "#ea580c",
            fontWeight: "bold"
        }
    },
    "虚弱": {
        label: "虚弱",
        describe: ["造成的伤害减少25%"],
        style: {
            color: "#6b7280",
            fontWeight: "bold"
        }
    },
    "护甲": {
        label: "护甲",
        describe: ["抵挡伤害，回合结束时不会消失"],
        style: {
            color: "#3b82f6",
            fontWeight: "bold"
        }
    },
    "格挡": {
        label: "格挡",
        describe: ["抵挡伤害，回合结束时消失"],
        style: {
            color: "#06b6d4",
            fontWeight: "bold"
        }
    }
}

/**
 * 注册术语
 */
export function registerGlossary(key: string, entry: GlossaryEntry) {
    if (glossaryMap[key]) {
        console.warn(`[GlossaryMap] 术语 "${key}" 已存在，将被覆盖`)
    }
    glossaryMap[key] = entry
}

/**
 * 批量注册术语
 */
export function registerGlossaries(entries: Record<string, GlossaryEntry>) {
    Object.entries(entries).forEach(([key, entry]) => {
        registerGlossary(key, entry)
    })
}
