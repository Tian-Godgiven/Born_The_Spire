import type { Condition } from "../ConditionSystem"

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
        | TargetTypeString  // 使用统一的 targetType 字符串
        | Entity            // 某个指定的对象
    sourceTargetType?: TargetTypeString  // 事件的 source 来源（可选），使用统一的 targetType 格式
    mediumTargetType?: TargetTypeString  // 事件的 medium 来源（可选），使用统一的 targetType 格式
    effect:EffectUnit[]
    condition?: TriggerCondition | Condition;
}

// 反应映射：action 名称 -> 事件配置数组
export type ReactionMap = Record<string, TriggerEventConfig[]>

// 触发条件 - 旧格式（向后兼容，新代码请使用 Condition 字符串格式）
export interface TriggerCondition {
  // 检查触发器来源（item/relic/organ 自身）的 status 值（旧格式，向后兼容）
  sourceStatus?: {
    key: string       // status 的 key
    value: number | string     // 期望的值（可为字符串）
    op?: "eq" | "lte" | "gte" | "lt" | "gt"  // 比较运算符，默认 "eq"
  }
  // 检查持有者当前生命百分比（旧格式，向后兼容）
  ownerHealthPercent?: {
    value: number
    op?: "eq" | "lte" | "gte" | "lt" | "gt"
  }
  // 检查持有者其他属性（新通用格式）
  status?: {
    status: string    // 属性名（health/energy 或 status key）
    op: "<" | "<=" | ">" | ">=" | "="
    value: number | string  // 数值或百分比字符串（如 "50%"）
  }
  // 检查当前回合数
  turnNumber?: {
    equals?: number       // 等于该回合数时触发
    mod?: [number, number]  // [除数, 余数]，例如 [3, 0] 表示每3回合触发
  }
}

// 旧格式：直接定义事件配置（向后兼容）
export interface TriggerMapItemWithEvent {
    when: "before" | "after";
    how: "make" | "via" | "take";
    key: string;
    level?: number;
    event: TriggerEventConfig | TriggerEventConfig[];  // 直接定义事件
    info?: string;
    condition?: TriggerCondition | Condition;
}

// 新格式：使用 action + reaction（推荐）
export interface TriggerMapItemWithAction {
    when: "before" | "after";
    how: "make" | "via" | "take";
    key: string;
    level?: number;
    action: string;  // 指定响应名称（与 event 互斥）
    info?: string;
    condition?: TriggerCondition | Condition;
    triggerTarget?: {
        participantType: "entity"
        key: string  // 通过 key 指定目标，如 "player" 表示当前战斗中的玩家
    }
    timing?: "immediate" | "battleStart"
    disableUntil?: "battleEnd"
}

// 触发器映射项：支持旧格式或新格式
export type TriggerMapItem = TriggerMapItemWithEvent | TriggerMapItemWithAction

// 有 importantKey 的版本（仅支持新格式）
export interface ImportantTriggerMapItem {
    when: "before" | "after";
    how: "make" | "via" | "take";
    key: string;
    level?: number;
    action: string;
    importantKey: string;
    onlyKey?: string;
    info?: string;
    condition?: TriggerCondition | Condition;
    triggerTarget?: {
        participantType: "entity"
        key: string  // 通过 key 指定目标，如 "player" 表示当前战斗中的玩家
    }
    timing?: "immediate" | "battleStart"
    disableUntil?: "battleEnd"
}

export type TriggerMap = (TriggerMapItem|ImportantTriggerMapItem)[]
