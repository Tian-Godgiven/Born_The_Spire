import { Entity } from "../Entity"
import { Organ } from "../../target/Organ"
import { ItemModifier, ItemModifierUnit } from "./ItemModifier"
import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "../ActionEvent"
import { EffectUnit } from "../effect/EffectUnit"
import { computed } from "vue"

/**
 * 器官管理器
 *
 * 专门用于管理角色的器官及其产生的副作用（触发器、修饰器等）
 * 每个角色应该有一个 OrganModifier 实例
 */
export class OrganModifier extends ItemModifier {
    public organs = computed(() => this.units.map(u => u.item as Organ))

    constructor(owner: Entity) {
        super(owner)
    }

    /**
     * 获得器官
     *
     * 完整流程：
     * 1. 创建 ItemModifierUnit 用于收集副作用的清理函数
     * 2. 处理 possess 交互（持有期间的效果）
     *    - 挂载 triggers，收集 remover
     *    - 添加 modifiers，收集 remover
     * 3. 触发 get 交互（一次性效果）
     * 4. 将 ItemModifierUnit 存储
     */
    acquireOrgan(organ: Organ, source: Entity) {
        newLog([this.owner, "获得了器官", organ])

        // 1. 创建 ItemModifierUnit
        const unit = this.add(organ)

        // 2. 处理 possess 交互（持有期间的持续效果）
        const possessInteraction = organ.getInteraction("possess")
        if (possessInteraction) {
            // 2.1. 处理 triggers - 挂载触发器
            if (possessInteraction.triggers) {
                for (const triggerDef of possessInteraction.triggers) {
                    const when = triggerDef.when || "before"
                    const how = triggerDef.how
                    const key = triggerDef.key
                    const level = triggerDef.level || 0

                    // 为每个 event 创建触发器
                    for (const eventConfig of triggerDef.event) {
                        const remover = this.owner.appendTrigger({
                            when,
                            how,
                            key,
                            level,
                            callback: (event, effect, triggerLevel) => {
                                // 确定目标
                                let target: Entity
                                if (eventConfig.targetType === "eventSource") {
                                    target = event.source
                                } else if (eventConfig.targetType === "eventMedium") {
                                    target = event.medium
                                } else if (eventConfig.targetType === "eventTarget") {
                                    target = Array.isArray(event.target) ? event.target[0] : event.target
                                } else if (eventConfig.targetType === "triggerSource") {
                                    target = organ
                                } else if (eventConfig.targetType === "triggerOwner") {
                                    target = this.owner
                                } else {
                                    target = eventConfig.targetType as Entity
                                }

                                // 执行事件
                                doEvent({
                                    key: eventConfig.key,
                                    source: organ,
                                    medium: organ,
                                    target,
                                    info: eventConfig.info || {},
                                    effectUnits: eventConfig.effect
                                })
                            }
                        })

                        // 收集 remover
                        unit.registerTriggerRemover(remover, `${triggerDef.importantKey || triggerDef.key}`)
                    }
                }
            }

            // 2.2. 处理 modifiers - 添加属性修饰器
            if (possessInteraction.modifiers) {
                for (const modifierDef of possessInteraction.modifiers) {
                    const statusKey = modifierDef.statusKey
                    const label = modifierDef.label || statusKey

                    // 获取目标的 Status 对象
                    const status = this.owner.status[statusKey]
                    if (!status) {
                        console.warn(`[OrganModifier] 实体 ${this.owner.label} 没有属性 ${statusKey}，跳过修饰器`)
                        continue
                    }

                    // 添加修饰器
                    const remover = status.addByJSON(organ, {
                        targetLayer: modifierDef.targetLayer || "current",
                        modifierType: modifierDef.modifierType || "additive",
                        applyMode: modifierDef.applyMode || "absolute",
                        modifierValue: modifierDef.modifierValue || 0,
                        clearable: modifierDef.clearable,
                        modifierFunc: modifierDef.modifierFunc
                    })

                    // 收集 remover
                    unit.registerModifierRemover(remover, label)
                }
            }
        }

        // 3. 处理 get 交互（一次性效果）
        const getInteraction = organ.getInteraction("get")
        let effectUnits: EffectUnit[] = []
        if (getInteraction) {
            effectUnits = getInteraction.effects
        }

        // 触发 getOrgan 事件
        doEvent({
            key: "getOrgan",
            source,
            medium: organ,
            target: this.owner,
            effectUnits
        })
    }

    /**
     * 失去器官
     *
     * 完整流程：
     * 1. 从 ItemModifier 中找到对应的 ItemModifierUnit
     * 2. 调用 unit.cleanup() 清理所有副作用（触发器、修饰器等）
     * 3. 可选：触发 lose 交互（一次性效果）
     */
    loseOrgan(organ: Organ, triggerLoseEffect: boolean = false) {
        newLog([this.owner, "失去了器官", organ])

        // 1. 找到并清理副作用
        const removed = this.removeByItem(organ)
        if (!removed) {
            console.warn(`[OrganModifier] 未找到器官 ${organ.label}，可能已经被移除`)
        }

        // 2. 可选：触发 lose 交互（失去器官时的一次性效果）
        if (triggerLoseEffect) {
            const loseInteraction = organ.getInteraction("lose")
            if (loseInteraction) {
                doEvent({
                    key: "loseOrgan",
                    source: this.owner,
                    medium: organ,
                    target: this.owner,
                    effectUnits: loseInteraction.effects
                })
            }
        }
    }

    /**
     * 移除器官（通过器官对象）
     * @alias loseOrgan
     */
    removeOrgan(organ: Organ, triggerLoseEffect: boolean = false): boolean {
        this.loseOrgan(organ, triggerLoseEffect)
        return true
    }

    /**
     * 移除器官（通过器官 key）
     */
    removeOrganByKey(organKey: string, triggerLoseEffect: boolean = false): boolean {
        const organ = this.getOrganByKey(organKey)
        if (organ) {
            this.loseOrgan(organ, triggerLoseEffect)
            return true
        }
        return false
    }

    /**
     * 获取所有器官（响应式）
     */
    getOrgans(): Organ[] {
        return this.organs
    }

    /**
     * 获取指定 key 的器官
     */
    getOrganByKey(organKey: string): Organ | undefined {
        const unit = this.units.find(u => u.item.key === organKey)
        return unit?.item as Organ | undefined
    }

    /**
     * 检查是否拥有指定器官
     */
    hasOrgan(organKey: string): boolean {
        return this.units.some(u => u.item.key === organKey)
    }
}

/**
 * 为实体初始化器官管理器
 */
export function initOrganModifier(entity: Entity): OrganModifier {
    const modifier = new OrganModifier(entity)
    Object.defineProperty(entity, '_organModifier', {
        value: modifier,
        writable: false,
        enumerable: false,
        configurable: false
    })
    return modifier
}

/**
 * 获取实体的器官管理器
 */
export function getOrganModifier(entity: Entity): OrganModifier {
    const modifier = (entity as any)._organModifier
    if (!modifier) {
        return initOrganModifier(entity)
    }
    return modifier
}
