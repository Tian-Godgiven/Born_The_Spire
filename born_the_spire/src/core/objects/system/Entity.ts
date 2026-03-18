import type { StatusMap } from "@/core/types/StatusMapData";
import type { ActionEvent } from "./ActionEvent";
import type{ Describe } from "@/ui/hooks/express/describe";
import type { TriggerMap, TriggerObj } from "@/core/types/object/trigger";
import type { Effect } from "./effect/Effect";
import type { Current } from "./Current/current";
import type { EventParticipant } from "@/core/types/event/EventParticipant";
import type{ IMechanismManager } from "./mechanism/MechanismManager";

import { nanoid } from "nanoid";
import { appendStatus, createStatusFromMap, Status } from "./status/Status";
import { Trigger } from "./trigger/Trigger";
import { initCurrentFromMap } from "./Current/current";



// 实体（entity）是Target和Item的基类
export class Entity implements EventParticipant{
    public __id:string = nanoid()
    public label:string
    public participantType: 'entity' = 'entity'
    //属性值:相对静态的，受修饰器管理的值
    public status:Record<string,Status> = {}
    //当前值：非常动态的，范围内频繁变化的值
    public current:Record<string,Current> = {}
    public describe:Describe = [] //描述
    //触发器
    public trigger:Trigger
    //游戏机制管理器
    public mechanisms?: IMechanismManager
    //主动能力相关属性
    public disabledAbilities?: Set<string>  // 被禁用的能力key列表
    public abilityCostModifiers?: Map<string, number>  // 能力消耗修改器 (abilityKey_costType -> modifier)

    // 两阶段初始化相关字段
    private _initialized: boolean = false
    private _currentMapData?: any
    private _beforeCurrentInit?: (this: Entity) => void

    constructor(map:EntityMap, beforeCurrentInit?: (this: Entity) => void){
        this.label = map.label
        //初始化实体自带的触发器,并创建自带的触发器
        this.trigger = new Trigger()
        if(map.trigger){
            //自带的触发器，其来源和目标都是自身
            this.trigger.initTriggerByMap(this,this,map.trigger)
        }
        //初始化属性
        if(map.status){
            for(let[key,value] of Object.entries(map.status)){
                const status = createStatusFromMap(this,key,value)
                appendStatus(this,status)
            }
        }

        // 保存初始化数据，不立即执行异步初始化
        this._beforeCurrentInit = beforeCurrentInit
        this._currentMapData = map.current

        //初始化描述
        this.describe = map.describe??[]
    }

    /**
     * 异步初始化方法
     *
     * 在构造函数完成后调用，执行需要异步的初始化逻辑
     * 子类可以覆盖此方法添加自己的初始化逻辑
     */
    async initialize(): Promise<void> {
        if (this._initialized) return

        // 执行 beforeCurrentInit 回调
        if (this._beforeCurrentInit) {
            this._beforeCurrentInit.call(this)
        }

        // 初始化 Current（静态 import，preload.ts 已调整顺序：current 在 Entity 之前）
        if (this._currentMapData) {
            await initCurrentFromMap<typeof this>(this, this._currentMapData)
        }

        this._initialized = true
    }

    //添加一个触发器
    appendTrigger(triggerObj:TriggerObj){
        return this.trigger.appendTrigger(triggerObj)
    }
    //对象的"造成"触发器被触发
    makeEvent(when: "before" | "after", triggerKey: string, event: ActionEvent, effect: Effect | null, triggerLevel: number){
        this.trigger.onTrigger(when, "make", triggerKey, {actionEvent:event, effect}, triggerLevel)
    }
    //对象作为媒介参与了某个事件
    viaEvent(when: "before" | "after", triggerKey: string, event: ActionEvent, effect: Effect | null, triggerLevel: number){
        this.trigger.onTrigger(when, "via", triggerKey, {actionEvent:event, effect}, triggerLevel)
    }
    //对象受到了某个事件
    takeEvent(when: "before" | "after", triggerKey: string, event: ActionEvent, effect: Effect | null, triggerLevel: number){
        this.trigger.onTrigger(when, "take", triggerKey, {actionEvent:event, effect}, triggerLevel)
    }
}

export type EntityMap<T extends Entity = Entity> = {
    label:string
    key:string,//唯一识别码，决定这个对象是什么对象/哪种对象（同一种对象可以有多个）
    status?:Record<string,StatusMap|number>;
    trigger?:TriggerMap;
    describe?:Describe;
    current?:any//需要挂载的当前值对象的key及其起始值 - 改用 any 避免导入 CurrentMapData
}

