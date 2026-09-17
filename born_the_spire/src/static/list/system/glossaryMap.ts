import type { Describe } from "@/ui/hooks/express/describe"

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
    // 这里只放没有其他注册表承载的规则性名词。
    // 状态说明写在 stateList.ts，词条说明写在 entry/CardEntry.ts、entry/OrganEntry.ts，
    // describe 里的 {$:"xxx"} 会自动去那些注册表查，不要在这里抄第二份。
    "护甲": {
        label: "护甲",
        describe: ["抵挡攻击伤害，回合开始时消失"],
        style: {
            color: "#06b6d4",
            fontWeight: "bold"
        }
    },
    "毒素": {
        label:"毒素",
        describe:["一系列有毒生物施加的效果"],
        style:{
            color:"#18c23d"
        }
    },
    "临时": {
        label: "临时",
        describe: ["回合结束时失去同等层数的状态效果"]
    },
    "临时器官": {
        label: "临时器官",
        describe: ["战斗结束后消失"]
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
