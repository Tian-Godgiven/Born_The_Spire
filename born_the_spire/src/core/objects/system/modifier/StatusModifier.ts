import { Entity } from "../Entity"
import { Modifier } from "./Modifier"

//属性修饰器
export class StatusModifier extends Modifier{
    public modifierFunc:(target:Entity)=>string|number|void
    public level:number
    public statusKey:string
    constructor(source:any,modifierFunc:(target:Entity)=>string|number|void,level:number,statusKey:string){
        super(source)
        this.modifierFunc = modifierFunc
        this.level = level
        this.statusKey = statusKey
    }
}

//创建属性修饰器
export function createStatusModifier(source:any,statusKey:string,modify:(target:Entity)=>string|void,level?:number):StatusModifier
export function createStatusModifier(source:any,statusKey:string,modify:string|number,level?:number):StatusModifier
export function createStatusModifier(source:any,statusKey:string,modify:string|number|((target:Entity)=>string|void),level?:number){
    let modifierFunc:(target:Entity)=>string|number|void
    if(typeof modify == "string" || typeof modify == "number"){
        modifierFunc = (_target:Entity)=>{
            return modify
        }
    }else{
        modifierFunc = modify
    }
    if(level == undefined){
        level = 0
    }
    const modifier = new StatusModifier(source,modifierFunc,level,statusKey)
    return modifier
}
//添加属性修饰器
export function addStatusModifier(modifier:StatusModifier,target:Entity){
    //找到指定的属性对象
    const status = target.status[modifier.statusKey]
    if(!("_modifier" in status)){
        status["_modifier"]= []
    }
    //添加对应的属性修饰器
    status.addModifier(modifier)
    //返回移除函数
    return ()=>{status.removeModifier(modifier)}
}