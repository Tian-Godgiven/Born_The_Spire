import { extractGlossaries, type Describe } from "./describe"
import { resolveGlossary } from "./glossaryResolve"

/**
 * 术语说明的收集
 *
 * 术语板由 DescribeText 弹出。板上的条目来自两处：调用方传入的 extraGlossaries
 * （词条、一次性名词），以及这段 describe 里的 $ 标记。临时效果要把带 $ 的片段
 * 并进传给 DescribeText 的 describe，不要让 DescribeText 去翻 Card / Organ 的内部字段。
 * 每个术语的实际说明由 resolveGlossary 去对应注册表取。
 */

/** 词条 key，或没有注册表的一次性名词 */
export type ExtraGlossary = string | {
    label: string
    describe: Describe
}

export interface GlossaryPanelItem {
    id: string
    label: string
    describe: Describe
}

/**
 * 组成术语板条目：extra 在前，这段 describe 的 $ 在后。按显示名去重。
 * 解析不到的 key 直接丢掉，不要留空行。
 */
export function collectGlossaryItems(
    extra: ExtraGlossary[] | undefined,
    describe: Describe | undefined
): GlossaryPanelItem[] {
    const items: GlossaryPanelItem[] = []
    const seen = new Set<string>()

    const push = (id: string, label: string, itemDescribe: Describe) => {
        if (seen.has(label)) return
        seen.add(label)
        items.push({ id, label, describe: itemDescribe })
    }

    for (const extraItem of extra ?? []) {
        if (typeof extraItem === "string") {
            const resolved = resolveGlossary(extraItem)
            if (resolved) push(extraItem, resolved.label, resolved.describe)
        } else if (extraItem.label) {
            push(`inline:${extraItem.label}`, extraItem.label, extraItem.describe)
        }
    }

    for (const key of extractGlossaries(describe)) {
        const resolved = resolveGlossary(key)
        if (resolved) push(key, resolved.label, resolved.describe)
    }

    return items
}
