import { nanoid } from "nanoid";
import { Organ } from "./Organ";
import { getStatusByKey, Status } from "@/static/list/statusList";
import { getOrganByKey } from "@/static/list/organList";
import { Effect } from "@/static/list/effectList";

type TargetMap = {
    label:string,
    status:Record<string,number|boolean>,
    organ:string[]
}

type EffectTrigger = {
    before:Record<string,((source:Target,target:Target,effect:Effect)=>void)[]>,
    after:Record<string,((source:Target,target:Target,effect:Effect)=>void)[]>,
}

export class Target{
    public label:string = "";
    public readonly __key:string = nanoid()
    //属性值
    private status:Record<string,Status> = {}
    protected organs:Organ[] = []
    //效果触发器：产生某个效果或收到某个效果时触发的一系列回调函数
    private trigger:{
        take:EffectTrigger,
        make:EffectTrigger
    } = {
        take:{before:{},after:{}},
        make:{before:{},after:{}}
    }
    constructor(){}
    //初始化对象
    initTarget(map:TargetMap){
        //名称
        this.label = map.label
        //获得基础属性
        for(let [key,value] of Object.entries(map.status)){
            const status = getStatusByKey(key,value)
            this.getStatus(status)
        }
        //获得器官
        map.organ.forEach(key=>{
            const organ = getOrganByKey(key)
            this.getOrgan(organ)
        })
    }

    //获得器官
    getOrgan(organ:Organ){
        this.organs.push(organ)
        //触发器官的get效果
        organ.get(this)
    }
    //获得属性
    getStatus(status:Status){
        const key = status.key
        //添加到属性值中
        this.status[key] = status
    }
    //受到效果
    takeEffect(when:"before"|"after",source:Target,effect:Effect){
        //调用trigger
        const trigger = this.trigger.take[when][effect.key]
        if(trigger){
            //依次触发所有trigger
            trigger.forEach(tmp=>{
                tmp(source,this,effect)
            })
        }
    }
    //产生效果
    makeEffect(when:"before"|"after",target:Target,effect:Effect){
        //调用trigger
        const trigger = this.trigger.make[when][effect.key]
        if(trigger){
            //依次触发所有trigger
            trigger.forEach(tmp=>{
                tmp(this,target,effect)
            })
        }
    }

    //获得触发器
    getTrigger(when:"before"|"after",how:"take"|"make",effectKey:string,callBack:(source:Target,target:Target,effect:Effect)=>void){
        if(!this.trigger[how][when][effectKey]){
            this.trigger[how][when][effectKey] = []
        }
        this.trigger[how][when][effectKey].push(callBack)
    }
    //获取对象的属性值
    getStatusByKey(statusKey:string){
        const target = this.status[statusKey]
        if(!target)throw new Error("不存在的属性")
        return target
    }
    //获取对象的器官列表
    getOrganList(){
        return this.organs
    }
}