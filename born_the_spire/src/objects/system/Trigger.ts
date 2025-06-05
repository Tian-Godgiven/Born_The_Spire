import { EffectKeyMap, doEffectByKey } from "@/static/list/system/effectList";
import { isArray } from "lodash";
import { ActionEvent } from "./ActionEvent";

export type TriggerFunc = (event:ActionEvent)=>void
export type EffectTrigger = {
    before:Record<string,((event:ActionEvent)=>void)[]>,
    after:Record<string,((event:ActionEvent)=>void)[]>,
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
    getTrigger({when,how,key,callBack}:{
        when:"before"|"after",
        how:"take"|"make"|"on",
        key:string,
        callBack:TriggerFunc
    }){
        if(!this[how][when][key]){
            this[how][when][key] = []
        }
        this[how][when][key].push(callBack)
    }
    //触发触发器
    onTrigger(when:"before"|"after",how:"take"|"make"|"on",event:ActionEvent){
        //调用trigger
        const trigger = this[how][when][event.key]
        if(!trigger)return
        //依次触发所有trigger
        trigger.forEach(tmp=>{
            tmp(event)
        })
        //如果不是on，则必定触发一次ontrigger
        if(how!="on"){
            const onTrigger = this.on[when][event.key]
            if(!onTrigger)return
            onTrigger.forEach(tmp=>{
                tmp(event)
            })
        }
    }
}

function readTriggerMap(trigger:Trigger,how:"take"|"make",map:TriggerItemMap|undefined){
    if(!map)return;
    for(let [key,value] of Object.entries(map)){
        const item = value
        if("when" in item){
            const callBack = ({source,medium,target}:ActionEvent)=>{
                //依次触发所有效果
                item.effects.forEach(effect=>{
                    doEffectByKey(source,medium,target,effect)
                })  
            }
            trigger.getTrigger({
                when:item.when,
                how,
                key,
                callBack
            })
        }
        else if(isArray(value)){
            const callBack = ({source,medium,target}:ActionEvent)=>{
                //依次触发所有效果
                value.forEach(effect=>{
                    doEffectByKey(source,medium,target,effect)
                })  
            }
            trigger.getTrigger({
                when:"before",how,key,callBack})
        }
    }
}