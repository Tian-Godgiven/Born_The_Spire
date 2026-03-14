import type { Describe } from "@/ui/hooks/express/describe"
import { Entity } from "@/core/objects/system/Entity"
import { createTriggerByTriggerMap } from "@/core/objects/system/trigger/Trigger"

/**
 * 器官专用词条定义
 */
export type OrganEntryDefinition = {
    describe: Describe
    conflictsWith?: string[]
    onApply: (owner: Entity, ownersOwner?: Entity) => Array<() => void>
}

/**
 * 器官词条定义注册表
 */
export const organEntryDefinitions: Record<string, OrganEntryDefinition> = {
    // 脆弱词条（器官）
    // 触发器挂载到：ownersOwner（监听持有者受到伤害事件）
    organ_fragile: {
        describe: ["持有者受到伤害时，此器官有50%概率损坏"],
        onApply: (owner, ownersOwner) => {
            if (!ownersOwner) {
                return []
            }

            const organ = owner

            // 在 ownersOwner 上添加触发器，监听其受到伤害
            const triggerObj = createTriggerByTriggerMap(
                ownersOwner,  // source
                ownersOwner,  // target (触发器挂载到 ownersOwner)
                {
                    when: "after",
                    how: "take",
                    key: "damage",  // 监听 ownersOwner 受到伤害
                    event: [{
                        key: "fragileBreak",
                        targetType: organ,  // 目标是器官
                        effect: [{
                            key: "fragileBreak",
                            describe: ["脆弱：50%概率损坏器官"],
                            params: { organ }
                        }]
                    }]
                }
            )

            // 添加触发器到 ownersOwner 上
            const { remove } = ownersOwner.appendTrigger(triggerObj)

            // 返回恢复函数
            return [remove]
        }
    },

    // 坚固词条（器官）
    // 不使用触发器，直接标记器官属性
    organ_sturdy: {
        describe: ["此器官不会损坏"],
        onApply: (owner, _ownersOwner) => {
            // 标记器官为坚固（通过添加一个特殊属性）
            const organ = owner as any
            organ._isSturdy = true

            // 返回恢复函数
            return [() => {
                delete organ._isSturdy
            }]
        }
    },

    // 再生词条（器官）
    // 触发器挂载到：ownersOwner（监听其战斗结束事件）
    organ_regenerative: {
        describe: ["战斗结束时，恢复5点质量"],
        onApply: (owner, ownersOwner) => {
            if (!ownersOwner) {
                return []
            }

            const organ = owner

            // 在 ownersOwner 上添加触发器，监听战斗结束
            const triggerObj = createTriggerByTriggerMap(
                ownersOwner,  // source
                ownersOwner,  // target (触发器挂载到 ownersOwner)
                {
                    when: "after",
                    how: "make",
                    key: "battleEnd",  // 监听 ownersOwner 的战斗结束事件
                    event: [{
                        key: "regenerateMass",
                        targetType: organ,  // 目标是器官
                        effect: [{
                            key: "regenerateMass",
                            describe: ["再生：恢复器官质量"],
                            params: { organ, value: 5 }
                        }]
                    }]
                }
            )

            // 添加触发器到 ownersOwner 上
            const { remove } = ownersOwner.appendTrigger(triggerObj)

            // 返回恢复函数
            return [remove]
        }
    }
}