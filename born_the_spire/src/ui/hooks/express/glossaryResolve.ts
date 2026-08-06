import type { Describe } from "./describe"
import { glossaryMap } from "@/static/list/system/glossaryMap"
import { stateList } from "@/static/list/target/stateList"
import { entryDefinitions } from "@/core/objects/system/Entry"

/**
 * 术语解析：describe 里 {$:"xxx"} 的统一入口
 *
 * 一个概念只在它自己的注册表里定义一次，这里负责按优先级把 $ 引用解析到对应注册表：
 *     glossaryMap      —— 只承载没有其他注册表承载的概念（护甲、格挡这类规则性名词）
 *     stateList        —— 状态说明的唯一来源
 *     entryDefinitions —— 词条说明的唯一来源
 *
 * 这样 Mod 作者新增一个状态只需要写 stateList，卡牌描述里 {$:"状态名"} 立刻就有说明，
 * 不需要再往术语表里抄一份，也就不会出现两份描述互相脱节。
 *
 * key 既可以写注册表 key（acidWound），也可以写显示名（蚀伤），两种都能命中。
 */
export interface ResolvedGlossary {
    label: string
    describe: Describe
    style?: Record<string, string>
}

export function resolveGlossary(key: string): ResolvedGlossary | null {
    const glossary = glossaryMap[key]
    if (glossary) {
        return {
            label: glossary.label,
            describe: glossary.describe,
            style: glossary.style
        }
    }

    const state = stateList.find(item => item.key === key || item.label === key)
    if (state) {
        return {
            label: state.label,
            describe: state.describe
        }
    }

    for (const [entryKey, definition] of Object.entries(entryDefinitions)) {
        if (entryKey === key || definition.label === key) {
            return {
                label: definition.label ?? entryKey,
                describe: definition.describe
            }
        }
    }

    return null
}
