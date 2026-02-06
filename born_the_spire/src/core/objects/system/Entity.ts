import { StatusMap } from "@/static/list/system/statusMap";
import { Trigger } from "./trigger/Trigger";
import { ActionEvent } from "./ActionEvent";
import { Describe } from "@/ui/hooks/express/describe";
import { TriggerMap, TriggerObj } from "@/core/types/object/trigger";
import { Effect } from "./effect/Effect";
import { nanoid } from "nanoid";
import { appendStatus, createStatusFromMap, Status } from "./status/Status";
import { Current, initCurrentFromMap } from "./Current/current";
import { CurrentMapData } from "@/static/list/system/currents/currentMap";
import { EventParticipant } from "@/core/types/event/EventParticipant";
import { MechanismManager } from "./mechanism/MechanismManager";

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
    public mechanisms?: MechanismManager
    constructor(map:EntityMap, beforeCurrentInit?: (this: Entity) => void){
        this.label = map.label
        console.log(`[Entity] 构造 ${map.label}`)
        //初始化实体自带的触发器,并创建自带的触发器
        this.trigger = new Trigger()
        if(map.trigger){
            console.log(`[Entity] ${map.label} 初始化 ${map.trigger.length} 个触发器`)
            //自带的触发器，其来源和目标都是自身
            this.trigger.initTriggerByMap(this,this,map.trigger)
        }
        //初始化属性
        if(map.status){
            console.log(`[Entity] ${map.label} 初始化 ${Object.keys(map.status).length} 个属性`)
            for(let[key,value] of Object.entries(map.status)){
                const status = createStatusFromMap(this,key,value)
                appendStatus(this,status)
            }
        }
        //在初始化当前值之前，执行回调（用于子类插入逻辑，如初始化器官）
        if(beforeCurrentInit){
            console.log(`[Entity] ${map.label} 执行 beforeCurrentInit 回调`)
            beforeCurrentInit.call(this)
            console.log(`[Entity] ${map.label} beforeCurrentInit 回调完成`)
        }
        //初始化当前值
        if(map.current){
            console.log(`[Entity] ${map.label} 初始化 Current`)
            initCurrentFromMap<typeof this>(this,map.current)
        }
        //初始化描述
        this.describe = map.describe??[]
        console.log(`[Entity] ${map.label} 构造完成`)
    }
    //添加一个触发器
    appendTrigger(triggerObj:TriggerObj){
        return this.trigger.appendTrigger(triggerObj)
    }
    //对象的“造成”触发器被触发
    makeEvent(when:"before"|"after",triggerKey:string,event:ActionEvent,effect:Effect|null,triggerLevel:number){
        this.trigger.onTrigger(when,"make",triggerKey,{actionEvent:event,effect},triggerLevel)
    }
    //对象作为媒介参与了某个事件
    viaEvent(when:"before"|"after",triggerKey:string,event:ActionEvent,effect:Effect|null,triggerLevel:number){
        this.trigger.onTrigger(when,"via",triggerKey,{actionEvent:event,effect},triggerLevel)
    }
    //对象受到了某个事件
    takeEvent(when:"before"|"after",triggerKey:string,event:ActionEvent,effect:Effect|null,triggerLevel:number){
        this.trigger.onTrigger(when,"take",triggerKey,{actionEvent:event,effect},triggerLevel)
    }
}

export type EntityMap<T extends Entity = Entity> = {
    label:string
    key:string,//唯一识别码，决定这个对象是什么对象/哪种对象（同一种对象可以有多个）
    status?:Record<string,StatusMap|number>;
    trigger?:TriggerMap;
    describe?:Describe;
    current?:CurrentMapData<T>//需要挂载的当前值对象的key及其起始值
}
