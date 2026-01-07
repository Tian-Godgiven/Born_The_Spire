import { OrganMap } from "@/static/list/target/organList";
import { Entity } from "../system/Entity";
import { Chara } from "./Target";
import { Interaction } from "../item/Item";
import { getOrganModifier } from "../system/modifier/OrganModifier";
import { doEvent } from "../system/ActionEvent";
import { resolveTriggerEventTarget } from "../system/trigger/Trigger";

export class Organ extends Entity{
    public readonly label:string
    public readonly key:string
    public interaction:Interaction[]
    public cards:string[] = []  // 器官提供的卡牌列表
    // 注意：isDisabled 继承自 Item 基类，表示器官是否损坏

    // 内部管理的触发器移除函数
    private workTriggerRemovers: Array<()=>void> = []
    private brokenTriggerRemovers: Array<()=>void> = []

    constructor(map:OrganMap){
        super(map)
        this.label = map.label;
        this.key = map.key;
        this.cards = map.cards || []  // 初始化卡牌列表
        const interaction:Interaction[] = []
        for(let key in map.interaction){
            interaction.push({key,...map.interaction[key]})
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
        if(workInteraction?.triggers) {
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
        if(brokenInteraction?.triggers) {
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
                    callback: (event, _effect, _triggerLevel) => {
                        // 使用公共的目标解析函数
                        const target = resolveTriggerEventTarget(
                            eventConfig.targetType,
                            event,
                            this,  // triggerSource: 器官本身
                            owner  // triggerOwner: 拥有者
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
 * 角色获得器官（包装函数）
 */
export function getOrgan(chara: Chara, source: Entity, organ: Organ) {
    const organModifier = getOrganModifier(chara)
    organModifier.acquireOrgan(organ, source)
}

/**
 * 角色失去器官（包装函数）
 */
export function removeOrgan(chara: Chara, organ: Organ, triggerLoseEffect: boolean = false) {
    const organModifier = getOrganModifier(chara)
    organModifier.loseOrgan(organ, triggerLoseEffect)
}

/**
 * 角色使用器官（包装函数）
 */
export function useOrgan(chara: Chara, organ: Organ, targets: Entity[]) {
    const organModifier = getOrganModifier(chara)
    return organModifier.useOrgan(organ, targets)
}

/**
 * 损坏器官（包装函数）
 */
export function breakOrgan(chara: Chara, organ: Organ) {
    const organModifier = getOrganModifier(chara)
    return organModifier.breakOrgan(organ)
}

/**
 * 修复器官（包装函数）
 */
export function repairOrgan(chara: Chara, organ: Organ) {
    const organModifier = getOrganModifier(chara)
    return organModifier.repairOrgan(organ)
}
