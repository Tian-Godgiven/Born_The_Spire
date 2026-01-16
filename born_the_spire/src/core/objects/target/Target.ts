import { nanoid } from "nanoid";
import { getOrgan, Organ } from "./Organ";
import { getOrganByKey } from "@/static/list/target/organList";
import { Entity, EntityMap } from "../system/Entity";
import { State } from "../system/State";
import { TriggerMap } from "@/core/types/object/trigger";
import { computed, reactive } from "vue";
import { getStatusRefValue } from "../system/status/Status";
import { getCurrentRefValue } from "../system/Current/current";
import { getOrganModifier } from "../system/modifier/OrganModifier";

export type TargetMap = EntityMap & {
    label:string,
}
//可被选中和作用的目标
export class Target extends Entity{
    public label:string = "";//名称
    public readonly __key:string = nanoid() //唯一键
    public state:State[] = []//状态数组
    constructor(map:TargetMap){
        super(map)
        //名称
        this.label = map.label
    }
}

export type CharaMap = TargetMap & {
    organ:string[]
    trigger?:TriggerMap
}
//用于角色和敌人
export class Chara extends Target{
    // 从 OrganModifier 动态获取器官列表（用于 UI 显示）
    public organs = computed(() => {
        return getOrganModifier(this).getOrgans()
    })

    constructor(map:CharaMap){
        super(map)

        // 添加默认的死亡触发器
        // 使用 onlyKey 机制，允许被子类或配置覆盖
        this.appendTrigger({
            when: "after",
            how: "take",
            key: "healthReachMin",
            onlyKey: "default_death_on_health_zero",
            importantKey: "death_behavior",
            callback: (event) => {
                // 默认行为：生命归0时立即死亡
                const { doEvent } = require("../system/ActionEvent")
                doEvent({
                    key: "kill",
                    source: event.source,
                    medium: event.medium,
                    target: this,
                    info: { reason: "生命值达到下限" },
                    effectUnits: [{
                        key: "kill",
                        params: { reason: "生命值达到下限" }
                    }]
                })
            }
        })

        // 初始化器官
        this.initOrgans(map.organ)
    }

    // 添加器官的方法
    protected initOrgans(organKeys: string[]) {
        if (organKeys) {
            for(let key of organKeys){
                const organ = getOrganByKey(key)
                getOrgan(this, this, organ)
            }
        }
    }

    //获取对象的器官列表
    getOrganList(){
        return this.organs.value
    }
    //获取目标的生命值/最大生命对象
    getHealth(){
        //找到其属性
        return reactive({
            max:getStatusRefValue(this,"max-health"),
            now:getCurrentRefValue(this,"health",0)
        })
    }
    getEnergy(){
        //找到其属性
        const max = getStatusRefValue(this,"max-energy")
        const now = getCurrentRefValue(this,"energy",0)
        return {max,now}
    }
}