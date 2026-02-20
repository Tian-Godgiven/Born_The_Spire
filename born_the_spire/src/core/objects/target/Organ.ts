import { Entity } from "../system/Entity";
import { Interaction, ItemMap } from "../item/Item";
import { getOrganModifier } from "../system/modifier/OrganModifier";
import { doEvent } from "../system/ActionEvent";
import { resolveTriggerEventTarget } from "../system/trigger/Trigger";
import { OrganQuality, OrganPart } from "@/core/types/OrganTypes";
import { calculateAbsorbValue } from "@/static/list/target/organQuality";
import { TargetMap } from "./Target";
import { Describe } from "@/ui/hooks/express/describe";
import { EffectUnit } from "../system/effect/EffectUnit";
import { Component } from "vue";

/**
 * 器官升级里程碑配置
 */
export interface OrganUpgradeMilestone {
    level: number                   // 达到此等级时触发
    effects?: EffectUnit[]          // 效果列表
    component?: string | Component  // 自定义组件
    componentData?: any             // 传递给组件的数据
}

/**
 * 器官升级配置
 */
export interface OrganUpgradeConfig {
    // 自定义升级成本（可选，不填则使用稀有度默认值）
    cost?: number | ((organ: any) => number)

    // 每级通用效果（可选）
    perLevel?: {
        effects: EffectUnit[]
    }

    // 特定等级的里程碑（可选）
    milestones?: OrganUpgradeMilestone[]
}

export type OrganMap = ItemMap&TargetMap&{
    label:string,
    key:string,
    describe?:Describe,
    cards?: string[]  // 器官提供的卡牌列表（卡牌的 key）
    entry?: string[]  // 器官的词条列表（词条的 key）

    // 新增属性
    quality: OrganQuality  // 稀有度（必填）
    level?: number         // 等级（默认为 1）
    part?: OrganPart       // 部位（可选，不填表示不占据部位）
    absorbValue?: number   // 吞噬获取量（可选，不填则使用稀有度的默认值）

    // 升级配置（可选）
    upgrade?: OrganUpgradeConfig

    // 质量系统（可选）
    // 如果 status 中定义了 "max-mass"，则器官具有质量属性
    // current 中需要包含 "mass" 来存储当前质量值
}

export class Organ extends Entity{
    public readonly targetType = 'organ' as const  // 类型标识
    public readonly label:string
    public readonly key:string
    public interaction:Interaction[]
    public cards:string[] = []  // 器官提供的卡牌列表
    public entry:string[] = []  // 器官的词条列表
    public owner?: Entity   // 器官持有者（通常是 Player 或 Enemy）
    public isDisabled:boolean = false // 器官是否损坏

    // 新增属性
    public readonly quality: OrganQuality  // 稀有度
    public level: number                   // 等级（可变，可以升级）
    public readonly part?: OrganPart       // 部位（可选）
    public readonly absorbValue: number    // 吞噬获取量
    public readonly upgradeConfig?: OrganUpgradeConfig  // 升级配置（可选）

    // 内部管理的触发器移除函数
    private workTriggerRemovers: Array<()=>void> = []
    private brokenTriggerRemovers: Array<()=>void> = []

    constructor(map:OrganMap){
        super(map)
        this.label = map.label;
        this.key = map.key;
        this.cards = map.cards || []  // 初始化卡牌列表
        this.entry = map.entry || []  // 初始化词条列表

        // 初始化新属性
        this.quality = map.quality
        this.level = map.level ?? 1  // 默认等级为 1
        this.part = map.part
        this.absorbValue = calculateAbsorbValue(map.quality, map.absorbValue)
        this.upgradeConfig = map.upgrade  // 升级配置

        const interaction:Interaction[] = []
        for(let key in map.interaction){
            const data = map.interaction[key]
            if (data && !Array.isArray(data)) {
                interaction.push({key, ...data})
            }
        }
        this.interaction = interaction
    }

    /**
     * 获取指定的交互
     */
    getInteraction(key:string){
        const i = this.interaction.find(i=>i.key == key)
        if(!i){
            return false
        }
        return i
    }

    /**
     * 激活 work 触发器（内部方法，由 OrganModifier 调用）
     */
    activateWorkTriggers(owner: Entity) {
        this.removeWorkTriggers()
        const workInteraction = this.getInteraction("work")
        if(workInteraction && workInteraction.triggers) {
            this.workTriggerRemovers = this.addTriggersFromInteraction(workInteraction, owner)
        }
    }

    /**
     * 移除 work 触发器（内部方法，由 OrganModifier 调用）
     */
    removeWorkTriggers() {
        for(const remover of this.workTriggerRemovers) {
            remover()
        }
        this.workTriggerRemovers = []
    }

    /**
     * 激活 broken 触发器（内部方法，由 OrganModifier 调用）
     */
    activateBrokenTriggers(owner: Entity) {
        this.removeBrokenTriggers()
        const brokenInteraction = this.getInteraction("broken")
        if(brokenInteraction && brokenInteraction.triggers) {
            this.brokenTriggerRemovers = this.addTriggersFromInteraction(brokenInteraction, owner)
        }
    }

    /**
     * 移除 broken 触发器（内部方法，由 OrganModifier 调用）
     */
    removeBrokenTriggers() {
        for(const remover of this.brokenTriggerRemovers) {
            remover()
        }
        this.brokenTriggerRemovers = []
    }

    /**
     * 从交互配置中添加触发器（私有辅助方法）
     */
    private addTriggersFromInteraction(interaction: Interaction, owner: Entity): Array<()=>void> {
        const removers: Array<()=>void> = []

        if(!interaction.triggers) return removers

        for(const triggerDef of interaction.triggers) {
            const when = triggerDef.when || "before"
            const how = triggerDef.how
            const key = triggerDef.key
            const level = triggerDef.level || 0

            for(const eventConfig of triggerDef.event) {
                const remover = owner.appendTrigger({
                    when,
                    how,
                    key,
                    level,
                    callback: (event, effect, _triggerLevel) => {
                        // 使用公共的目标解析函数
                        const target = resolveTriggerEventTarget(
                            eventConfig.targetType,
                            event,
                            effect,  // 触发效果
                            this,    // triggerSource: 器官本身
                            owner    // triggerOwner: 拥有者
                        )

                        doEvent({
                            key: eventConfig.key,
                            source: this,
                            medium: this,
                            target,
                            info: eventConfig.info || {},
                            effectUnits: eventConfig.effect || []
                        })
                    }
                })

                removers.push(remover.remove)
            }
        }

        return removers
    }
}

/**
 * 实体获得器官（包装函数）
 */
export function getOrgan(entity: Entity, source: Entity, organ: Organ) {
    const organModifier = getOrganModifier(entity)
    organModifier.acquireOrgan(organ, source)
}

/**
 * 实体失去器官（包装函数）
 */
export function removeOrgan(entity: Entity, organ: Organ, triggerLoseEffect: boolean = false) {
    const organModifier = getOrganModifier(entity)
    organModifier.loseOrgan(organ, triggerLoseEffect)
}

/**
 * 实体使用器官（包装函数）
 */
export function useOrgan(entity: Entity, organ: Organ, targets: Entity[]) {
    const organModifier = getOrganModifier(entity)
    return organModifier.useOrgan(organ, targets)
}

/**
 * 损坏器官（包装函数）
 */
export function breakOrgan(entity: Entity, organ: Organ) {
    const organModifier = getOrganModifier(entity)
    return organModifier.breakOrgan(organ)
}

/**
 * 修复器官（包装函数）
 */
export function repairOrgan(entity: Entity, organ: Organ) {
    const organModifier = getOrganModifier(entity)
    return organModifier.repairOrgan(organ)
}

/**
 * 同化器官（包装函数）
 */
export function assimilateOrgan(entity: Entity, organ: Organ) {
    const organModifier = getOrganModifier(entity)
    return organModifier.assimilateOrgan(organ)
}

/**
 * 吞噬器官（包装函数）
 */
export function devourOrgan(entity: Entity, organ: Organ) {
    const organModifier = getOrganModifier(entity)
    return organModifier.devourOrgan(organ)
}

/**
 * 升级器官（包装函数）
 */
export function upgradeOrgan(entity: Entity, organ: Organ) {
    const organModifier = getOrganModifier(entity)
    return organModifier.upgradeOrgan(organ)
}
