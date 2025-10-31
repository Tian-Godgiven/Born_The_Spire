import { nanoid } from "nanoid";
import { Organ } from "./Organ";
import { getOrganByKey } from "@/static/list/target/organList";
import { Entity, EntityMap } from "../system/Entity";
import { doEvent } from "@/core/objects/system/ActionEvent";
import { State } from "../system/State";
import { newLog } from "@/ui/hooks/global/log";
import { TriggerMap } from "@/core/types/object/trigger";
import { reactive } from "vue";

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
            this.getOrgan(this,organ)
        }
    }
    //获得器官
    async getOrgan(source:Entity,organ:Organ){
        newLog([this,"获得了器官",organ])
        doEvent({
            key:"getOrgan",
            source,
            medium:organ,
            target:this
        })
        this.organs.push(organ)
    }
    //获取对象的器官列表
    getOrganList(){
        return this.organs
    }
}