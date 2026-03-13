import { ActionEvent } from "@/core/objects/system/ActionEvent"
import { Effect } from "@/core/objects/system/effect/Effect"
import { addTemporaryCard, addTemporaryOrgan, markCardAsTemporary, markOrganAsTemporary } from "@/core/hooks/temporary"
import { Player } from "@/core/objects/target/Player"

/**
 * 添加临时卡牌效果
 */
export function addTemporaryCardEffect(event: ActionEvent, effect: Effect) {
    const cardKey = String(effect.params.cardKey)
    const removeOn = effect.params.removeOn as "turnEnd" | "battleEnd" | "floorEnd" | undefined
    const target = event.target

    if (!Array.isArray(target)) {
        console.error("[addTemporaryCardEffect] 目标必须是数组")
        return
    }

    for (const t of target) {
        if ((t as any).targetType === 'player') {
            const player = t as Player
            addTemporaryCard(cardKey, player, removeOn)
        }
    }
}

/**
 * 添加临时器官效果
 */
export function addTemporaryOrganEffect(event: ActionEvent, effect: Effect) {
    const organKey = String(effect.params.organKey)
    const removeOn = effect.params.removeOn as "turnEnd" | "battleEnd" | "floorEnd" | undefined
    const target = event.target

    if (!Array.isArray(target)) {
        console.error("[addTemporaryOrganEffect] 目标必须是数组")
        return
    }

    for (const t of target) {
        addTemporaryOrgan(organKey, t as any, removeOn)
    }
}

/**
 * 标记卡牌为临时效果
 */
export function markCardTemporaryEffect(event: ActionEvent, effect: Effect) {
    const card = effect.params.card as any
    const removeOn = effect.params.removeOn as "turnEnd" | "battleEnd" | "floorEnd" | undefined
    const target = event.target

    if (!card) {
        console.error("[markCardTemporaryEffect] 缺少卡牌参数")
        return
    }

    if (!Array.isArray(target)) {
        console.error("[markCardTemporaryEffect] 目标必须是数组")
        return
    }

    for (const t of target) {
        markCardAsTemporary(card, t as any, removeOn)
    }
}

/**
 * 标记器官为临时效果
 */
export function markOrganTemporaryEffect(event: ActionEvent, effect: Effect) {
    const organ = effect.params.organ as any
    const removeOn = effect.params.removeOn as "turnEnd" | "battleEnd" | "floorEnd" | undefined
    const target = event.target

    if (!organ) {
        console.error("[markOrganTemporaryEffect] 缺少器官参数")
        return
    }

    if (!Array.isArray(target)) {
        console.error("[markOrganTemporaryEffect] 目标必须是数组")
        return
    }

    for (const t of target) {
        markOrganAsTemporary(organ, t as any, removeOn)
    }
}