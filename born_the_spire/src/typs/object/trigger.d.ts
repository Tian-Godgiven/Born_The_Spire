import { Effect } from "@/objects/system/effect/Effect"
import { EffectUnit } from "@/objects/system/effect/EffectUnit"

//触发器的回调函数，其总是会提供触发该触发器的事件对象
export type TriggerFunc<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = (event:ActionEvent<s,m,t>,effect:Effect|null,triggerLevel:number=0)=>void


//触发器包含before和after两种类型
export type TriggerType = {
    before:Record<string,TriggerUnit[]>,
    after:Record<string,TriggerUnit[]>,
}


//触发器单元，直接存储在触发器内部的对象
export type TriggerUnit<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = {
    callback:TriggerFunc<s,m,t>,
    __key:string,//单元被分配的随机key，用于移除或修改指定的触发器
}


//触发器物体，用于调用触发器
export type TriggerObj<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = {
    when:"before"|"after",
    how:"take"|"make"|"via",
    key:string,
    callback:TriggerFunc<s,m,t>,
}


//触发器的数据存储map，默认触发时机为"before"，优先级为0
type TriggerItemMap = Record<[triggerKey:string],{
    when:"before"|"after",//触发时机
    level:number//触发优先级
    //触发器所产生是事件中
    events:{
        key:string,
        effects:EffectUnit[]
        info?:Record<string,any>
        
    }[]
}>

export type TriggerMap = {
    take?:TriggerItemMap;
    make?:TriggerItemMap;
    via?:TriggerItemMap;
}