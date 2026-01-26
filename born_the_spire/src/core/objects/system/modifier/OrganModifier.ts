import { Entity } from "../Entity"
import { Organ } from "../../target/Organ"
import { Item } from "../../item/Item"
import { ItemModifier } from "./ItemModifier"
import { newLog } from "@/ui/hooks/global/log"
import { doEvent, ActionEvent } from "../ActionEvent"
import { EffectUnit } from "../effect/EffectUnit"
import { computed, toRaw } from "vue"
import { resolveTriggerEventTarget } from "../trigger/Trigger"
import { getCardModifier } from "./CardModifier"
import { Player } from "../../target/Player"
import { getPartMaxCount } from "@/static/list/target/organPart"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"
import { getQualityConfig, calculateUpgradeCost } from "@/static/list/target/organQuality"
import { getCurrentValue } from "@/core/objects/system/Current/current"
import { showComponent } from "@/core/hooks/componentManager"

/**
 * 器官管理器
 *
 * 专门用于管理角色的器官及其产生的副作用（触发器、修饰器等）
 * 每个角色应该有一个 OrganModifier 实例
 */
export class OrganModifier extends ItemModifier {
    public organs = computed(() => this.units.map(u => u.item as unknown as Organ))

    constructor(owner: Entity) {
        super(owner)
    }

    /**
     * 获得器官
     *
     * 完整流程（使用新的副作用收集系统）：
     * 0. 检查部位互斥，如果有冲突则自动吞噬旧器官
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

        // 0. 检查部位互斥
        if (organ.part) {
            const maxCount = getPartMaxCount(organ.part)

            // 获取相同部位的器官
            const samePartOrgans = this.getOrgans().filter(o => o.part === organ.part)

            // 如果超过限制，需要吞噬旧器官
            if (samePartOrgans.length >= maxCount) {
                const oldOrgan = samePartOrgans[0]  // 吞噬第一个（最旧的）
                newLog([`部位 ${organ.part} 已满，吞噬旧器官`, oldOrgan])

                // 计算吞噬获得的物质
                const reserveModifier = getReserveModifier(this.owner)
                const materialGain = this.calculateDevourMaterial(oldOrgan)
                reserveModifier.gainReserve("material", materialGain, this.owner)
                newLog([`吞噬获得 ${materialGain} 物质`])

                // 移除旧器官
                this.loseOrgan(oldOrgan, false)
            }
        }

        // 设置器官持有者
        organ.owner = this.owner

        // 1. 创建 ItemModifierUnit
        const unit = this.add(organ as unknown as Item)

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
                                            effect,       // 触发效果
                                            organ,        // triggerSource: 器官本身
                                            this.owner    // triggerOwner: 拥有者
                                        )

                                        // 创建新事件（不自动 happen）
                                        const newEvent = new ActionEvent(
                                            eventConfig.key,
                                            organ,
                                            organ,
                                            target,
                                            {...eventConfig.info || {}},
                                            eventConfig.effect
                                        )

                                        // 将新事件关联到触发事件的事务中
                                        event.spawnEvent(newEvent)
                                        // 手动 happen，传递 triggerLevel
                                        newEvent.happen(() => {}, triggerLevel)
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
        const removed = this.removeByItem(organ as unknown as Item, parentLog)
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
        if(!this.units.some(u => u.item === (organ as unknown as Item))) {
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
        if(!this.units.some(u => u.item === (organ as unknown as Item))) {
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
        if(!this.units.some(u => u.item === (organ as unknown as Item))) {
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

    /**
     * 计算吞噬器官获得的物质
     * 根据文档：吞噬获取量 * 等级 + 稀有度加成
     * @param organ 要吞噬的器官
     * @returns 获得的物质数量
     */
    private calculateDevourMaterial(organ: Organ): number {
        const qualityConfig = getQualityConfig(organ.quality)

        // 吞噬获取量 * 等级 + 稀有度加成
        const baseMaterial = organ.absorbValue * organ.level
        const qualityBonus = qualityConfig.baseAbsorbValue * 0.2  // 稀有度加成 20%

        return Math.floor(baseMaterial + qualityBonus)
    }

    /**
     * 同化器官
     * 在战斗结束时，从敌人的器官中选择一个未损坏的器官进行同化
     * 消耗 20% 吞噬获取量的物质
     * @param organ 要同化的器官
     * @returns 是否成功同化
     */
    assimilateOrgan(organ: Organ): boolean {
        // 检查器官是否损坏
        if (organ.isDisabled) {
            newLog([organ, "已损坏，无法同化"])
            return false
        }

        // 计算同化成本（20% 吞噬获取量）
        const assimilateCost = Math.floor(organ.absorbValue * 0.2)

        // 检查物质是否足够
        const reserveModifier = getReserveModifier(this.owner)
        const currentMaterial = reserveModifier.getReserve("material")

        if (currentMaterial < assimilateCost) {
            newLog([`物质不足，无法同化`, `需要 ${assimilateCost}，当前 ${currentMaterial}`])
            return false
        }

        // 扣除物质
        reserveModifier.spendReserve("material", assimilateCost)
        newLog([this.owner, "消耗", assimilateCost, "物质同化器官", organ])

        // 获得器官（等级重置为 1）
        organ.level = 1
        this.acquireOrgan(organ, this.owner)

        return true
    }

    /**
     * 吞噬器官
     * 消耗指定的器官，获得物质
     * 获得量 = 吞噬获取量 * 等级 + 稀有度加成
     * @param organ 要吞噬的器官
     * @returns 是否成功吞噬
     */
    devourOrgan(organ: Organ): boolean {
        // 检查是否拥有该器官
        if (!this.units.some(u => u.item === (organ as unknown as Item))) {
            newLog([this.owner, "未拥有器官", organ])
            return false
        }

        // 计算吞噬获得的物质
        const materialGain = this.calculateDevourMaterial(organ)

        // 获得物质
        const reserveModifier = getReserveModifier(this.owner)
        reserveModifier.gainReserve("material", materialGain, this.owner)

        newLog([this.owner, "吞噬器官", organ, `获得 ${materialGain} 物质`])

        // 移除器官（不触发 lose 效果）
        this.loseOrgan(organ, false)

        return true
    }

    /**
     * 升级器官
     * @param organ 要升级的器官
     * @returns 是否成功升级
     */
    async upgradeOrgan(organ: Organ): Promise<boolean> {
        // 检查是否拥有该器官
        if (!this.units.some(u => u.item === (organ as unknown as Item))) {
            newLog([this.owner, "未拥有器官", organ])
            return false
        }

        // 检查器官是否损坏
        if (organ.isDisabled) {
            newLog([organ, "已损坏，无法升级"])
            return false
        }

        // 计算升级成本
        let upgradeCost: number

        if (organ.upgradeConfig?.cost !== undefined) {
            // 使用自定义成本
            if (typeof organ.upgradeConfig.cost === "function") {
                upgradeCost = organ.upgradeConfig.cost(organ)
            } else {
                upgradeCost = organ.upgradeConfig.cost
            }
        } else {
            // 使用稀有度默认成本（带随机波动）
            upgradeCost = calculateUpgradeCost(organ.quality, organ.absorbValue, true)
        }

        // 检查生命值是否足够
        const currentHealth = getCurrentValue(this.owner, "health")

        if (currentHealth <= upgradeCost) {
            newLog(["生命值不足，无法升级", `需要 ${upgradeCost}，当前 ${currentHealth}`])
            return false
        }

        newLog([this.owner, "升级器官", organ, `消耗 ${upgradeCost} 生命值`])

        // 扣除生命值（当前值 + 最大值）
        doEvent({
            key: "upgradeOrgan",
            source: this.owner,
            medium: organ,
            target: this.owner,
            effectUnits: [{
                key: "addStatusBaseCurrentValue",
                params: {
                    value: -upgradeCost,
                    statusKey: "max-health",
                    currentKey: "health"
                }
            }]
        })

        // 提升器官等级
        const oldLevel = organ.level
        organ.level++
        newLog([organ, `等级提升: ${oldLevel} → ${organ.level}`])

        // 执行每级通用效果
        if (organ.upgradeConfig?.perLevel?.effects) {
            doEvent({
                key: "organUpgradePerLevel",
                source: this.owner,
                medium: organ,
                target: this.owner,
                effectUnits: organ.upgradeConfig.perLevel.effects
            })
        }

        // 检查是否达到里程碑
        const milestone = organ.upgradeConfig?.milestones?.find(m => m.level === organ.level)
        if (milestone) {
            newLog([organ, `达到里程碑等级 ${organ.level}！`])

            // 执行里程碑效果
            if (milestone.effects) {
                doEvent({
                    key: "organUpgradeMilestone",
                    source: this.owner,
                    medium: organ,
                    target: this.owner,
                    effectUnits: milestone.effects
                })
            }

            // 如果有自定义组件，显示组件
            if (milestone.component) {
                try {
                    await showComponent({
                        component: milestone.component,
                        data: {
                            organ: organ,
                            owner: this.owner,
                            ...milestone.componentData
                        },
                        layout: "modal"
                    })
                } catch (error) {
                    console.error("[OrganModifier] 显示升级组件失败:", error)
                }
            }
        }

        return true
    }
}

// 使用 WeakMap 存储 OrganModifier 实例，避免与 Vue reactive 冲突
const organModifierMap = new WeakMap<Entity, OrganModifier>()

/**
 * 为实体初始化器官管理器
 */
export function initOrganModifier(entity: Entity): OrganModifier {
    const rawEntity = toRaw(entity)
    const modifier = new OrganModifier(rawEntity)
    organModifierMap.set(rawEntity, modifier)
    return modifier
}

/**
 * 获取实体的器官管理器
 */
export function getOrganModifier(entity: Entity): OrganModifier {
    const rawEntity = toRaw(entity)
    let modifier = organModifierMap.get(rawEntity)
    if (!modifier) {
        modifier = initOrganModifier(rawEntity)
    }
    return modifier
}
