import { Card } from "@/core/objects/item/Subclass/Card"
import { cardList } from "@/static/list/item/cardList"
import { getEntryModifier } from "@/core/objects/system/modifier/EntryModifier"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 应用指定等级的卡牌配置
 * @param card 卡牌实例
 * @param targetLevel 目标等级
 * @returns 是否成功应用
 */
export function applyCardLevel(card: Card, targetLevel: number): boolean {
    const cardData = cardList.find(c => c.key === card.key)
    const levelConfig = cardData?.upgradeConfig?.levelConfigs?.[targetLevel]

    if (!levelConfig) {
        console.warn(`[applyCardLevel] 卡牌 ${card.key} 没有等级 ${targetLevel} 的配置`)
        return false
    }

    const oldLevel = card.level

    // 1. 更新属性的原始值（保留修饰器）
    if (levelConfig.status) {
        for (const [key, value] of Object.entries(levelConfig.status)) {
            if (card.status[key]) {
                card.status[key].setOriginalBaseValue(value)
            }
        }
    }

    // 2. 更新词条
    const entryModifier = getEntryModifier(card)

    // 获取旧等级的词条配置
    const oldLevelConfig = cardData.upgradeConfig?.levelConfigs?.[oldLevel]

    // 移除旧等级的词条
    if (oldLevelConfig?.entries) {
        for (const entryKey of oldLevelConfig.entries) {
            entryModifier.removeEntry(entryKey)
        }
    }

    // 添加新等级的词条
    if (levelConfig.entries) {
        for (const entryKey of levelConfig.entries) {
            entryModifier.addEntry(entryKey)
        }
    }

    // 3. 更新等级
    card.level = targetLevel

    return true
}

/**
 * 升级卡牌
 * @param card 要升级的卡牌
 * @returns 是否成功升级
 */
export function upgradeCard(card: Card): boolean {
    const cardData = cardList.find(c => c.key === card.key)
    const upgradeConfig = cardData?.upgradeConfig

    if (!upgradeConfig) {
        console.warn(`[upgradeCard] 卡牌 ${card.key} 不可升级`)
        return false
    }

    // 检查是否达到最大等级
    const maxLevel = upgradeConfig.maxLevel ?? Infinity
    if (card.level >= maxLevel) {
        console.warn(`[upgradeCard] 卡牌 ${card.label} 已达到最大等级 ${maxLevel}`)
        return false
    }

    const newLevel = card.level + 1
    const success = applyCardLevel(card, newLevel)

    if (success) {
        newLog([card, `升级到 Lv.${newLevel}`])
    }

    return success
}

/**
 * 降级卡牌
 * @param card 要降级的卡牌
 * @returns 是否成功降级
 */
export function downgradeCard(card: Card): boolean {
    if (card.level <= 0) {
        console.warn(`[downgradeCard] 卡牌 ${card.label} 已是最低等级`)
        return false
    }

    const newLevel = card.level - 1
    const success = applyCardLevel(card, newLevel)

    if (success) {
        newLog([card, `降级到 Lv.${newLevel}`])
    }

    return success
}
