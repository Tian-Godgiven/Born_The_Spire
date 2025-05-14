import { nanoid } from "nanoid";
import { Organ } from "./Organ";
import { Status } from "@/interface/Status";
import { setStatus } from "@/hooks/player";
import { getOrganByKey } from "@/static/list/organList";

type TargetMap = {
    label:string,
    status:Record<string,number|boolean>,
    organ:string[]
}

export class Target{
    public label:string = "";
    public readonly __key:string = nanoid()
    //属性值
    private status:Record<string,Status> = {}
    protected organs:Organ[] = []
    constructor(
        
    ){}
    //初始化对象
    initTarget(map:TargetMap){
        //名称
        this.label = map.label
        //获得基础属性
        for(let [key,value] of Object.entries(map.status)){
            const status = setStatus(key,value)
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
    }
    //获得属性
    getStatus(status:Status){
        const key = status.key
        //添加到属性值中
        this.status[key] = status
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