/**
 * 卡牌预览工具（简化封装）
 * 内部使用 effectPreview 系统来计算最终效果值
 */

import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Entity } from "@/core/objects/system/Entity"
import { previewEffectValue } from "@/core/utils/effectPreview"

/**
 * 计算卡牌的实际伤害值
 * 通过预览系统考虑所有触发器加成（如力量、易伤等）
 *
 * @param card 卡牌对象
 * @param source 使用卡牌的实体（通常是玩家）
 * @param target 目标实体（可选，用于计算目标相关加成如易伤）
 * @returns 实际伤害值
 */
export function calculateCardDamage(card: Card, source: Entity, target?: Entity): number {
    return previewEffectValue(card, source, "damage", target)
}

/**
 * 计算卡牌的实际治疗值
 * 通过预览系统考虑所有触发器加成
 *
 * @param card 卡牌对象
 * @param source 使用卡牌的实体（通常是玩家）
 * @param target 目标实体（可选）
 * @returns 实际治疗值
 */
export function calculateCardHeal(card: Card, source: Entity, target?: Entity): number {
    return previewEffectValue(card, source, "heal", target)
}

/**
 * 计算卡牌的实际格挡值
 * 通过预览系统考虑所有触发器加成（如敏捷、脆弱等）
 *
 * @param card 卡牌对象
 * @param source 使用卡牌的实体（通常是玩家）
 * @param target 目标实体（可选）
 * @returns 实际格挡值
 */
export function calculateCardBlock(card: Card, source: Entity, target?: Entity): number {
    return previewEffectValue(card, source, "block", target)
}

/**
 * 获取卡牌的动态效果值（通用方法）
 * 根据效果类型自动选择计算方法
 *
 * @param card 卡牌对象
 * @param source 使用卡牌的实体
 * @param effectType 效果类型（damage/heal/block等）
 * @param target 目标实体（可选）
 * @returns 实际效果值
 */
export function getCardEffectValue(
    card: Card,
    source: Entity,
    effectType: string,
    target?: Entity
): number {
    return previewEffectValue(card, source, effectType, target)
}
