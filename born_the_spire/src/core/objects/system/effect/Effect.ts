import { ActionEvent, handleEventEntity } from "../ActionEvent";
import { doEffectFunc, EffectFunc, EffectParams } from "./EffectFunc";
type EffectConstructor = {
    label?:string,
    key:string,
    effectFunc:EffectFunc,
    params:EffectParams,
    describe?:string[],
    triggerEvent:ActionEvent,
    resultStoreAs?:string
}

export class Effect{
    public key:string;//关键字
    public effectFunc:EffectFunc;
    public params:EffectParams;
    public label?:string = "";//效果的名称
    public describe?:string[] = [];
    public actionEvent:ActionEvent;//引发这个效果的事件
    public resultStoreAs?:string
    constructor({label="",key,effectFunc,params,describe=[],resultStoreAs,triggerEvent}:EffectConstructor){
        this.label = label;
        this.key = key;
        this.effectFunc = effectFunc;
        this.params = params;
        this.describe = describe;
        this.actionEvent = triggerEvent
        this.resultStoreAs = resultStoreAs
    }
    //启用这个效果,效果的事件对象可以被覆盖
    async apply(override_event?:ActionEvent){
        //执行效果函数
        let event:ActionEvent = this.actionEvent
        if(override_event){
            event = override_event
        }
        const result = await doEffectFunc(this)
        //记录值到事件中
        if(this.resultStoreAs != null){
            event.setEventResult(this.resultStoreAs,result)
        }
        return result
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