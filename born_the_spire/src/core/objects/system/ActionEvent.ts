import { Effect } from "./effect/Effect";
import { Entity } from "./Entity";
import { gatherToTransaction } from "../game/transaction";
import { newLog } from "@/ui/hooks/global/log";
import { EffectUnit, getEffectByUnit } from "./effect/EffectUnit";
import { nanoid } from "nanoid";
import { isArray } from "lodash";

// 使得一个阶段事件产生并发生:阶段事件是指单个事件过程中的多个效果会分阶段执行，在每个阶段开始时判断条件后记录效果的返回值。每个效果都对应一个阶段
type EventPhase = {
    effectUnits:EffectUnit[],//该阶段中将会启用的效果单元
    condition?:(event:ActionEvent)=>boolean,//该阶段在进行前的判断效果，返回true时进行该阶段
    onFalse?:()=>any,//该阶段未能正确进行时的回调函数
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
    public phase:{
        effects:Effect[],
        conditions?:(event:ActionEvent)=>boolean,
        onFalse?:()=>any
    }[];
    private _result:Record<string,any> = {}//阶段的返回值 
    constructor(
        key:string,//触发key
        source:s,medium:m,target:t|t[],
        info:Record<string,any>,
        effectUnits:EffectUnit[],
        phase:EventPhase[]
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
        //构建各个阶段包含的效果
        this.phase = phase.map(p=>{
            return {
                effects:p.effectUnits.map(eu=>{
                    return getEffectByUnit(this,eu)
                }),
                conditions:p.condition,
                onFalse:p.onFalse
            }
        })
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
        //依次执行事件的各个阶段
        for(let p of this.phase){
            //验证条件
            if(p.conditions ? p.conditions(this):true){
                //宣布并执行该阶段的效果
                for(let effect of p.effects){
                    effect.announce(this.triggerLevel??0)
                    await effect.apply()
                }
            }
            else{
                p.onFalse?.()
            }
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
            newLog([
                "错误：尝试获取的结果不存在，可能是1.前一个效果没有异步标识，2.前一个效果设定的key和当前效果获取的key不一致。",
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
    effectUnits:EffectUnit[] = [],
    phase:EventPhase[] = [],
    doWhat:()=>void=()=>{},//可选，在事件执行时进行的函数
){
    //创建行为事件
    const event = new ActionEvent(key,source,medium,target,info,effectUnits??[],phase)
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