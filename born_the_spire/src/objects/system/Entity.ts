import { initStatusByMap, StatusMap } from "@/static/list/system/statusList";
import { Trigger } from "./trigger/Trigger";
import { ActionEvent } from "./ActionEvent";
import { Describe } from "@/hooks/express/describe";
import { Status } from "./Status";
import { TriggerMap, TriggerObj } from "@/types/object/trigger";
import { reactive } from "vue";

import { Effect } from "./effect/Effect";
// 实体（entity）是Target和Item的基类
export class Entity{
    public label:string
    //属性值
    public status:Record<string,Status> = {}
    public describe:Describe = []
    //触发器
    public trigger:Trigger
    constructor(map:EntityMap){
        this.label = map.label
        //初始化实体自带的触发器,并创建自带的触发器
        this.trigger = new Trigger()
        if(map.trigger){
            //自带的触发器，其来源和目标都是自身
            this.trigger.initTriggerByMap(this,this,map.trigger)
        }

        //初始化属性
        if(map.status){
            for(let [key,value] of Object.entries(map.status)){
                const status = initStatusByMap(key,value)
                this.getStatus(status)
            }
        }
        //初始化描述
        this.describe = map.describe??[]
        //响应式代理
        reactive(this)
    }
    //获得一个触发器
    getTrigger(triggerObj:TriggerObj){
        return this.trigger.getTrigger(triggerObj)
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
    //获得属性
    getStatus(status:Status){
        const key = status.key
        //添加到属性值中
        this.status[key] = status
    }
}

export type EntityMap = {
    label:string
    key:string,//唯一识别码，决定这个对象是什么对象/哪种对象（同一种对象可以有多个）
    status?:Record<string,StatusMap|number>;
    trigger?:TriggerMap;
    describe?:Describe
}

//初始化行为
//未完成
// function initBehavior(entity:Entity,map:Record<string,EffectUnit[]>){
//     //每种行为都对应是一个on的触发器，在行为事件触发时产生效果
//     for(let [key,effects] of Object.entries(map)){
//         entity.getTrigger({
//             when:"before",
//             how:"via",
//             key,
//             callback:async({source,target})=>{
//                 for(let map in effects){
//                     await doEffectByKey(source,entity,target,map)
//                 }
//             }
//         })
//     }
// }