import { Describe } from "@/ui/hooks/express/describe"
import { Entity } from "@/core/objects/system/Entity"
import { Card } from "@/core/objects/item/Subclass/Card"
import { Player } from "@/core/objects/target/Player"
import { createTriggerByTriggerMap } from "@/core/objects/system/trigger/Trigger"

/**
 * 词条定义（包含实现逻辑）
 *
 * Entry 系统用于为卡牌和器官添加特殊效果词条
 * 词条通过 EntryModifier 应用到实体上，会创建触发器等副作用
 */
export type EntryDefinition = {
    describe: Describe
    conflictsWith?: string[]  // 冲突的词条
    onApply: (owner: Entity, parentOwner?: Entity) => Array<() => void>  // 返回移除函数数组
}

/**
 * 词条定义注册表
 * 所有词条的实现逻辑都在这里定义
 */
export const entryDefinitions: Record<string, EntryDefinition> = {
    // 消耗词条
    exhaust: {
        describe: ["使用后，将其移入消耗堆，而非弃牌堆"],
        conflictsWith: ["void"],  // 与其他"使用后去向"词条互斥
        onApply: (owner, parentOwner) => {
            // owner 应该是 Card，parentOwner 应该是 Player
            if (!(owner instanceof Card)) {
                return []
            }
            if (!(parentOwner instanceof Player)) {
                return []
            }

            const card = owner

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
    void: {
        describe: ["若回合结束时仍在手牌中，会移入消耗堆而非弃牌堆"],
        conflictsWith: ["exhaust"],  // 与 exhaust 词条互斥
        onApply: (owner, parentOwner) => {
            // owner 应该是 Card，parentOwner 应该是 Player
            if (!(owner instanceof Card)) {
                return []
            }
            if (!(parentOwner instanceof Player)) {
                return []
            }

            const card = owner
            const player = parentOwner

            // 使用声明式触发器定义
            const triggerObj = createTriggerByTriggerMap(
                player,  // source (触发器来源)
                player,  // target (触发器持有者)
                {
                    when: "before",  // 在回合结束前，卡牌被丢弃之前
                    how: "make",
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
            const { remove } = player.trigger.appendTrigger(triggerObj)

            // 返回恢复函数
            return [remove]
        }
    },

    // 固有词条
    inherent: {
        describe: ["战斗开始时，必定会抽到此卡片"],
        onApply: (owner, parentOwner) => {
            // owner 应该是 Card，parentOwner 应该是 Player
            if (!(owner instanceof Card)) {
                return []
            }
            if (!(parentOwner instanceof Player)) {
                return []
            }

            const card = owner
            const player = parentOwner

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
            const { remove } = player.trigger.appendTrigger(triggerObj)

            // 返回恢复函数
            return [remove]
        }
    }
}
