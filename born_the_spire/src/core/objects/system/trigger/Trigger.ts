import { ActionEvent } from "../ActionEvent";
import { nanoid } from "nanoid";
import { TriggerEventConfig, TriggerFunc, TriggerMap, TriggerObj, TriggerType, TriggerUnit } from "@/core/types/object/trigger";
import { Effect } from "../effect/Effect";
import { Entity } from "../Entity";
import { DefaultTrigger, getDefaultTrigger } from "./defaultTrigger";
import { getImportantTrigger, ImportantTrigger, swapImportantTrigger } from "./importantTrigger";

// 触发器是基于事件总线的，一系列在个体上的响应器
// 触发器的实现原理是：在某一个时刻(trigger_key)执行对应时刻的回调函数
export class Trigger{
    public take:TriggerType = {before:{},after:{}}
    public make:TriggerType = {before:{},after:{}}
    public via:TriggerType = {before:{},after:{}}
    public _defaultTrigger:DefaultTrigger[] = []
    public _importantTriggr:ImportantTrigger[] = []
    constructor(){}
    //通过map来初始化trigger
    initTriggerByMap(source:Entity,target:Entity,map:TriggerMap){
        for(let triggerItem of map){
            const triggerObj = createTriggerByTriggerMap(source,target,triggerItem)
            const {remove,id} = this.getTrigger(triggerObj)
            //初始化过程中创建的都是默认触发器
            getDefaultTrigger(this,triggerObj,id,remove,triggerItem.info)
            //关键触发器
            if(triggerItem.importantKey){
                getImportantTrigger(this,triggerObj,triggerItem.importantKey,id,remove,triggerItem.info,triggerItem.onlyKey)
            }
        }
    }
    //获得新的触发器，返回销毁该触发器的方法
    getTrigger(obj:TriggerObj){
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

        //判断该触发器是否在关键触发器中唯一存在
        const triggerWay = `${when}_${how}_${key}`
        const important = this._importantTriggr.find(item=>item.triggerWay === triggerWay)
        if(important && important.onlyKey){
            swapImportantTrigger(important,id,()=>this.removeTrigger(obj,unit))
        }


        return {
            id,
            remove:()=>this.removeTrigger(obj,unit)
        }
    }
    //销毁触发器单元
    removeTrigger(obj:TriggerObj,unit:TriggerUnit){
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
}

//通过triggerMap生成触发器
function createTriggerByTriggerMap(source:Entity,target:Entity, item:TriggerMap[number]){
    const when = item?.when??'before';
    const how = item.how;
    const key = item.key
    const level = item.level
    
    const callback:TriggerFunc = async(triggerEvent,_effect,triggerLevel)=>{
        //回调函数将会创建并发生n个事件
        for(let eventConfig of item.event){
            const event = createEventFromTrigger({source,target,triggerEvent},eventConfig)
            //这个事件会继承触发事件的收集函数
            triggerEvent.spawnEvent(event)
            event.happen(()=>{},triggerLevel)
        }
    }
    const trigger = createTrigger({
        when,how,key,callback,level
    })
    return trigger
}

//创建触发器，通过实体的getTrigger方法挂载到实体上
export function createTrigger({when,how,key,callback,level}:TriggerObj):TriggerObj{
    return {
        when,how,key,callback,level
    }
}

//工具函数，用于创建触发器事件
function createEventFromTrigger(
    {source,target,triggerEvent}:{source:Entity,target:Entity,triggerEvent:ActionEvent},
    eventConfig:TriggerEventConfig
){
    const {key:eventKey,info={},targetType,effect:effectUnit} = eventConfig
    //获取目标
    const eventTarget = getTriggerEventTarget(targetType)
    
    const newEvent = new ActionEvent(
        eventKey,
        source,//触发器来源
        target,//触发器挂载者
        eventTarget,
        info,
        effectUnit
    )
    return newEvent

    function getTriggerEventTarget(targetType:TriggerEventConfig["targetType"]):Entity|Entity[]{
        switch(targetType){
            case "eventSource":
                return triggerEvent.source
            case "eventMedium":
                return triggerEvent.medium;
            case "eventTarget":
                return triggerEvent.target;
            case "triggerSource":
                return source;
            case "triggerHover":
                return target;
            default:
                if (targetType instanceof Entity) {
                    return targetType;
                }
                throw new Error("不被支持的目标类型:"+targetType)
        }
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
