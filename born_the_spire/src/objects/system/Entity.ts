import { initStatusByMap, StatusMap } from "@/static/list/system/statusList";
import { Trigger } from "./Trigger";
import { ActionEvent } from "./ActionEvent";
import { Describe } from "@/hooks/express/describe";
import { EffectKeyMap, doEffectByKey } from "@/static/list/system/effectList";
import { Status } from "./Status";
import { TriggerMap, TriggerObj } from "@/typs/object/trigger";
import { reactive } from "vue";
import { newLog } from "@/hooks/global/log";
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
        //初始化触发器
        this.trigger = new Trigger((map.trigger)??null)
        //初始化属性
        if(map.status){
            for(let [key,value] of Object.entries(map.status)){
                const status = initStatusByMap(key,value)
                this.getStatus(status)
            }
        }
        //初始化行为
        if(map.behavior){
            initBehavior(this,map.behavior)
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
    //对象造成了某个事件，且该事件被触发了
    async makeEvent(when:"before"|"after",event:ActionEvent,triggerLevel:number){
        newLog([this,"造成了事件",event,"触发级",triggerLevel])
        await this.trigger.onTrigger(when,"make",event,triggerLevel)
    }
    //对象作为媒介参与了某个事件
    async viaEvent(when:"before"|"after",event:ActionEvent,triggerLevel:number){
        newLog([this,"参与了事件",event,"触发级",triggerLevel])
        await this.trigger.onTrigger(when,"via",event,triggerLevel)
    }
    //对象受到了某个事件
    async takeEvent(when:"before"|"after",event:ActionEvent,triggerLevel:number){
        newLog([this,"遭受了事件",event,"触发级",triggerLevel])
       await this.trigger.onTrigger(when,"take",event,triggerLevel)
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
    status?:Record<string,StatusMap|number>;
    trigger?:TriggerMap;
    behavior?:Record<string,EffectKeyMap[]>;
    describe?:Describe
}

//初始化行为
function initBehavior(entity:Entity,map:Record<string,EffectKeyMap[]>){
    //每种行为都对应是一个on的触发器，在行为事件触发时产生效果
    for(let [key,effects] of Object.entries(map)){
        entity.getTrigger({
            when:"before",
            how:"via",
            key,
            callback:async({source,target})=>{
                for(let map in effects){
                    await doEffectByKey(source,entity,target,map)
                }
            }
        })
    }
}