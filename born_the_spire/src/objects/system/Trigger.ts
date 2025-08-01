import { doEffectByKey } from "@/static/list/system/effectList";
import { isArray } from "lodash";
import { ActionEvent } from "./ActionEvent";
import { nanoid } from "nanoid";
import { TriggerMap, TriggerObj, TriggerType, TriggerUnit } from "@/typs/object/trigger";

// 触发器是基于事件总线的，一系列在个体上的回调函数
// 触发器的实现原理是：在某一个时刻(trigger_key)执行对应时刻的回调函数
export class Trigger{
    public take:TriggerType = {before:{},after:{}}
    public make:TriggerType = {before:{},after:{}}
    public via:TriggerType = {before:{},after:{}}
    constructor(map:TriggerMap|null){
        readTriggerMap(this,map)
    }
    //获得新的触发器，返回销毁该触发器的方法
    getTrigger(obj:TriggerObj){
        const {when,how,key} = obj
        if(!this[how][when][key]){
            this[how][when][key] = []
        }
        //获得触发器单元，分配随机key并返回
        const __key = nanoid()
        const unit:TriggerUnit = {
            callback: obj.callback,
            __key,
        }
        this[how][when][key].push(unit)
        return {
            key:__key,
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
    onTrigger(when:"before"|"after",how:"take"|"make"|"via",event:ActionEvent){
        //调用trigger
        const trigger = this[how][when][event.key]
        if(!trigger)return
        //依次触发所有trigger
        trigger.forEach(tmp=>{
            tmp.callback(event)
        })
    }
}

//读取triggerMap生成触发器
function readTriggerMap(trigger:Trigger,map:TriggerMap|null){
    if(!map)return;
    for(let mapKey in map){
        const type = mapKey as keyof TriggerMap;
        const mapItem = map[type]
        if(!mapItem)return;
        for(let [key,value] of Object.entries(mapItem)){
            const item = value
            if("when" in item){
                const callback = ({source,medium,target}:ActionEvent)=>{
                    //依次触发所有效果
                    item.effects.forEach(effect=>{
                        doEffectByKey(source,medium,target,effect)
                    })  
                }
                trigger.getTrigger({
                    when:item.when,
                    how:type,
                    key,
                    callback,
                })
            }
            else if(isArray(value)){
                const callback = ({source,medium,target}:ActionEvent)=>{
                    //依次触发所有效果
                    value.forEach(effect=>{
                        doEffectByKey(source,medium,target,effect)
                    })  
                }
                trigger.getTrigger({when:"before",how:type,key,callback})
            }
        }
    }
}

//返回一个触发器对象，通过getTrigger方法导入到实体内
export function createTrigger({when,how,key,callback}:TriggerObj):TriggerObj{
    return {
        when,how,key,callback
    }
}

//遍历所有触发器单元
function mapTriggerUnit(trigger:Trigger,func:(from:TriggerUnit[],unit:TriggerUnit)=>void){
    const how = trigger
    searchFunc(how.take)
    searchFunc(how.via)
    searchFunc(how.make)
    function searchFunc(how:TriggerType){
        for(let when of Object.values(how)){
            for(let units of Object.values(when)){
                units.forEach(unit=>func(units,unit))
            }
        }
    }
}
