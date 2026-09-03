/**
 * 稀有度色板
 * 器官 / 遗物 / 卡牌 / 奖励共用的名字和颜色。白底上能看清。
 * 取值只有 common / uncommon / rare，不要在这里加 epic / legendary。
 */

export type RarityKey = "common" | "uncommon" | "rare"

export const rarityPalette: Record<RarityKey, { label: string, color: string }> = {
    common: { label: "普通", color: "#333333" },
    uncommon: { label: "罕见", color: "#2d5016" },
    rare: { label: "稀有", color: "#1a3a6b" },
}

function entry(rarity: string | undefined) {
    if (rarity && rarity in rarityPalette) {
        return rarityPalette[rarity as RarityKey]
    }
    return null
}

export function getRarityLabel(rarity: string | undefined): string {
    return entry(rarity)?.label ?? (rarity || rarityPalette.common.label)
}

export function getRarityColor(rarity: string | undefined): string {
    return entry(rarity)?.color ?? rarityPalette.common.color
}
