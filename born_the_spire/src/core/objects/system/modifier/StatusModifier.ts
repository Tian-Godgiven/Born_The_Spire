import { Entity } from "../Entity"
import { Modifier, ModifierObj } from "./Modifier"

//属性修饰器对象
class StatusModifierObj extends ModifierObj{
    private modifierFunc:(owner:Entity)=>string|number|void//通过这个值来修改对应的属性值
    public level:number//计算优先级
    public statusKey:string//该对象所属的属性
    public type:"base"|"temp"//修饰器的类型：基础修饰器不会在清空修饰器时被移除
    public countType:"change"|"add"//计算类型：修改/加法
    constructor(statusKey:string,source:any,modifierFunc:(owner:Entity)=>string|number|void,level:number=0,type:"base"|"temp" = "temp"){
        super(source)
        this.modifierFunc = modifierFunc
        this.level = level
        this.statusKey = statusKey
        this.type = type
    }
    modifier(owner:Entity){
        return this.modifierFunc(owner)
    }
}

export class StatusModifier extends Modifier<StatusModifierObj>{
    public statusKey:string
    constructor(statusKey:string){
        super()
        this.statusKey = statusKey
    }
    //通过JSON数据添加属性修饰器
    addByJSON(statusKey:string,source:any,modify:string|number|((target:Entity)=>string|void),level?:number,type?:"base"|"temp"){
        let modifierFunc:(target:Entity)=>string|number|void
        if(typeof modify == "string" || typeof modify == "number"){
            modifierFunc = (_target:Entity)=>{
                return modify
            }
        }else{
            modifierFunc = modify
        }
        const modifierObj = new StatusModifierObj(statusKey,source,modifierFunc,level,type);
        this.add(modifierObj)
    }
    delete(id:string,force:boolean=false):boolean{
        const modifierObj = this.seach(id)
        if(modifierObj){
            //不能在非强制情况下删除基础属性
            if(modifierObj.type == "base" && !force){
                return false
            }
            return super.delete(id)
        }
        return false
    }
    refresh(owner:Entity,baseValue:number): void {
        //先排序
        const objs = this.store
        const list = objs.sort((a,b)=>a.level - b.level)
        //依次用基础值计算
        for(let obj of list){
            baseValue += obj.modifier(owner)
        }
    }
}