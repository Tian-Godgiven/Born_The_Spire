import type { Describe } from "@/ui/hooks/express/describe"
import { Entity } from "@/core/objects/system/Entity"
import { createTriggerByTriggerMap } from "@/core/objects/system/trigger/Trigger"
import type { Chara } from "@/core/objects/target/Target"

/**
 * 器官专用词条定义
 */
export type OrganEntryDefinition = {
    label?: string  // 词条显示名称（可选，因为器官词条通常不需要显示名称）
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
            const chara = ownersOwner as Chara

            // 为 chara 添加 reaction
            if (!chara.reaction) {
                chara.reaction = {}
            }
            chara.reaction.fragileBreak = [{
                key: "fragileBreak",
                label: "脆弱：50%概率损坏器官",
                targetType: organ,
                effect: [{
                    key: "fragileBreak",
                    describe: ["脆弱：50%概率损坏器官"],
                    params: { organ }
                }]
            }]

            // 在 chara 上添加触发器，监听其受到伤害
            const triggerObj = createTriggerByTriggerMap(
                chara,  // source
                chara,  // target (触发器挂载到 chara)
                {
                    when: "after",
                    how: "take",
                    key: "damage",  // 监听 chara 受到伤害
                    action: "fragileBreak"
                }
            )

            // 添加触发器到 chara 上
            const { remove } = chara.appendTrigger(triggerObj)

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
            const chara = ownersOwner as Chara

            // 为 chara 添加 reaction
            if (!chara.reaction) {
                chara.reaction = {}
            }
            chara.reaction.regenerateMass = [{
                key: "regenerateMass",
                label: "再生：恢复器官质量",
                targetType: organ,
                effect: [{
                    key: "regenerateMass",
                    describe: ["再生：恢复器官质量"],
                    params: { organ, value: 5 }
                }]
            }]

            // 在 chara 上添加触发器，监听战斗结束
            const triggerObj = createTriggerByTriggerMap(
                chara,  // source
                chara,  // target (触发器挂载到 chara)
                {
                    when: "after",
                    how: "make",
                    key: "battleEnd",  // 监听 chara 的战斗结束事件
                    action: "regenerateMass"
                }
            )

            // 添加触发器到 chara 上
            const { remove } = chara.appendTrigger(triggerObj)

            // 返回恢复函数
            return [remove]
        }
    }
}
