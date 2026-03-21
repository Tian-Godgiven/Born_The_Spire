
import type { TriggerEventConfig, TriggerFunc, TriggerMap, TriggerObj, TriggerType, TriggerUnit } from "@/core/types/object/trigger";
import type { Entity } from "../Entity";
import { getDefaultTrigger, type DefaultTrigger } from "./defaultTrigger";
import { appendImportantTrigger, createImportantTrigger, type ImportantTrigger } from "./importantTrigger";
import type { ActionEvent } from "../ActionEvent";
import type { Effect } from "../effect/Effect";
import { doEvent } from "../ActionEvent";
import { nanoid } from "nanoid";
import { isEntity } from "@/core/utils/typeGuards";
import { nowBattle } from "../../game/battle";
import { randomChoice } from "@/core/hooks/random";
import { newError } from "@/ui/hooks/global/alert";

// 触发器是基于事件总线的，一系列在个体上的响应器
// 触发器的实现原理是：在某一个时刻(trigger_key)执行对应时刻的回调函数
export class Trigger{
    public take:TriggerType = {before:{},after:{}}
    public make:TriggerType = {before:{},after:{}}
    public via:TriggerType = {before:{},after:{}}
    public _defaultTrigger:DefaultTrigger[] = []
    public _importantTrigger:ImportantTrigger[] = []
    constructor(){}
    //通过map来初始化trigger
    initTriggerByMap(source:Entity,target:Entity,map:TriggerMap){
        for(let item of map){
            const triggerObj = createTriggerByTriggerMap(source,target,item)
            const {remove,id} = this.appendTrigger(triggerObj)
            //初始化过程中创建的都是默认触发器
            getDefaultTrigger(this,triggerObj,id,remove,item.info)
        }
    }
    //获得新的触发器，返回销毁该触发器的方法与相关设置
    appendTrigger(obj:TriggerObj,info?:string){
        const {when,how,key} = obj

        if(!this[how][when][key]){
            this[how][when][key] = []
        }
        //获得触发器单元，分配随机key并返回
        const id = nanoid()
        const unit:TriggerUnit = {
            callback: obj.callback,
            id,
            level:obj?.level??0
        }
        this[how][when][key].push(unit)
        const remove = ()=>this.removeTrigger(obj,unit)

        //是关键触发器，则还要添加触发器信息
        if(obj.importantKey){
            appendImportantTrigger(this,obj as TriggerObj&{importantKey:string},{id,remove,info})
        }

        return {
            id,
            remove
        }
    }
    //获取指定位置的触发器列表
    getTriggers(when: "before" | "after", how: "take" | "make" | "via", key: string): TriggerUnit[] | undefined {
        return this[how][when][key]
    }
    //移除并销毁触发器单元
    removeTrigger(obj:TriggerObj,unit:TriggerUnit){
        //同时移除关键触发器和默认触发器的信息
        if(obj.importantKey){
            const index1 = this._importantTrigger.findIndex(i=>i.id == unit.id)
            this._importantTrigger.slice(index1)
        }
        //移除触发器本身
        const {when,how,key} = obj
        const triggerArr = this[how][when][key]
        const index = triggerArr.indexOf(unit)
        if(index>=0){
            triggerArr.splice(index)
        }
        
    }
    //触发触发器
    onTrigger(when:"before"|"after",
        how:"take"|"make"|"via",
        triggerKey:string,
        {actionEvent,effect}:{actionEvent:ActionEvent,effect:Effect|null},
        triggerLevel?:number
    ){
        //获取相应的trigger
        const trigger = this[how][when][triggerKey]
        if(!trigger)return;
        //依次触发所有trigger unit
        for(let tmp of trigger){
            tmp.callback(actionEvent,effect,triggerLevel)
        }
    }
    //获取某个关键触发器
    getImportantTrigger(importantKey:string){
        return this._importantTrigger.filter(i=>i.importantKey == importantKey)
    }
}


//通过triggerMap生成触发器
export function createTriggerByTriggerMap(source:Entity,target:Entity, item:TriggerMap[number]){
    const {when ="before", how, key, level} = item

    const callback:TriggerFunc = async(triggerEvent,triggerEffect,_triggerLevel)=>{
        // 检查触发条件
        if (item.condition) {
            const cond = item.condition
            if (cond.sourceStatus) {
                const { key, value, op = "eq" } = cond.sourceStatus
                const statusVal = source.status[key]?.value
                if (statusVal === undefined) return
                if (op === "eq" && statusVal !== value) return
                if (op === "lte" && statusVal > value) return
                if (op === "gte" && statusVal < value) return
                if (op === "lt" && statusVal >= value) return
                if (op === "gt" && statusVal <= value) return
            }
        }
        //回调函数将会创建并发生n个事件
        for(let eventConfig of item.event){
            const {key:eventKey,info={},targetType,effect:effectUnit} = eventConfig
            // 如果 targetType 是 triggerEffect 但 effect 为 null（事件级触发），跳过
            if (targetType === "triggerEffect" && !triggerEffect) continue
            //获取目标
            const eventTarget = resolveTriggerEventTarget(targetType, triggerEvent, triggerEffect, source, target)

            // 解析 effect params 中的 $triggerValue
            const triggerValue = (triggerEffect as any)?.params?.value
            const resolvedEffects = (triggerValue !== undefined && effectUnit)
                ? effectUnit.map((eu: any) => ({
                    ...eu,
                    params: Object.fromEntries(
                        Object.entries(eu.params || {}).map(([k, v]) =>
                            [k, v === "$triggerValue" ? triggerValue : v]
                        )
                    )
                }))
                : effectUnit

            // 使用 doEvent 创建事件，会自动添加到 eventCollector
            doEvent({
                key: eventKey,
                source: source,  // 触发器来源
                medium: target,  // 触发器持有者
                target: eventTarget,  // 该触发器的目标
                info: info,
                effectUnits: resolvedEffects ?? []
            })
        }
    }
    if(item.importantKey){
        const {importantKey,onlyKey} = item
        return createImportantTrigger({
            when,how,key,callback,level,importantKey,onlyKey
        })
    }
    return createTrigger({
        when,how,key,callback,level
    })
}

//创建触发器，通过实体的getTrigger方法挂载到实体上
export function createTrigger({when,how,key,callback,level}:TriggerObj):TriggerObj{
    return {
        when,how,key,callback,level
    }
}

/**
 * 解析触发器事件的目标类型
 * @param targetType 目标类型配置
 * @param triggerEvent 触发该触发器的原始事件
 * @param triggerEffect 触发该触发器的效果对象（可能为 null）
 * @param triggerSource 触发器的施加来源
 * @param triggerOwner 持有触发器的对象
 * @returns 解析后的目标实体或效果
 */
export function resolveTriggerEventTarget(
    targetType: TriggerEventConfig["targetType"],
    triggerEvent: ActionEvent,
    triggerEffect: Effect | null,
    triggerSource: Entity,
    triggerOwner: Entity
): Entity | Entity[] | Effect {
    switch(targetType){
        case "eventSource"://指定的事件来源
            if (!isEntity(triggerEvent.source)) {
                throw new Error("事件来源不是 Entity 类型")
            }
            return triggerEvent.source
        case "eventMedium"://指定的事件媒介
            if (!isEntity(triggerEvent.medium)) {
                throw new Error("事件媒介不是 Entity 类型")
            }
            return triggerEvent.medium;
        case "eventTarget"://指定的事件对象
            if (Array.isArray(triggerEvent.target)) {
                // 如果是数组，检查每个元素
                const entities = triggerEvent.target.filter(isEntity)
                if (entities.length === 0) {
                    throw new Error("事件目标数组中没有 Entity 类型")
                }
                return entities
            } else {
                if (!isEntity(triggerEvent.target)) {
                    throw new Error("事件目标不是 Entity 类型")
                }
                return triggerEvent.target
            }
        case "triggerSource"://触发器的施加来源
            return triggerSource;
        case "owner"://持有者（别名）
        case "triggerOwner"://持有触发器的对象
            return triggerOwner;
        case "triggerEffect"://触发该触发器的效果对象
            if(!triggerEffect){
                throw new Error("触发效果为null，无法作为目标")
            }
            return triggerEffect;
        case "randomEnemy": {//当前战斗中随机一个存活的敌人
            const battle = nowBattle.value
            if (!battle) throw new Error("没有进行中的战斗，无法获取随机敌人")
            const aliveEnemies = battle.getAliveEnemies()
            if (aliveEnemies.length === 0) throw new Error("没有存活的敌人")
            return randomChoice(aliveEnemies, "randomEnemy")
        }
        default:
            // 检查是否是实体（通过 participantType 而不是 instanceof）
            if (typeof targetType === 'object' && targetType !== null && 'participantType' in targetType && targetType.participantType === 'entity') {
                return targetType as Entity;
            }
            throw new Error("不被支持的目标类型:"+targetType)
    }
}

//遍历所有触发器单元
// function mapTriggerUnit(trigger:Trigger,func:(from:TriggerUnit[],unit:TriggerUnit)=>void){
//     const how = trigger
//     searchFunc(how.take)
//     searchFunc(how.via)
//     searchFunc(how.make)
//     function searchFunc(how:TriggerType){
//         for(let when of Object.values(how)){
//             for(let units of Object.values(when)){
//                 units.forEach(unit=>func(units,unit))
//             }
//         }
//     }
// }

/**
 * 将 TriggerMap 应用到实体上
 * @param entity 目标实体
 * @param triggerMap 触发器配置
 * @returns 移除所有添加的触发器的函数
 */
export function applyTriggerMap(entity: Entity, triggerMap: TriggerMap): () => void {
    const removers: (() => void)[] = []

    for (const item of triggerMap) {
        const triggerObj = createTriggerByTriggerMap(entity, entity, item)
        const { remove } = entity.trigger.appendTrigger(triggerObj)
        removers.push(remove)
    }

    // 返回一个函数，调用时移除所有触发器
    return () => {
        removers.forEach(remove => remove())
    }
}
