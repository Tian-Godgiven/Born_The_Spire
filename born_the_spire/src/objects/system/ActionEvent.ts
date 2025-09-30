import { Effect } from "./effect/Effect";
import { Entity } from "./Entity";
import { gatherToTransaction } from "../game/transaction";
import { newLog } from "@/hooks/global/log";
import { EffectUnit, getEffectByUnit } from "./effect/EffectUnit";
import { nanoid } from "nanoid";
import { isArray } from "lodash";

//事件阶段，一部分事件会按阶段进行
interface EventPhase{
    key:string,//阶段的关键字，通过其查询阶段返回的结果
    effects:Effect[],//该阶段中将会启用的效果
    //该过程在进行前的判断效果，返回true时进行该进程
    condition?:(event:ActionEvent)=>boolean,
    onFalse?:()=>any,//该过程未能正确进行时的回调函数
}

export class ActionEvent<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity>
{
    public key:string;//事件的触发key
    public uuId:string;//唯一识别码
    public source:s;//执行该事件的目标
    public medium:m;//执行该事件的媒介
    public target:t|t[];//接受该事件的目标
    public triggerLevel:number|null=null//事件的触发等级
    public info:Record<string,any>;//该事件执行全程的信息
    public effects:Effect[] = [];
    public onExecute?:(actionEvent:ActionEvent)=>void|Promise<void>//事件执行时，执行的函数
    public eventPhase:EventPhase[] = []
    private _phaseResult:Record<string,any> = {}//阶段的返回值 
    constructor(
        key:string,//触发key
        source:s,medium:m,target:t|t[],
        info:Record<string,any>,
        effectUnits:EffectUnit[],
        eventPhase:{
            key:string,
            effectUnits:EffectUnit[],
            condition?:(event:ActionEvent)=>boolean,
            onFalse?:()=>any,
        }[]
    ){
        this.key = key;
        this.uuId = nanoid()
        this.source = source;
        this.medium = medium;
        this.target = target;
        this.info = info;
        //构建该事件所包含的效果对象
        for(let effectUnit of effectUnits){
            const effect = getEffectByUnit(this,effectUnit)
            this.effects.push(effect)
        }
        //构建该事件的各个阶段
        for(let {key,effectUnits:effectUnits2,onFalse,condition} of eventPhase){
            const effects:Effect[] = []
            for(let effectUnit of effectUnits2){
                const effect = getEffectByUnit(this,effectUnit)
                effects.push(effect)
            }
            const phaseItem:EventPhase = {
                key,
                onFalse,
                condition,
                effects
            }
            this.eventPhase.push(phaseItem)
        }
    }
    //触发事件
    trigger(when:"before"|"after",triggerLevel:number){
        this.triggerLevel = triggerLevel
        this.source.makeEvent(when,this.key,this,null,triggerLevel);
        this.medium.viaEvent(when,this.key,this,null,triggerLevel)
        if(isArray(this.target)){
            for(let t of this.target){
                t.takeEvent(when,this.key,this,null,triggerLevel)
            }
        }
        else{
            this.target.takeEvent(when,this.key,this,null,triggerLevel)
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
    //发生这个事件,收集到当前事务中
    happen(doEvent:()=>void,triggerLevel?:number){
        this.onExecute = doEvent
        newLog({
            main:["发生了事件",this],
            detail:[
                "来源:",this.source," | ",
                "媒介:",this.medium," | ",
                "目标:",this.target," | "
            ]
        })
        gatherToTransaction(this,triggerLevel)
    }
    //执行这个事件
    async excute(){
        //触发事件的执行时函数
        if(this.onExecute){
            this.onExecute(this)
        }
        //触发事件的各个效果
        for(let effect of this.effects){
            await effect.apply()
        }
        //按顺序执行阶段
        for(let phase of this.eventPhase){
            //判断条件
            if(phase.condition){
                const res = phase.condition(this)
                if(!res){
                    //返回false
                    this.setPhaseResult(phase.key,false)
                    return;
                }
            }
            //执行阶段效果
            for(let effect of phase.effects){
                const res = await effect.apply()
                //存储阶段结果
                this.setPhaseResult(phase.key,res)
            }
        }
    }
    //设置事件的阶段返回结果
    setPhaseResult(phaseKey:string,res:any){
        this._phaseResult[phaseKey] = res;
    }
    //获取阶段的返回结果
    getPhaseResult(phaseKey:string){
        const res = this._phaseResult[phaseKey]
        if(res != null){
            return res
        }
        else{
            newLog([
                "错误：尝试获取的阶段结果不存在，可能是1.阶段尚未完成，2.压根就没有这阶段。",
            ])
        }
    }
}

// 使得一个事件产生并发生
export async function doEvent(
    key:string,
    source:Entity,
    medium:Entity,
    target:Entity|Entity[],
    info:Record<string,any>={},
    effectUnits:EffectUnit[],
    eventPhase:{
        key:string,
        effectUnits:EffectUnit[],
        condition?:(event:ActionEvent)=>boolean,
        onFalse?:()=>any,
    }[]=[],
    doWhat:()=>void=()=>{},//可选，在事件执行时进行的函数
){
    //创建行为事件
    const event = new ActionEvent(key,source,medium,target,info,effectUnits,eventPhase)
    event.happen(()=>{doWhat()})
}

//处理事件对象
export function handleEventEntity<T extends Entity>(entity:T|T[],callback:(e:T)=>void){
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