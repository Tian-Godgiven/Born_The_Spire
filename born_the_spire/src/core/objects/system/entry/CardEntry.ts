import type { Describe } from "@/ui/hooks/express/describe"
import type { Entity } from "@/core/objects/system/Entity"
import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Player } from "@/core/objects/target/Player"
import { createTriggerByTriggerMap } from "@/core/objects/system/trigger/Trigger"
import { isCard, isPlayer } from "@/core/utils/typeGuards"

/**
 * 卡牌专用词条定义
 */
export type CardEntryDefinition = {
    label: string  // 词条显示名称
    describe: Describe
    conflictsWith?: string[]
    onApply: (owner: Entity, ownersOwner?: Entity) => Array<() => void>
}

//判断通用条件函数，返回断言后的 card 和 player，失败返回 null
function checkOwnerTypes(
    owner: Entity,
    ownersOwner: Entity | undefined
): { card: Card; player: Player } | null {
    if (!isCard(owner)) {
        return null
    }
    if (!ownersOwner || !isPlayer(ownersOwner)) {
        return null
    }
    return { card: owner, player: ownersOwner }
}

/**
 * 卡牌词条定义注册表
 */
export const cardEntryDefinitions: Record<string, CardEntryDefinition> = {
    // 消耗词条
    card_exhaust: {
        label: "消耗",
        describe: ["使用后，将其移入消耗堆，而非弃牌堆"],
        conflictsWith: ["card_void"],  // 与其他"使用后去向"词条互斥
        onApply: (owner, ownersOwner) => {
            const result = checkOwnerTypes(owner, ownersOwner)
            if (!result) {
                return []
            }
            const { card } = result

            // 保存原方法
            const originalMethod = card.getAfterUseEffect.bind(card)

            // 覆盖方法：使用后移入消耗堆
            card.getAfterUseEffect = (fromPile) => ({
                key: "pay_exhaust",
                describe: ["将卡牌移入消耗堆"],
                params: {
                    sourcePile: fromPile,
                    card
                }
            })

            // 返回恢复函数
            return [() => {
                card.getAfterUseEffect = originalMethod
            }]
        }
    },

    // 虚无词条
    card_void: {
        label: "虚无",
        describe: ["若回合结束时仍在手牌中，会移入消耗堆而非弃牌堆"],
        conflictsWith: ["card_exhaust"],  // 与 exhaust 词条互斥
        onApply: (owner, ownersOwner) => {
            const result = checkOwnerTypes(owner, ownersOwner)
            if (!result) {
                return []
            }
            const { card, player } = result

            // 使用声明式触发器定义
            const triggerObj = createTriggerByTriggerMap(
                player,  // source (触发器来源)
                player,  // target (触发器持有者)
                {
                    when: "before",  // 在回合结束前，卡牌被丢弃之前
                    how: "take",     // 玩家被结束回合
                    key: "turnEnd",
                    event: [{
                        key: "voidExhaust",
                        targetType: card,  // 直接传入 card 实体
                        effect: [{
                            key: "voidExhaust",
                            describe: ["虚无：将卡牌移入消耗堆"],
                            params: {}
                        }]
                    }]
                }
            )

            // 添加触发器
            const { remove } = player.appendTrigger(triggerObj)

            // 返回恢复函数
            return [remove]
        }
    },

    // 固有词条
    card_inherent: {
        label: "固有",
        describe: ["战斗开始时，必定会抽到此卡片"],
        onApply: (owner, ownersOwner) => {
            const result = checkOwnerTypes(owner, ownersOwner)
            if (!result) {
                return []
            }
            const { player } = result

            // 在 Player 上添加触发器，监听战斗开始
            // 使用 onlyKey 确保即使有多张固有卡牌，也只有一个触发器
            const triggerObj = createTriggerByTriggerMap(
                player,  // source
                player,  // target
                {
                    when: "after",
                    how: "make",
                    key: "battleStart",
                    onlyKey: "inherent_moveToHand",  // 确保只有一个触发器
                    event: [{
                        key: "moveInherentToHand",
                        targetType: "triggerOwner",
                        effect: [{
                            key: "moveInherentToHand",
                            describe: ["固有：将固有卡牌移入手牌"],
                            params: {}
                        }]
                    }]
                }
            )

            // 添加触发器
            const { remove } = player.appendTrigger(triggerObj)

            // 返回恢复函数
            return [remove]
        }
    }
}