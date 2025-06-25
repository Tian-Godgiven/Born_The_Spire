import { EffectKeyMap, doEffectByKey } from "@/static/list/system/effectList";
import { isArray } from "lodash";
import { ActionEvent } from "./ActionEvent";
import { Entity } from "./Entity";
import { nanoid } from "nanoid";

// 触发器是基于事件总线的一系列在个体上的回调函数
// 触发器的实现原理是：在某一个时刻(trigger_key)执行对应时刻的回调函数

//触发器的回调函数，其总是会提供触发该触发器的事件对象
export type TriggerFunc<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = (event:ActionEvent<s,m,t>)=>void

//触发器本身包含before和after两个阶段
type TriggerItem = {
    before:Record<string,TriggerUnit[]>,
    after:Record<string,TriggerUnit[]>,
}
//触发器单元，直接存储在触发器内部的对象
type TriggerUnit<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = {
    callback:TriggerFunc<s,m,t>,
    __key:string,//单元被分配的随机key，用于移除或修改指定的触发器
}

//触发器物体，调用触发器方法的通常媒介
export type TriggerObj<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = {
    when:"before"|"after",
    how:"take"|"make"|"on",
    key:string,
    callback:TriggerFunc<s,m,t>,
}
//触发器生成map，默认触发时机为"before"，优先级为0
type TriggerItemMap = Record<string,EffectKeyMap[]|{
    when:"before"|"after",
    level:number//触发优先级
    effects:EffectKeyMap[]//该触发器会造成什么效果
}> 
export type TriggerMap = {
    take?:TriggerItemMap;
    make?:TriggerItemMap;
    on?:TriggerItemMap
}

//触发器本身
export class Trigger{
    public take:TriggerItem = {before:{},after:{}}
    public make:TriggerItem = {before:{},after:{}}
    public on:TriggerItem = {before:{},after:{}}
    constructor(map:TriggerMap|null){
        readTriggerMap(this,"make",map?.make)
        readTriggerMap(this,"take",map?.take)
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
    onTrigger(when:"before"|"after",how:"take"|"make"|"on",event:ActionEvent){
        //调用trigger
        const trigger = this[how][when][event.key]
        if(!trigger)return
        //依次触发所有trigger
        trigger.forEach(tmp=>{
            tmp.callback(event)
        })
        //如果不是on，则必定触发一次ontrigger
        if(how!="on"){
            const onTrigger = this.on[when][event.key]
            if(!onTrigger)return
            onTrigger.forEach(tmp=>{
                tmp.callback(event)
            })
        }
    }
}

//读取triggerMap生成触发器
function readTriggerMap(trigger:Trigger,how:"take"|"make",map:TriggerItemMap|undefined){
    if(!map)return;
    for(let [key,value] of Object.entries(map)){
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
                how,
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
            trigger.getTrigger({when:"before",how,key,callback})
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
    searchFunc(how.on)
    searchFunc(how.make)
    function searchFunc(how:TriggerItem){
        for(let when of Object.values(how)){
            for(let units of Object.values(when)){
                units.forEach(unit=>func(units,unit))
            }
        }
    }
}
