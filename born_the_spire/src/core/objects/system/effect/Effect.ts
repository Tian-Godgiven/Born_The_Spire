import type { ActionEvent } from "../ActionEvent";
import type { EffectFunc, EffectParams } from "./EffectFunc";
import type { EventParticipant } from "@/core/types/event/EventParticipant";

import { doEffectFunc, resolveEffectParams } from "./EffectFunc";
import { isEntity } from "@/core/utils/typeGuards";
import { nanoid } from "nanoid";
import { validateEffectParamsAndReport } from "@/core/effects/validateEffectParams";
import { getLazyModule } from "@/core/utils/lazyLoader";
import { getCurrentExecutingEvent, setCurrentExecutingEvent } from "../ActionEvent";
import { isArray } from "lodash";

// 重新导出 EffectFunc 供外部使用
export type { EffectFunc, EffectParams }

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
    public targetSpec?:string//独立目标规格，设置后该效果作为子事件执行
    private _cancelled:boolean = false
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

        // 可选：若效果在 effectMap 里声明了 paramsSchema 则执行校验
        try {
            const effectMap = getLazyModule<any[]>("effectMap")
            const def = effectMap?.find?.((e: any) => e.key === key)
            if (def?.paramsSchema) {
                validateEffectParamsAndReport(key, this.params, def.paramsSchema)
            }
        } catch {
            // effectMap 未加载（启动早期/测试环境）时跳过
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

    //取消效果（在 before 触发器中调用，阻止效果执行）
    cancel(){
        this._cancelled = true
    }
    //检查效果是否已取消
    isCancelled(){
        return this._cancelled
    }
    //启用这个效果,效果的事件对象的部分属性允许被覆盖（常见的是target等）
    async apply(override_event?:Partial<ActionEvent>){
        // 被取消的效果不执行
        if(this._cancelled) return false

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
    //触发效果对象所在的事件的参与者的触发器
    async trigger(when:"before"|"after",triggerLevel:number){
        const event = this.actionEvent

        // 设置当前执行的事件（用于传递模拟标记）
        const previousEvent = getCurrentExecutingEvent()
        setCurrentExecutingEvent(event)

        try {
            // 只有 Entity 类型才有触发器
            if (isEntity(event.source)) {
                await event.source.makeEvent(when,this.key,event,this,triggerLevel);
            }
            if (isEntity(event.medium)) {
                // 添加调试检查
                if (typeof event.medium.viaEvent !== 'function') {
                    console.error('[Effect.trigger] medium 通过了 isEntity 检查但没有 viaEvent 方法:', {
                        medium: event.medium,
                        participantType: event.medium?.participantType,
                        hasViaEvent: typeof event.medium?.viaEvent,
                        eventKey: event.key
                    })
                } else {
                    await event.medium.viaEvent(when,this.key,event,this,triggerLevel)
                }
            }
            const targets = isArray(event.target) ? event.target : [event.target]
            for (const e of targets) {
                if (isEntity(e)) {
                    await e.takeEvent(when,this.key,event,this,triggerLevel)
                }
            }
        } finally {
            // 恢复之前的事件
            setCurrentExecutingEvent(previousEvent)
        }
    }
}