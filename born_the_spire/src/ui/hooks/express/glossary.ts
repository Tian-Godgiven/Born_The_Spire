import type { Card } from "@/core/objects/item/Subclass/Card"
import { getDescribe, extractGlossaries } from "./describe"
import { resolveGlossary } from "./glossaryResolve"
import { entryDefinitions } from "@/core/objects/system/Entry"
import { getEntryModifier } from "@/core/objects/system/modifier/EntryModifier"
import { getTemporaryEffectDescribe } from "@/core/effects/card/addTemporaryEffect"

/**
 * 卡牌术语说明的收集
 *
 * 卡面上出现的术语来自三处：describe 里的 $ 标记、卡牌词条名、临时效果描述里的 $ 标记。
 * 卡牌本体和各种卡牌预览浮层都要展示同一份说明，所以收集逻辑放在这里共享。
 * 每个术语的实际说明由 resolveGlossary 去对应注册表取。
 */

/** 术语显示名 */
export function getGlossaryLabel(glossaryKey: string): string {
    return resolveGlossary(glossaryKey)?.label || glossaryKey
}

/** 术语说明文本 */
export function getGlossaryDescription(glossaryKey: string): string {
    const glossary = resolveGlossary(glossaryKey)
    if (!glossary) return ""
    return getDescribe(glossary.describe)
}

/**
 * 收集一张卡牌需要解释的全部术语 key
 */
export function getCardGlossaries(card: Card): string[] {
    const glossaries = new Set<string>()

    // 卡牌自身的词条
    try {
        const entries = getEntryModifier(card).getEntries()
        for (const entryKey of entries) {
            glossaries.add(entryDefinitions[entryKey]?.label ?? entryKey)
        }
    } catch {
        // 卡牌尚未初始化词条管理器
    }

    // 描述里的 $ 标记
    extractGlossaries(card.describe).forEach(key => glossaries.add(key))

    // 临时效果描述里的 $ 标记
    for (const describe of getTemporaryEffectDescribe(card)) {
        extractGlossaries([describe]).forEach(key => glossaries.add(key))
    }

    // 只保留真正能解析到说明的，避免弹出空条目
    return Array.from(glossaries).filter(key => resolveGlossary(key) !== null)
}
