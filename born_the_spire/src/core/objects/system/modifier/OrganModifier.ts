import { Entity } from "../Entity"
import { Organ } from "../../target/Organ"
import { ItemModifier } from "./ItemModifier"
import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "../ActionEvent"
import { EffectUnit } from "../effect/EffectUnit"
import { computed } from "vue"
import { resolveTriggerEventTarget } from "../trigger/Trigger"
import { getCardModifier } from "./CardModifier"
import { Player } from "../../target/Player"
import { Chara } from "../../target/Target"

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
     * 完整流程（使用新的副作用收集系统）：
     * 1. 创建 ItemModifierUnit 用于收集副作用的清理函数
     * 2. 触发 possessOrgan 事件处理 possess 交互
     *    - 在事件中添加 triggers 和 modifiers
     *    - 事件自动收集副作用
     *    - onComplete 回调中将副作用注册到 ItemModifierUnit
     * 3. 处理器官提供的卡牌（添加到牌组）
     * 4. 触发 get 交互（一次性效果）
     */
    acquireOrgan(organ: Organ, source: Entity) {
        const parentLog = newLog([this.owner, "获得了器官", organ])

        // 1. 创建 ItemModifierUnit
        const unit = this.add(organ)

        // 2. 处理 possess 交互（持有期间的持续效果）
        const possessInteraction = organ.getInteraction("possess")
        if (possessInteraction) {
            // 使用事件系统处理 possess 效果
            doEvent({
                key: "possessOrgan",
                source,
                medium: organ,
                target: this.owner,
                doWhat: () => {
                    // 2.1. 处理 triggers - 挂载触发器
                    if (possessInteraction.triggers) {
                        for (const triggerDef of possessInteraction.triggers) {
                            const when = triggerDef.when || "before"
                            const how = triggerDef.how
                            const key = triggerDef.key
                            const level = triggerDef.level || 0

                            // 为每个 event 创建触发器
                            for (const eventConfig of triggerDef.event) {
                                const triggerRemover = this.owner.appendTrigger({
                                    when,
                                    how,
                                    key,
                                    level,
                                    callback: (event, effect, triggerLevel) => {
                                        // 使用公共的目标解析函数
                                        const target = resolveTriggerEventTarget(
                                            eventConfig.targetType,
                                            event,
                                            organ,        // triggerSource: 器官本身
                                            this.owner    // triggerOwner: 拥有者
                                        )

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
                                unit.registerTriggerRemover(triggerRemover.remove, `${triggerDef.importantKey || triggerDef.key}`)
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
            })
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

        // 4. 激活 work 触发器（器官正常工作时的触发器）
        // work 触发器的 remover 会在器官内部管理，损坏时自动移除，修复时自动添加
        organ.activateWorkTriggers(this.owner)

        // 5. 处理器官提供的卡牌（如果 owner 是 Player）
        if (this.owner instanceof Player && organ.cards.length > 0) {
            const cardModifier = getCardModifier(this.owner)
            const addedCards = cardModifier.addCardsFromSource(organ, organ.cards, parentLog)

            // 注册卡牌移除函数到 ItemModifierUnit
            if (addedCards.length > 0) {
                unit.registerCustomRemover(() => {
                    cardModifier.removeCardsFromSource(organ)
                }, `卡牌组 (${addedCards.length}张)`)
            }
        }
    }

    /**
     * 失去器官
     *
     * 完整流程：
     * 1. 移除器官的 work 触发器
     * 2. 从 ItemModifier 中找到对应的 ItemModifierUnit
     * 3. 调用 unit.cleanup() 清理所有副作用（触发器、修饰器等）
     * 4. 可选：触发 lose 交互（一次性效果）
     */
    loseOrgan(organ: Organ, triggerLoseEffect: boolean = false) {
        // 创建父日志
        const parentLog = newLog([this.owner, "失去了器官", organ])

        // 1. 移除 work 触发器（在清理副作用之前）
        organ.removeWorkTriggers()

        // 2. 找到并清理副作用（传入父日志以嵌套显示清理过程）
        const removed = this.removeByItem(organ, parentLog)
        if (!removed) {
            console.warn(`[OrganModifier] 未找到器官 ${organ.label}，可能已经被移除`)
        }

        // 3. 可选：触发 lose 交互（失去器官时的一次性效果）
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
        return this.organs.value
    }

    /**
     * 获取指定 key 的器官
     */
    getOrganByKey(organKey: string): Organ | undefined {
        const unit = this.units.find(u => (u.item as any).key === organKey)
        return unit?.item as Organ | undefined
    }

    /**
     * 检查是否拥有指定器官
     */
    hasOrgan(organKey: string): boolean {
        return this.units.some(u => (u.item as any).key === organKey)
    }

    /**
     * 使用器官（主动效果）
     * @param organ 要使用的器官
     * @param targets 目标实体数组
     * @returns "cant" 表示无法使用，否则成功
     */
    useOrgan(organ: Organ, targets: Entity[]) {
        // 检查是否拥有该器官
        if(!this.units.some(u => u.item === organ)) {
            newLog([this.owner, "未拥有器官", organ])
            return "cant"
        }

        // 检查是否损坏
        if(organ.isDisabled) {
            newLog([organ, "已损坏，无法使用"])
            return "cant"
        }

        // 获取 use 交互
        const useInteraction = organ.getInteraction("use")
        if(!useInteraction) {
            newLog([organ, "无法被使用"])
            return "cant"
        }

        // 触发 useOrgan 事件
        for(const target of targets) {
            doEvent({
                key: "useOrgan",
                source: this.owner,
                medium: organ,
                target: target,
                effectUnits: useInteraction.effects || []
            })
        }

        newLog([this.owner, "使用了器官", organ])
        return "success"
    }

    /**
     * 损坏器官
     * @param organ 要损坏的器官
     */
    breakOrgan(organ: Organ) {
        // 检查是否拥有该器官
        if(!this.units.some(u => u.item === organ)) {
            newLog([this.owner, "未拥有器官", organ])
            return false
        }

        // 如果已经损坏，直接返回
        if(organ.isDisabled) {
            return false
        }

        // 设置损坏状态
        organ.isDisabled = true

        // 移除 work 触发器
        organ.removeWorkTriggers()

        // 激活 broken 触发器
        organ.activateBrokenTriggers(this.owner)

        // 触发 break 交互（一次性效果）
        const breakInteraction = organ.getInteraction("break")
        if(breakInteraction && breakInteraction.effects) {
            doEvent({
                key: "breakOrgan",
                source: this.owner,
                medium: organ,
                target: this.owner,
                effectUnits: breakInteraction.effects
            })
        }

        newLog([organ, "已损坏"])
        return true
    }

    /**
     * 修复器官
     * @param organ 要修复的器官
     */
    repairOrgan(organ: Organ) {
        // 检查是否拥有该器官
        if(!this.units.some(u => u.item === organ)) {
            newLog([this.owner, "未拥有器官", organ])
            return false
        }

        // 如果未损坏，直接返回
        if(!organ.isDisabled) {
            return false
        }

        // 设置修复状态
        organ.isDisabled = false

        // 移除 broken 触发器
        organ.removeBrokenTriggers()

        // 重新激活 work 触发器
        organ.activateWorkTriggers(this.owner)

        newLog([organ, "已修复"])
        return true
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
