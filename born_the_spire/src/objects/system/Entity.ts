import { initStatusByMap, StatusMap } from "@/static/list/system/statusList";
import { Trigger, TriggerFunc, TriggerMap } from "./Trigger";
import { ActionEvent } from "./ActionEvent";
import { Describe } from "@/hooks/express/describe";
import { EffectMap, makeEffectByMap } from "@/static/list/system/effectList";
import { Status } from "./Status";
// 实体（entity）是Target和Item的基类
export class Entity{
    //属性值
    public status:Record<string,Status> = {}
    public describe:Describe = []
    //触发器
    public trigger:Trigger
    constructor(map:EntityMap){
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
        if(map.describe){
            this.describe = map.describe
        }
        
    }
    //获得一个触发器
    getTrigger(triggerMap:{
        when:"before"|"after",
        how:"take"|"make"|"on",
        key:string,
        callBack:TriggerFunc
    }){
        this.trigger.getTrigger(triggerMap)
    }
    //对象造成了某个事件，且该事件被触发了
    makeEvent(when:"before"|"after",event:ActionEvent){
        this.trigger.onTrigger(when,"make",event)
    }
    //对象参与了某个事件
    onEvent(when:"before"|"after",event:ActionEvent){
        this.trigger.onTrigger(when,"on",event)
    }
    //对象受到了某个事件
    takeEvent(when:"before"|"after",event:ActionEvent){
        this.trigger.onTrigger(when,"take",event)
    }
    //获得属性
    getStatus(status:Status){
        const key = status.key
        //添加到属性值中
        this.status[key] = status
    }
}

export type EntityMap = {
    status?:Record<string,StatusMap|number>;
    trigger?:TriggerMap;
    behavior?:Record<string,EffectMap[]>;
    describe?:Describe
}

function initBehavior(entity:Entity,map:Record<string,EffectMap[]>){
    //每种行为都对应是一个on的触发器，在行为事件触发时产生效果
    for(let [key,effects] of Object.entries(map)){
        entity.getTrigger({
            when:"before",
            how:"on",
            key,
            callBack:({source,target})=>{
                effects.forEach(map=>{
                    makeEffectByMap(source,entity,target,map)
                })
            }
        })
    }
}