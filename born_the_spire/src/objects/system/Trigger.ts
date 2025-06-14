import { EffectKeyMap, doEffectByKey } from "@/static/list/system/effectList";
import { isArray } from "lodash";
import { ActionEvent } from "./ActionEvent";
import { Entity } from "./Entity";
import { nanoid } from "nanoid";

export type TriggerFunc<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity> = (event:ActionEvent<s,m,t>)=>void
export type EffectTrigger = {
    before:Record<string,TriggerUnit[]>,
    after:Record<string,TriggerUnit[]>,
}
//触发器物体，获得触发器的媒介
export type TriggerObj<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = {
    when:"before"|"after",
    how:"take"|"make"|"on",
    key:string,
    sourceKey:string,
    callback:TriggerFunc<s,m,t>,
}
//触发器单元，直接存储在触发器内部的对象
type TriggerUnit<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = {
    callback:TriggerFunc<s,m,t>,
    sourceKey:string//单元的来源key，用于移除或修改同一来源的触发器
    __key:string,//单元被分配的随机key，用于移除或修改指定的触发器
}

//默认触发时机为"before"，优先级为0
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
    public take:EffectTrigger = {before:{},after:{}}
    public make:EffectTrigger = {before:{},after:{}}
    public on:EffectTrigger = {before:{},after:{}}
    constructor(map:TriggerMap|null){
        readTriggerMap(this,"make",map?.make)
        readTriggerMap(this,"take",map?.take)
    }
    //获得新的触发器
    getTrigger(obj:TriggerObj){
        const {when,how,key} = obj
        if(!this[how][when][key]){
            this[how][when][key] = []
        }
        //获得触发器单元，分配随机key并返回
        const __key = nanoid()
        const unit:TriggerUnit = {
            sourceKey: obj.sourceKey,
            callback: obj.callback,
            __key,
        }
        this[how][when][key].push(unit)
        return __key
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
    //这种情况下生成的触发器，其sourceKey固定为“self”
    const sourceKey = "self"
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
                sourceKey
            })
        }
        else if(isArray(value)){
            const callback = ({source,medium,target}:ActionEvent)=>{
                //依次触发所有效果
                value.forEach(effect=>{
                    doEffectByKey(source,medium,target,effect)
                })  
            }
            trigger.getTrigger({when:"before",how,key,callback,sourceKey})
        }
    }
}

//返回一个触发器对象，通过getTrigger方法导入到实体内
export function createTrigger({when,how,key,sourceKey,callback}:TriggerObj):TriggerObj{
    return {
        when,how,key,sourceKey,callback
    }
}

//失去某个来源对应的所有触发器
export function lostTriggerFromSourceKey(target:Entity,sourceKey:string){
    mapTriggerUnit(target.trigger,(from,unit)=>{
        //来源key相同
        if(unit.sourceKey == sourceKey){
            //删除这个unit
            const index = from.findIndex(tmp=>tmp.__key == unit.__key)
            from.splice(index,1)
        }
    })
}

//遍历所有触发器单元
function mapTriggerUnit(trigger:Trigger,func:(from:TriggerUnit[],unit:TriggerUnit)=>void){
    const how = trigger
    searchFunc(how.take)
    searchFunc(how.on)
    searchFunc(how.make)
    function searchFunc(how:EffectTrigger){
        for(let when of Object.values(how)){
            for(let units of Object.values(when)){
                units.forEach(unit=>func(units,unit))
            }
        }
    }
}
