import { Effect } from "@/objects/system/effect/Effect"
import { EffectUnit } from "@/objects/system/effect/EffectUnit"
import { Entity } from "@/objects/system/Entity"

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
    level?:number,//触发优先级
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
    level?:number
    callback:TriggerFunc<s,m,t>,
}


//触发器的数据存储map，默认触发时机为"before"，优先级为0
export interface TriggerEventConfig{
    key:string,
    label?:string,
    info?:Record<string,any>
    targetType://事件目标是参与触发事件的哪个对象
        "eventSource"|//触发事件中的来源
        "eventMedium"|//触发事件中的媒介
        "eventTarget"|//触发事件中的目标
        "triggerSource"|//触发器的来源对象
        "triggerHover"|//持有该触发器的对象
        Entity//某个指定的对象
    effect:EffectUnit[]
}

export interface TriggerMapItem{
    when?:"before"|"after"="before",//触发时机
    how:"make"|"via"|"take",
    key:string,//触发关键字triggerKey
    level?:number=0//触发优先级
    //触发器所产生的事件
    event:TriggerEventConfig[]
}

export type TriggerMap = TriggerMapItem[]