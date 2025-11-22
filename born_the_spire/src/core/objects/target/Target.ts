import { nanoid } from "nanoid";
import { getOrgan, Organ } from "./Organ";
import { getOrganByKey } from "@/static/list/target/organList";
import { Entity, EntityMap } from "../system/Entity";
import { State } from "../system/State";
import { TriggerMap } from "@/core/types/object/trigger";
import { reactive } from "vue";
import { getStatusRefValue } from "../system/status/Status";
import { getCurrentRefValue } from "../system/Current/current";

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
    public organs:Organ[] = reactive([])
    constructor(map:CharaMap){
        super(map)
        //获得器官
        for(let key of map.organ){
            const organ = getOrganByKey(key)
            getOrgan(this,this,organ)
        }
    }
    appendOrgan(organ:Organ){
        this.organs.push(organ)
    }
    //获取对象的器官列表
    getOrganList(){
        return this.organs
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