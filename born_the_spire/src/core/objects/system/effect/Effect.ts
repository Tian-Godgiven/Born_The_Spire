import { ActionEvent, handleEventEntity, setCurrentExecutingEvent, getCurrentExecutingEvent } from "../ActionEvent";
import { doEffectFunc, EffectFunc, EffectParams, resolveEffectParams } from "./EffectFunc";
import { EventParticipant } from "@/core/types/event/EventParticipant";
import { isEntity } from "@/core/utils/typeGuards";
import { nanoid } from "nanoid";
import { validateEffectParams } from "@/core/effects/validateEffectParams";
import { newError } from "@/ui/hooks/global/alert";
type EffectConstructor = {
    label?:string,
    key:string,
    effectFunc:EffectFunc,
    params:EffectParams,
    describe?:string[],
    triggerEvent:ActionEvent,
    resultStoreAs?:string
}

export class Effect implements EventParticipant{
    public __id:string = nanoid()
    public key:string;//关键字
    public effectFunc:EffectFunc;
    public params:EffectParams;
    public label:string = "";//效果的名称
    public participantType: 'effect' = 'effect'
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

        // 立即解析参数中的 $ 语法
        this.resolveParams()

        // 解析后再次验证参数（确保动态值解析后的类型正确）
        const validationResult = validateEffectParams(key, this.params)
        if (!validationResult.valid) {
            console.error(`[Effect] 效果参数解析后验证失败:`, validationResult.errors)
            newError([
                `效果 "${key}" 参数解析后验证失败:`,
                ...validationResult.errors
            ])
            // 使用验证后的参数（可能包含默认值）
            this.params = validationResult.params
        } else {
            // 使用验证后的规范化参数
            this.params = validationResult.params
        }
    }

    /**
     * 解析参数中的 $ 语法
     */
    private resolveParams() {
        for (const key in this.params) {
            const param = this.params[key]
            // 如果是字符串且以 $ 开头，尝试解析
            if (typeof param === "string" && param.startsWith("$")) {
                const resolved = resolveEffectParams(param, this.actionEvent, this)
                if (resolved !== undefined) {
                    this.params[key] = resolved
                }
            }
        }
    }

    //启用这个效果,效果的事件对象的部分属性允许被覆盖（常见的是target等）
    async apply(override_event?:Partial<ActionEvent>){
        //记录原本的事件对象
        let event = this.actionEvent
        //将 override_event 传递给 doEffectFunc，而不是修改 actionEvent
        const result = await doEffectFunc(this, override_event)
        //记录结果到原本的事件中
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

        // 设置当前执行的事件（用于传递模拟标记）
        const previousEvent = getCurrentExecutingEvent()
        setCurrentExecutingEvent(event)

        try {
            // 只有 Entity 类型才有触发器
            if (isEntity(event.source)) {
                event.source.makeEvent(when,this.key,event,this,triggerLevel);
            }
            if (isEntity(event.medium)) {
                event.medium.viaEvent(when,this.key,event,this,triggerLevel)
            }
            handleEventEntity(event.target,(e)=>{
                // 只对 Entity 类型调用触发器
                if (isEntity(e)) {
                    e.takeEvent(when,this.key,event,this,triggerLevel)
                }
            })
        } finally {
            // 恢复之前的事件
            setCurrentExecutingEvent(previousEvent)
        }
    }
}