import type { Entity } from "../Entity"
import type { Organ } from "../../target/Organ"
import type { Item } from "../../item/Item"
import type { EffectUnit } from "../effect/EffectUnit"
import type { Player } from "../../target/Player"

import { ItemModifier } from "./ItemModifier"
import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "../ActionEvent"
import { computed, toRaw } from "vue"
import { getEntryModifier } from "./EntryModifier"
import { getCurrentValue, setCurrentValue } from "@/core/objects/system/Current/current"
import { resolveTriggerEventTarget } from "../trigger/Trigger"
import { getPartMaxCount } from "@/static/list/target/organPart"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"
import { getQualityConfig, calculateUpgradeCost, calculateBlackStorePrice, calculateRepairCost } from "@/static/list/target/organQuality"
import { modifierManager } from "@/core/managers/ModifierManager"
import { showComponent } from "@/core/hooks/componentManager"

import { getCardModifier } from "./CardModifier"



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
     * 0. 检查部位互斥，如果有冲突则显示确认弹窗（可选）
     * 1. 创建 ItemModifierUnit 用于收集副作用的清理函数
     * 2. 触发 possessOrgan 事件处理 possess 交互
     *    - 在事件中添加 triggers 和 modifiers
     *    - 事件自动收集副作用
     *    - onComplete 回调中将副作用注册到 ItemModifierUnit
     * 3. 处理器官提供的卡牌（添加到牌组）
     * 4. 触发 get 交互（一次性效果）
     *
     * @param organ 要获得的器官
     * @param source 器官来源
     * @param skipConfirm 是否跳过部位冲突确认弹窗（默认 false）
     */
    async acquireOrgan(organ: Organ, source: Entity, skipConfirm: boolean = false) {
        // 0. 检查部位互斥
        if (organ.part) {
            const maxCount = getPartMaxCount(organ.part)

            // 获取相同部位的器官
            const samePartOrgans = this.getOrgans().filter(o => o.part === organ.part)

            // 如果超过限制，需要吞噬旧器官
            if (samePartOrgans.length >= maxCount) {
                const oldOrgan = samePartOrgans[0]  // 吞噬第一个（最旧的）

                // 计算吞噬获得的物质
                const materialGain = this.calculateDevourMaterial(oldOrgan)

                // 如果不跳过确认，显示确认弹窗
                if (!skipConfirm) {
                    const { showConfirm } = await import("@/ui/hooks/interaction/confirmModal")
                    const confirmed = await showConfirm(
                        `部位${organ.part}已满`,
                        `获取 ${organ.label} 将会吞噬旧器官 ${oldOrgan.label}，是否继续？`,
                        oldOrgan,
                        materialGain
                    )

                    // 如果用户取消，直接返回
                    if (!confirmed) {
                        newLog(["取消获取器官", organ.label])
                        return
                    }
                }

                newLog([`部位 ${organ.part} 已满，吞噬旧器官`, oldOrgan])

                // 发放物质奖励
                const reserveModifier = getReserveModifier(this.owner)
                reserveModifier.gainReserve("material", materialGain, this.owner)
                newLog([`吞噬获得 ${materialGain} 物质`])

                // 移除旧器官
                this.loseOrgan(oldOrgan, false)
            }
        }

        const parentLog = newLog([this.owner, "获得了器官", organ])

        // 设置器官持有者
        organ.owner = this.owner

        // 1. 创建 ItemModifierUnit
        const unit = this.add(organ as unknown as Item)

        // 2. 处理 possess 交互（持有期间的持续效果）
        const possessInteraction = organ.getInteraction("possess")
        if (possessInteraction) {
            // 使用父类的通用方法处理 possess 交互
            this['processPossessInteraction'](organ, possessInteraction, unit, parentLog)
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
        // 使用 targetType 检查而不是 instanceof，避免循环依赖
        if ((this.owner as any).targetType === 'player' && organ.cards.length > 0) {
            const cardModifier = getCardModifier(this.owner as Player)
            const addedCards = await cardModifier.addCardsFromSource(organ, organ.cards, parentLog)

            // 更新器官的describe，将卡牌索引替换为实例ID
            if (addedCards.length > 0 && organ.describe) {
                organ.describe = organ.describe.map(segment => {
                    // 如果是卡牌引用且是索引类型
                    if (typeof segment === 'object' && '@' in segment && typeof segment['@'] === 'number') {
                        const index = segment['@']
                        if (index >= 0 && index < addedCards.length) {
                            // 替换为卡牌实例ID
                            return { '@': addedCards[index].__id }
                        }
                    }
                    return segment
                })
            }

            // 注册卡牌移除函数到 ItemModifierUnit
            if (addedCards.length > 0) {
                unit.registerCustomRemover(() => {
                    cardModifier.removeCardsFromSource(organ)
                }, `卡牌组 (${addedCards.length}张)`)
            }
        }

        // 6. 处理器官的词条
        if (organ.entry.length > 0) {
            const entryModifier = getEntryModifier(organ)

            for (const entryKey of organ.entry) {
                const result = entryModifier.addEntry(entryKey)
            }

            // 注册词条移除函数到 ItemModifierUnit
            unit.registerCustomRemover(() => {
                for (const entryKey of organ.entry) {
                    entryModifier.removeEntry(entryKey)
                }
            }, `词条 (${organ.entry.length}个)`)
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

        // 检查是否有坚固词条
        const organAsAny = organ as any
        if (organAsAny._isSturdy) {
            newLog([organ, "因【坚固】词条而无法损坏"])
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
    async repairOrgan(organ: Organ) {
        // 检查是否拥有该器官
        if(!this.units.some(u => u.item === (organ as unknown as Item))) {
            newLog([this.owner, "未拥有器官", organ])
            return false
        }

        // 如果未损坏，直接返回
        if(!organ.isDisabled) {
            newLog([organ, "未损坏，无需修复"])
            return false
        }

        // 计算修复成本（60% 吞噬获取量）
        const repairCost = calculateRepairCost(organ.rarity, organ.absorbValue)

        // 检查物质是否足够
        const reserveModifier = getReserveModifier(this.owner)
        const currentMaterial = reserveModifier.getReserve("material")

        if (currentMaterial < repairCost) {
            newLog([`物质不足，无法修复`, `需要 ${repairCost}，当前 ${currentMaterial}`])
            return false
        }

        // 扣除物质
        reserveModifier.spendReserve("material", repairCost)
        newLog([this.owner, "消耗", repairCost, "物质修复器官", organ])

        // 恢复质量到最大值（如果有质量系统）
        if (organ.status["max-mass"]) {
            const maxMass = organ.status["max-mass"].value
            setCurrentValue(organ, "mass", maxMass)
            newLog([organ, `质量完全恢复到 ${maxMass}`])
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
        const qualityConfig = getQualityConfig(organ.rarity)

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
     * 售卖器官
     * @param organ 要售卖的器官
     * @returns 是否成功售卖
     */
    sellOrgan(organ: Organ): boolean {
        // 检查是否拥有该器官
        if (!this.units.some(u => u.item === (organ as unknown as Item))) {
            newLog([this.owner, "未拥有器官", organ])
            return false
        }

        // 计算售价：基础黑市价格 + 随机折扣（-20% ~ +10%）
        const basePrice = calculateBlackStorePrice(organ.rarity, organ.level)
        const discountFactor = 0.8 + Math.random() * 0.3  // 0.8 ~ 1.1
        const sellPrice = Math.floor(basePrice * discountFactor)

        // 获得金钱
        const reserveModifier = getReserveModifier(this.owner)
        reserveModifier.gainReserve("gold", sellPrice, this.owner)

        newLog([this.owner, "售卖器官", organ, `获得 ${sellPrice} 金钱`])

        // 移除器官（不触发 lose 效果）
        this.loseOrgan(organ, false)

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

        // 检查是否达到最大等级
        const maxLevel = organ.upgradeConfig?.maxLevel
        if (maxLevel !== undefined && organ.level >= maxLevel) {
            newLog([organ, `已达到最大等级 ${maxLevel}`])
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
            upgradeCost = calculateUpgradeCost(organ.rarity, organ.absorbValue, true)
        }

        // 获取储备管理器
        const reserveModifier = getReserveModifier(this.owner)
        const currentMaterial = reserveModifier.getReserve("material")

        // 优先消耗物质
        if (currentMaterial >= upgradeCost) {
            // 物质足够，消耗物质
            reserveModifier.spendReserve("material", upgradeCost)
            newLog([this.owner, "升级器官", organ, `消耗 ${upgradeCost} 物质`])
        } else {
            // 物质不足，消耗生命值
            const currentHealth = getCurrentValue(this.owner, "health")

            if (currentHealth <= upgradeCost) {
                newLog(["生命值不足，无法升级", `需要 ${upgradeCost}，当前 ${currentHealth}`])
                return false
            }

            newLog([this.owner, "升级器官", organ, `消耗 ${upgradeCost} 生命值（物质不足）`])

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
        }

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

/**
 * 为实体初始化器官管理器
 */
export function initOrganModifier(entity: Entity): OrganModifier {
    const rawEntity = toRaw(entity)
    const modifier = new OrganModifier(rawEntity)

    // 注册到全局 ModifierManager
    modifierManager.registerItemModifier(rawEntity, modifier)

    return modifier
}

/**
 * 获取实体的器官管理器
 */
export function getOrganModifier(entity: Entity): OrganModifier {
    const rawEntity = toRaw(entity)

    // 先尝试从 ModifierManager 获取
    let modifier: OrganModifier | undefined

    // 同步导入检查（如果已加载）
    try {
        const itemModifier = modifierManager.getItemModifier(rawEntity)
        if (itemModifier instanceof OrganModifier) {
            modifier = itemModifier
        }
    } catch {
        // ModifierManager 未加载，创建新实例
    }

    if (!modifier) {
        modifier = initOrganModifier(rawEntity)
    }

    return modifier
}
