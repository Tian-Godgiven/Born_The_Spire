import { Effect } from "@/core/objects/system/effect/Effect"
import { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { Entity } from "@/core/objects/system/Entity"

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
    id:string,//单元被分配的随机id，用于移除或修改指定的触发器
    level?:number,//触发优先级
}


//触发器物体，作为中间类辅助完成方法
export type TriggerObj<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity
> = {
    when:"before"|"after",
    how:"take"|"make"|"via",
    key:string,
    level?:number,
    callback:TriggerFunc<s,m,t>,
    importantKey?:string,
    onlyKey?:string
}


//触发器的数据存储对象，默认触发时机为"before"，优先级为0
export interface TriggerEventConfig{
    key:string,
    label?:string,
    info?:Record<string,any>
    targetType://事件目标是参与触发事件的哪个对象
        "eventSource"|//触发事件中的来源
        "eventMedium"|//触发事件中的媒介
        "eventTarget"|//触发事件中的目标
        "triggerSource"|//触发器的来源对象
        "triggerOwner"|//持有该触发器的对象
        "triggerEffect"|//触发这个触发器的效果对象
        Entity//某个指定的对象
    effect:EffectUnit[]
}

// 基础接口
export interface TriggerMapItemBase {
    when?: "before" | "after";  // 触发时机
    how: "make" | "via" | "take";
    key: string;  // 触发关键字 triggerKey
    level?: number;  // 触发优先级
    event: TriggerEventConfig[];  // 触发器所产生的事件
    info?: string;
}

// 没有 importantKey 的接口
export interface TriggerMapItem extends TriggerMapItemBase {
    importantKey?: never;
}

// 有 importantKey 的接口
export interface ImportantTriggerMapItem extends TriggerMapItemBase {
    importantKey: string;  // 关键触发器
    onlyKey?: string;
}

export type TriggerMap = (TriggerMapItem|ImportantTriggerMapItem)[]