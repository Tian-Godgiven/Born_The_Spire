import type { TriggerEventConfig, TriggerFunc, TriggerMap, TriggerObj, TriggerType, TriggerUnit } from "@/core/types/object/trigger";
import type { Entity } from "../Entity";
import { getDefaultTrigger, type DefaultTrigger } from "./defaultTrigger";
import { appendImportantTrigger, createImportantTrigger, type ImportantTrigger } from "./importantTrigger";
import type { ActionEvent } from "../ActionEvent";
import type { Effect } from "../effect/Effect";
import { doEvent } from "../ActionEvent";
import { nanoid } from "nanoid";
import type { Item } from "../../item/Item";
import { newError } from "@/ui/hooks/global/alert";
import { setEventCollector, clearEventCollector } from "../../game/transaction";
import { getCurrentTransaction } from "../../game/transaction";

export { resolveTriggerEventTarget } from "./resolveTriggerEventTarget";

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
    async onTrigger(when:"before"|"after",
        how:"take"|"make"|"via",
        triggerKey:string,
        {actionEvent,effect}:{actionEvent:ActionEvent,effect:Effect|null},
        triggerLevel?:number
    ){
        // 获取相应的trigger
        const trigger = this[how][when][triggerKey]
        if(!trigger)return;

        //按level降序排序（level越大越先执行）
        const sortedTriggers = [...trigger].sort((a, b) => (b.level ?? 0) - (a.level ?? 0))

        // 依次触发所有trigger unit
        // 关键设计：每个callback执行后立即await执行其收集的事件，再执行下一个callback
        // 这样可以保证：前一个trigger的effect真正执行完毕后，后一个trigger的condition检查才能看到最新状态
        // 使用 actionEvent._transaction 而非 getCurrentTransaction()，因为后者在事务执行时会返回 null
        const tx = (actionEvent as any)._transaction ?? getCurrentTransaction()
        for(let tmp of sortedTriggers){
            const collector: ActionEvent[] = []
            setEventCollector(collector)
            await tmp.callback(actionEvent,effect,triggerLevel)
            clearEventCollector()
            if (collector.length > 0) {
                if (!tx) {
                    console.error("[Trigger] 事务引用丢失，触发器收集的事件无法执行", {
                        triggerKey,
                        when,
                        how,
                        eventCount: collector.length,
                        eventKeys: collector.map(e => e.key)
                    })
                    continue
                }
                for (const e of collector) {
                    await tx.executeEvent(e)
                }
            }
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
        // 命运之轮专属调试
        const isWheelOfFate = (source as any).key === "original_relic_wheel"
        if (isWheelOfFate) {
            console.log('[Wheel Debug] 触发器被触发:', { when, how, key, item: ('action' in item ? item.action : 'toggleMode') })
        }

        // 动态导入 executeItemReaction，避免循环依赖
        const { executeItemReaction } = await import("../modifier/ItemModifier")

        // 支持旧格式：直接定义事件
        if ((item as any).event) {
            const eventConfigs = Array.isArray((item as any).event) ? (item as any).event : [(item as any).event]
            executeItemReaction({
                item: source as Item,
                reactionEvents: eventConfigs,
                triggerEvent,
                owner: target,
                triggerEffect,
                condition: item.condition
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
        executeItemReaction({
            item: source as Item,
            reactionEvents,
            triggerEvent,
            owner: target,
            triggerEffect,
            condition: item.condition
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
