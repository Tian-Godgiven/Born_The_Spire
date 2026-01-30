import { Effect } from "./effect/Effect";
import { newLog, LogUnit, LogData } from "@/ui/hooks/global/log";
import { EffectUnit, createEffectByUnit } from "./effect/EffectUnit";
import { nanoid } from "nanoid";
import { isArray } from "lodash";
import { newError } from "@/ui/hooks/global/alert";
import { EventParticipant } from "@/core/types/event/EventParticipant";
import { isEntity } from "@/core/utils/typeGuards";
import {
    getEventCollector,
    getCurrentTransaction,
    beginTransaction,
    endTransaction
} from "../game/transaction";

// 使得一个阶段事件产生并发生:阶段事件是指单个事件过程中的多个效果会分阶段执行，在每个阶段开始时判断条件后记录效果的返回值。每个效果都对应一个阶段
type EventPhaseBase= {
    //效果对象映射，该阶段的【目标】会转而使用指定的相较于事件对象的映射,但事件来源和媒介均不可以映射修改
    entityMap?:{
        target?:"source"|"medium"
    },
    //该阶段在进行前的判断效果，返回true时进行该阶段,返回false时跳过该阶段，返回break时整个事件提前结束
    condition?:(event:ActionEvent)=>boolean|"break",
    onFalse?:()=>any,//该阶段未能正确进行时的回调函数
}
type EventPhase = EventPhaseBase&{
    effectUnits:EffectUnit[],//该阶段中将会启用的效果单元
}
type EventPhase_inObj = EventPhaseBase&{
    effects:Effect[],
}

export class ActionEvent<
    s extends EventParticipant = EventParticipant,
    m extends EventParticipant = EventParticipant,
    t extends EventParticipant = EventParticipant>
{
    public key:string;//事件的触发key
    public uuId:string;//唯一识别码
    public source:s;//执行该事件的来源
    public medium:m;//执行该事件的媒介
    public target:t|t[];//接受该事件的目标
    public triggerLevel:number|null=null//事件的触发等级
    public info:Record<string,any>;//该事件执行全程的信息
    public effects:Effect[] = [];
    public onExecute?:(actionEvent:ActionEvent)=>void|Promise<void>//事件执行时，执行的函数
    public onComplete?:(actionEvent:ActionEvent)=>void//事件执行完成后的回调
    //效果阶段
    public phase:EventPhase_inObj[];
    private _result:Record<string,any> = {}//阶段的返回值
    private _sideEffects:Array<()=>void> = []//副作用收集器，用于收集effect执行时产生的副作用（如修饰器的remover）
    private transactionCollector?:(e:ActionEvent,triggerLevel?:number)=>void//该事件所属的事务的收集器，通过该收集器可以将任意事件添加到该事务中，从而完成事件的内部收集
    public logUnit?:LogUnit//该事件的日志单元，用于收集子日志
    public parentEvent?:ActionEvent//父事件，用于建立日志的父子关系
    //是否为模拟事件（模拟事件不会实际执行效果，只触发触发器）
    public simulate:boolean = false
    //所属事务
    public transaction?: any  // Transaction 类型，避免循环依赖
    //是否已取消（用于复活等机制）
    private _cancelled:boolean = false
    constructor(
        key:string,//触发key
        source:s,medium:m,target:t|t[],
        info:Record<string,any>,
        effectUnits:EffectUnit[],
        phase:EventPhase[] = []
    ){
        this.key = key;
        this.uuId = nanoid()
        this.source = source;
        this.medium = medium;
        this.target = target;
        this.info = info;
        //构建该事件所包含的效果对象
        for(let effectUnit of effectUnits){
            const effect = createEffectByUnit(this,effectUnit)
            this.effects.push(effect)
        }
        //构建各个阶段包含的效果
        this.phase = phase.map((p):EventPhase_inObj=>{
            return {
                effects:p.effectUnits.map(eu=>{
                    return createEffectByUnit(this,eu)
                }),
                condition:p.condition,
                onFalse:p.onFalse,
                entityMap:p.entityMap
            }
        })
    }
    //触发事件
    trigger(when:"before"|"after",triggerLevel:number){
        this.triggerLevel = triggerLevel

        // 设置当前执行的事件（用于传递模拟标记）
        const previousEvent = getCurrentExecutingEvent()
        setCurrentExecutingEvent(this)

        try {
            // 只有 Entity 类型才有触发器
            if (isEntity(this.source)) {
                this.source.makeEvent(when,this.key,this,null,triggerLevel);
            }
            if (isEntity(this.medium)) {
                this.medium.viaEvent(when,this.key,this,null,triggerLevel)
            }
            handleEventEntity(this.target,(e)=>{
                if (isEntity(e)) {
                    e.takeEvent(when,this.key,this,null,triggerLevel)
                }
            })
        } finally {
            // 恢复之前的事件
            setCurrentExecutingEvent(previousEvent)
        }
    }
    //宣布这个事件将会发生，同时宣布其中的effect效果
    announce(triggerLevel:number){
        //触发事件before，触发级+1
        this.trigger("before",triggerLevel+1)
        //触发事件的after，触发级-1
        this.trigger("after",triggerLevel-1)
        for(let effect of this.effects){
            effect.announce(triggerLevel)
        }
    }
    //执行这个事件
    async excute(){
        // 检查事件是否已被取消
        if(this._cancelled){
            return
        }

        //触发事件的执行时函数
        if(this.onExecute){
            this.onExecute(this)
        }
        //触发事件的各个效果
        for(let effect of this.effects){
            await effect.apply()
        }
        //依次执行事件的各个阶段
        for(let p of this.phase){
            //验证条件
            const result = p.condition?p.condition(this):true
            if(result == true){
                //获取该阶段的目标对象映射
                let override_event:Partial<ActionEvent> = {}
                const entityMap = p.entityMap
                if(entityMap){
                    if(entityMap.target){
                        if(entityMap.target == "medium"){
                            override_event.target = this.medium as unknown as t
                        }
                        else if(entityMap.target == "source"){
                            override_event.target = this.source as unknown as t
                        }
                    }
                }
                //宣布并执行该阶段的效果
                for(let effect of p.effects){
                    effect.announce(this.triggerLevel??0)
                    await effect.apply(override_event)
                }
            }
            //失败时
            else{
                p.onFalse?.()
                //提前中断
                if(result == "break"){
                    break;
                }
            }
        }
        //执行完成后调用回调
        if(this.onComplete){
            this.onComplete(this)
        }
    }
    //设置事件的阶段返回结果
    setEventResult(key:string,res:any){
        this._result[key] = res;
    }
    //获取阶段的返回结果
    getEventResult(key:string){
        const res = this._result[key]
        if(res !== undefined){
            return res
        }
        else{
            newError([
                "错误：尝试获取的结果不存在，可能是1.前一个效果没有异步标识，2.前一个效果设定的key和当前效果获取的key不一致。",
            ])
        }
    }
    //触发了另一个事件，这会使得另一个事件得到一些关键属性，以使得这两个事件进入同一个事务中
    spawnEvent(event:ActionEvent){
        // 设置父子关系，用于日志嵌套
        event.parentEvent = this
        // 继承模拟标记
        event.simulate = this.simulate
        // 共享事务收集器
        if(this.transactionCollector){
            event.setTransactionCollector(this.transactionCollector)
        }
    }
    //设置事件的所属事务收集器
    setTransactionCollector(collector:(e:ActionEvent,triggerLevel?:number)=>void){
        this.transactionCollector = collector
    }
    //收集到同一事务中
    innerGatherToSameTransaction(e:ActionEvent,triggerLevel?:number){
        this.transactionCollector?.(e,triggerLevel)
    }
    //收集副作用
    collectSideEffect(remover:()=>void){
        this._sideEffects.push(remover)
    }
    //获取所有副作用
    getSideEffects(){
        return [...this._sideEffects]
    }
    //添加子日志（供效果/子事件使用）
    addChildLog(logData:LogData|any[]):LogUnit{
        if(this.logUnit){
            // 作为子日志添加到该事件的日志下
            return newLog(logData, this.logUnit)
        }
        else{
            // 如果该事件没有日志，就作为顶层日志
            return newLog(logData)
        }
    }
    //取消事件（用于复活等机制）
    cancel(){
        this._cancelled = true
    }
    //检查事件是否已取消
    isCancelled(){
        return this._cancelled
    }
}

// 当前正在执行的事件（用于传递模拟标记）
let currentExecutingEvent: ActionEvent | null = null

export function setCurrentExecutingEvent(event: ActionEvent | null) {
    currentExecutingEvent = event
}

export function getCurrentExecutingEvent(): ActionEvent | null {
    return currentExecutingEvent
}

// 使得一个事件产生并发生
type DoEventType = {
    key:string,
    source:EventParticipant,
    medium:EventParticipant,
    target:EventParticipant|EventParticipant[],
    info?:Record<string,any>,
    effectUnits?:EffectUnit[]
    phase?:EventPhase[]
    doWhat?:()=>void,//可选，在事件执行时进行的函数
    onComplete?:(event:ActionEvent)=>void//可选，在事件执行完成后的回调
}

type DoEventOptions = {
    position?: number | "top" | "bottom"  // 插入位置，默认 "top"
}

export function doEvent(
    {key,source,medium,target,info={},effectUnits=[],phase=[],doWhat=()=>{},onComplete}:DoEventType,
    options?: DoEventOptions
): ActionEvent {
    //创建行为事件
    const event = new ActionEvent(key,source,medium,target,info,effectUnits,phase)
    if(onComplete){
        event.onComplete = onComplete
    }
    if(doWhat){
        event.onExecute = doWhat
    }

    // 如果当前有正在执行的事件，且该事件是模拟模式，则继承模拟标记
    if (currentExecutingEvent && currentExecutingEvent.simulate) {
        event.simulate = true
        // 模拟模式下，不收集到事务，但返回事件对象供触发器使用
        return event
    }

    const eventCollector = getEventCollector()
    const currentTransaction = getCurrentTransaction()


    if (eventCollector) {
        // before/after 触发器中：加到收集器（立即执行）
        eventCollector.push(event)
    } else if (currentTransaction) {
        // 效果函数中：插入到指定位置
        const pos = options?.position ?? "top"
        currentTransaction.insertAt(event, pos)
    } else {
        // 没有当前事务，创建新事务并通过队列执行
        const tx = beginTransaction()
        tx.add(event)
        endTransaction()  // 这会自动加入队列并处理（返回 Promise 但我们不等待）
    }

    return event
}


//处理事件对象
export function handleEventEntity<T extends EventParticipant>(entity:T|T[],callback:(e:T)=>void){
    if(isArray(entity)){
        for(let e of entity){
            callback(e)
        }
    }
    else{
        callback(entity)
    }
}

// // 使得一个批量事件产生并另其中的子事件依次发生
// type ChildEvents = {
//     childKey?:string,
//     source?:Entity,
//     medium?:Entity,
//     target?:Entity,
//     effectUnit:EffectUnit[]
// }
// export function doMultiEvent(
//     key:string,
//     source:Entity,
//     medium:Entity,
//     target:Entity,
//     info:Record<string,any> = [],
//     effectUnit:EffectUnit[],
//     childEvents:ChildEvents[],
//     genericChildKey?:string,//通用子事件key
// ){
//     //创建一个亲事件，这个事件仍然会正确地发生
//     const parentEvent = new ActionEvent(key,source,medium,target,info,effectUnit)
//     //发生这个事件时，会让子事件也发生
//     parentEvent.happen()
// }