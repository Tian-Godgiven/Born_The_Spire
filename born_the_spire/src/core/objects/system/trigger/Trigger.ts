
import type { TriggerEventConfig, TriggerFunc, TriggerMap, TriggerObj, TriggerType, TriggerUnit } from "@/core/types/object/trigger";
import type { Entity } from "../Entity";
import { getDefaultTrigger, type DefaultTrigger } from "./defaultTrigger";
import { appendImportantTrigger, createImportantTrigger, type ImportantTrigger } from "./importantTrigger";
import type { ActionEvent } from "../ActionEvent";
import type { Effect } from "../effect/Effect";
import { doEvent } from "../ActionEvent";
import { nanoid } from "nanoid";
import { isEntity, isEffect } from "@/core/utils/typeGuards";
import { nowBattle } from "../../game/battle";
import { randomChoice } from "@/core/hooks/random";
import { newError } from "@/ui/hooks/global/alert";
import { getCurrentValue } from "../Current/current";
import { resolveTarget, resolveTargetOptional, type TargetContext, type TargetTypeString } from "@/core/types/TargetSpec";

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

/**
 * 执行反应事件（reaction events）
 * 这个函数负责解析 targetType、mediumTargetType（使用统一的 resolveTarget 系统），
 * 以及 $triggerValue，然后调用 doEvent 创建并触发事件。
 *
 * @param reactionEvents - 要执行的事件配置数组
 * @param triggerEvent - 触发该反应的原始事件
 * @param trigger - 运行时触发器对象，包含owner/source等上下文
 * @param triggerEffect - 触发该反应的效果对象（可能为 null）
 */
export function executeReactionEvents(params: {
    reactionEvents: TriggerEventConfig[],
    triggerEvent: ActionEvent,
    trigger: {
        owner: Entity,
        source: Entity,
        action?: string
    },
    triggerEffect: Effect | null
}): void {
    const { reactionEvents, triggerEvent, trigger, triggerEffect } = params
    const { owner, source } = trigger

    for (let eventConfig of reactionEvents) {
        const { key: eventKey, info = {}, targetType, mediumTargetType, effect: effectUnit } = eventConfig
        // 如果 targetType 是 triggerEffect 但 triggerEffect 为 null（事件级触发），跳过
        if (targetType === "triggerEffect" && !triggerEffect) continue
        // 获取目标（默认不允许 null）
        const eventTarget = resolveTriggerEventTarget(targetType, triggerEvent, triggerEffect, source, owner)

        // 确定事件的 medium（使用统一的 resolveTarget 系统）
        // mediumTargetType 默认为 "owner"（挂载 trigger 的实体）
        const mediumTarget = mediumTargetType || "owner"
        const eventMedium = resolveTriggerEventTarget(mediumTarget, triggerEvent, triggerEffect, source, owner)

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
        // source/medium/target 都不允许 null，如果配置错误会抛错
        const newEvent = doEvent({
            key: eventKey,
            source: owner,  // 使用 owner（触发器持有者）作为 source
            medium: isEntity(eventMedium) ? eventMedium : source,  // fallback to source
            target: eventTarget as any,  // 类型断言：resolveTarget 返回 Entity | Entity[]，需要转换为 EventParticipant
            info: info,
            effectUnits: resolvedEffects ?? []
        })

        // 保存触发器上下文到事件中，让效果函数可以访问
        // 如果 triggerEvent 已经有 triggerContext，则继承它（用于嵌套 reaction）
        newEvent.triggerContext = triggerEvent.triggerContext || {
            source: source,        // 触发器来源（器官）
            owner: owner,          // 触发器持有者（玩家）
            triggerEvent: triggerEvent  // 原始触发事件
        }
    }
}

//通过triggerMap生成触发器
export function createTriggerByTriggerMap(source:Entity,target:Entity, item:TriggerMap[number]){
    const {when ="before", how, key, level} = item

    const callback:TriggerFunc = async(triggerEvent,triggerEffect,_triggerLevel)=>{
        // 命运之轮专属调试
        const isWheelOfFate = source.key === "original_relic_wheel"
        if (isWheelOfFate) {
            console.log('[Wheel Debug] 触发器被触发:', { when, how, key, item: item.action || 'toggleMode' })
        }
        // 检查触发条件
        if (item.condition) {
            const cond = item.condition
            if (cond.sourceStatus) {
                const { key, value, op = "eq" } = cond.sourceStatus
                const statusVal = source.status[key]?.value
                if (isWheelOfFate) {
                    console.log('[Wheel Debug] sourceStatus检查:', { key, statusVal, expected: value })
                }
                if (statusVal === undefined) {
                    console.log('[Wheel Debug] statusVal 不存在，跳过')
                    return
                }

                // 字符串状态只支持相等性检查
                if (typeof value === 'string' || typeof statusVal === 'string') {
                    if (op !== "eq") return  // 非相等操作符对字符串无意义
                    if (statusVal !== value) return
                } else {
                    // 数值状态支持所有比较操作符
                    if (op === "eq" && statusVal !== value) return
                    if (op === "lte" && statusVal > value) return
                    if (op === "gte" && statusVal < value) return
                    if (op === "lt" && statusVal >= value) return
                    if (op === "gt" && statusVal <= value) return
                }
            }
            if (cond.ownerHealthPercent) {
                const { value, op = "lte" } = cond.ownerHealthPercent
                const maxHealth = target.status["maxHealth"]?.value
                const currentHealth = getCurrentValue(target as any, "health", 0)
                if (!maxHealth || maxHealth === 0) return
                const percent = currentHealth / maxHealth
                if (op === "eq" && percent !== value) return
                if (op === "lte" && percent > value) return
                if (op === "gte" && percent < value) return
                if (op === "lt" && percent >= value) return
                if (op === "gt" && percent <= value) return
            }
            if (cond.turnNumber) {
                const { mod, equals } = cond.turnNumber
                const battle = nowBattle.value
                if (!battle) return
                const turnNumber = battle.turnNumber

                if (equals !== undefined && turnNumber !== equals) return
                if (mod !== undefined) {
                    const [divisor, remainder] = mod
                    if (turnNumber % divisor !== remainder) return
                }
            }
        }

        // 命运之轮专属调试：条件检查完成
        if (isWheelOfFate) {
            console.log('[Wheel Debug] 条件检查通过，准备执行 action')
        }

        // 支持旧格式：直接定义事件
        if ((item as any).event) {
            const eventConfigs = Array.isArray((item as any).event) ? (item as any).event : [(item as any).event]
            executeReactionEvents({
                reactionEvents: eventConfigs,
                triggerEvent,
                trigger: { owner: target, source, action: undefined },
                triggerEffect
            })
            return
        }

        // 新格式：通过 action 查找 source 上的 reaction
        const action = (item as any).action
        if (!action) {
            newError([`触发器配置错误：需要 action 字段`, item])
            return
        }
        const reactionEvents = (source as any).reaction?.[action]
        if (!reactionEvents) {
            const sourceInfo = (source as any).label || (source as any).key || source.constructor.name
            const targetInfo = (target as any).label || (target as any).key || target.constructor.name
            newError([
                `触发器错误:`,
                `  action: "${action}"`,
                `  when/how/key: ${when} ${how} ${key}`,
                `  source: ${sourceInfo}`,
                `  target: ${targetInfo}`,
                `  错误: source 上找不到对应的 reaction`
            ])
            return
        }
        executeReactionEvents({
            reactionEvents,
            triggerEvent,
            trigger: { owner: target, source, action },
            triggerEffect
        })
    }
    const importantKey = (item as any).importantKey
    if(importantKey){
        const onlyKey = (item as any).onlyKey
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
 * 解析触发器事件的目标类型（向后兼容包装器）
 * 使用新的 resolveTarget 系统进行解析
 * @param targetType 目标类型配置
 * @param triggerEvent 触发该触发器的原始事件
 * @param triggerEffect 触发该触发器的效果对象（可能为 null）
 * @param triggerSource 触发器的施加来源
 * @param triggerOwner 持有触发器的对象
 * @param config 配置项（可选）
 *   - allowNull: 是否允许返回 null（默认 false，找不到对象时报错）
 * @returns 解析后的目标实体或 null（当 allowNull 为 true 且未找到时）
 */
export function resolveTriggerEventTarget(
    targetType: TriggerEventConfig["targetType"],
    triggerEvent: ActionEvent,
    triggerEffect: Effect | null,
    triggerSource: Entity,
    triggerOwner: Entity,
    config?: { allowNull?: boolean }
): Entity | Entity[] | Effect | null {
    // 处理 faction 类型，转换为统一的 targetType 字符串
    let normalizedTargetType: TargetTypeString | Entity = targetType
    if (typeof targetType === 'object' && targetType !== null && 'faction' in targetType) {
        const faction = (targetType as any).faction
        if (faction === "enemy") {
            normalizedTargetType = "allEnemies"
        } else if (faction === "player") {
            normalizedTargetType = "allAllies"
        } else if (faction === "all") {
            normalizedTargetType = "allEntities"
        } else {
            throw new Error(`[resolveTriggerEventTarget] 未知的 faction: ${faction}`)
        }
    }

    // 对于非字符串 targetType（如实体对象），直接返回
    if (typeof normalizedTargetType !== 'string') {
        return normalizedTargetType
    }

    // 构建 TargetContext，传递给 resolveTarget
    // 注意：TargetContext 中 triggerEffect 类型是 Effect，这里需要类型断言
    const context: TargetContext = {
        item: triggerSource,
        owner: triggerOwner,
        source: triggerSource,
        target: triggerEvent.target as Entity | Entity[] | undefined,
        event: triggerEvent,
        triggerEffect: triggerEffect ?? undefined,
        triggerSource,
        triggerOwner,
        // 从 event.triggerContext 中获取（如果存在）
        eventTriggerSource: triggerEvent.triggerContext?.source,
        eventTriggerOwner: triggerEvent.triggerContext?.owner,
        battle: nowBattle.value
    }

    // 根据 config 决定是否允许 null
    const { allowNull } = config || {}
    let result: Entity | Entity[] | Effect | null
    if (allowNull) {
        // 允许 null 的情况：使用 resolveTargetOptional
        result = resolveTargetOptional(normalizedTargetType, context)
    } else {
        // 默认：不允许 null，找不到对象时会抛错
        result = resolveTarget(normalizedTargetType, context)
    }
    return result
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
