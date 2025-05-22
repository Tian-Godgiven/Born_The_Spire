import { nanoid } from "nanoid";
import { TriggerMap } from "../system/Trigger";
import { Organ } from "./Organ";
import { getOrganByKey } from "@/static/list/target/organList";
import { Entity, EntityMap } from "../system/Entity";
import { doBehavior } from "@/static/list/system/behaviorList";

export type TargetMap = EntityMap & {
    label:string,
}

export class Target extends Entity{
    public label:string = "";//名称
    public readonly __key:string = nanoid() //唯一键
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
    protected organs:Organ[] = []
    constructor(map:CharaMap){
        super(map)
        //获得器官
        map.organ.forEach(key=>{
            const organ = getOrganByKey(key)
            this.getOrgan(this,organ)
        })
    }
    //获得器官
    getOrgan(source:Entity,organ:Organ){
        doBehavior("getOrgan",source,organ,this)
        this.organs.push(organ)
    }
    //获取对象的器官列表
    getOrganList(){
        return this.organs
    }
}