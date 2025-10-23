import { ActionEvent, handleEventEntity } from "../ActionEvent";
import { EffectUnit } from "./EffectUnit";
import { doEffectFunc, EffectFunc, EffectParams } from "./EffectFunc";
import { newLog } from "@/ui/hooks/global/log";
type EffectConstructor = {
    label?:string,
    key:string,
    effectFunc:EffectFunc,
    params:EffectParams,
    describe?:string[],
    triggerEvent:ActionEvent
}

export class Effect{
    public key:string;//关键字
    public effectFunc:EffectFunc;
    public params:EffectParams;
    public label?:string = "";//效果的名称
    public describe?:string[] = [];
    public actionEvent:ActionEvent;//引发这个效果的事件
    constructor({label="",key,effectFunc,params,describe=[],triggerEvent}:EffectConstructor){
        this.label = label;
        this.key = key;
        this.effectFunc = effectFunc;
        this.params = params;
        this.describe = describe;
        this.actionEvent = triggerEvent
    }
    //启用这个效果,效果的事件对象可以被覆盖
    apply(override_event?:ActionEvent){
        //执行效果函数
        let event:ActionEvent = this.actionEvent
        if(override_event){
            event = override_event
        }
        newLog({
            main:[event.source,"对",event.target,"造成了效果",this],
            detail:[
                "媒介:",event.medium," | ",
                "效果参数",this.params,
                "效果解释",this.describe,
            ]
        })
        return doEffectFunc(this)
    }
    //宣布这个效果，触发参与事件的对象的触发器
    announce(triggerLevel:number){
        //触发事件before，触发级+=1
        this.trigger("before",triggerLevel+=1)
        //触发事件的after，触发级-=1
        this.trigger("after",triggerLevel-=1)
    }
    //触发效果对象所在的事件的参与者的触发器
    trigger(when:"before"|"after",triggerLevel:number){
        const event = this.actionEvent
        event.source.makeEvent(when,this.key,event,this,triggerLevel);
        event.medium.viaEvent(when,this.key,event,this,triggerLevel)
        handleEventEntity(event.target,(e)=>{
            e.takeEvent(when,this.key,event,this,triggerLevel)
        })
    }
}

//通过效果unit创建效果对象
export function createEffectByUnit(triggerEvent:ActionEvent,unit:EffectUnit,effectFunc:EffectFunc,effectLabel?:string):Effect{
    //组合得到效果对象
    const {key,params,describe} = unit
    const effectObj = new Effect({
        label:effectLabel,
        key,
        effectFunc,
        params,
        describe,
        triggerEvent
    })
    return effectObj
}