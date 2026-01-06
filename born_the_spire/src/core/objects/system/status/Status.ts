import { StatusMap } from "@/static/list/system/statusMap"
import { Entity } from "../Entity"
import { Modifier } from "../modifier/Modifier"
import { StatusModifier } from "./StatusModifier"
import { ModifierFunc, ModifierOptions, ModifierType, TargetLayer } from "./type"
import { newError } from "@/ui/hooks/global/alert"
import { ref } from "vue"
import { getRefValue } from "@/core/hooks/refValue"

export type StatusOptions = {
    notNegative?:boolean//非负
}

export class Status extends Modifier<StatusModifier>{
    public key:string//唯一键名
    public label:string//属性名称
    public options?:StatusOptions//备注：功能未完成
    private _value = ref(0)//当前值
    private _baseValue = ref(0)//基础值
    public get value():number{return getRefValue(this._value)}
    public get baseValue():number{return getRefValue(this._baseValue)}
    private owner:Entity
    constructor(owner:Entity,key:string,label?:string){
        super()
        this.key = key
        this.owner = owner
        this.label = label??key
    }
    //通过JSON数据添加属性修饰器，默认配置下添加的是基础修饰器
    addByJSON(source:any,options:Partial<ModifierOptions>&{modifierValue:number}){
        const statusKey = this.key
        const {modifierValue,targetLayer="base",applyMode="absolute",modifierType="additive",clearable,modifierFunc} = options
        const modifierObj = new StatusModifier(statusKey,source,{
            targetLayer,
            modifierType,
            applyMode,
            modifierValue,
            modifierFunc,
            clearable
        },{value:this.value,baseValue:this.baseValue});
        return this.add(modifierObj)
    }
    //刷新，重新计算当前值和基础值
    refresh(): void {
        super.refresh()
        //刷新基础值
        this._baseValue.value = countBaseModifier(this.owner,this.baseValue,this.store)
        //刷新当前值
        this._value.value = countCurrentModifier(this.owner,this.baseValue,this.value,this.store)
    }
    //获得响应式值
    getRefValue(){
        return this._value
    }
}
//计算基础值
function countBaseModifier(owner:Entity,baseValue:number,modifierArr:StatusModifier[]){
    let newValue = baseValue
    //排序
    const sortedModifiers = [...modifierArr].sort((a, b) => a.timeStamp - b.timeStamp)
    for(let i of sortedModifiers){
        newValue = i.applyBase(owner,newValue,i)
    }
    return newValue
}
//计算当前值
function countCurrentModifier(owner:Entity,baseValue:number,currentValue:number,modifierArr:StatusModifier[]){
    let newValue = baseValue
    const sortedModifiers = [...modifierArr].sort((a, b) => a.timeStamp - b.timeStamp)
    for(let i of sortedModifiers){
        newValue = i.applyCurrent(owner,baseValue,currentValue,i)
    }
    return newValue
}




// 工具方法

//通过实体的属性map创建属性对象
export function createStatusFromMap(owner:Entity,key:string,mapData:StatusMap):Status{
    let status:Status
    let value
    if(typeof mapData == "number"){
        value = mapData
        status = new Status(owner,key)
    }
    else{
        value = mapData.value
        status = new Status(owner,key,mapData?.label)
    }
    //添加默认值修饰器
    status.addByJSON(owner,{
        modifierValue:value
    })

    return status
}

//添加属性:不允许重复
export function appendStatus(entity:Entity,status:Status){
    const key = status.key
    if(ifHaveStatus(entity,key)){
        newError([entity,"已具备属性",key])
    }
    //添加到对象的属性值中
    entity.status[key] = status
}
// 获取目标属性的值，如果目标不具备这个属性则报错，通过safe设置项在不具备属性时返回设定值
export function getStatusValue(entity:Entity,statusKey:string,defaultValue?:number){
    const status = entity.status[statusKey]
    if(!ifHaveStatus(entity,statusKey)){
        if(defaultValue != undefined){
            return defaultValue
        }
        else{
            newError([entity,"不具备属性",statusKey])
        }
    }
    return status.value
}
// 获取目标属性的响应式值，如果目标不具备这个属性则报错
export function getStatusRefValue(entity:Entity,statusKey:string){
    const status = entity.status[statusKey]
    if(!ifHaveStatus(entity,statusKey)){
        newError([entity,"不具备属性",statusKey])
    }
    return status.getRefValue()
}
//判断目标是否具备属性
export function ifHaveStatus(entity:Entity,statusKey:string){
    return entity.status[statusKey] ? true:false
}
//为目标的属性值添加新的修饰器，返回移除函数
export function changeStatusValue(entity:Entity,statusKey:string,source:any,{value,type="additive",target="base",modifierFunc}:{value:number,type?:ModifierType,target?:TargetLayer,modifierFunc?:ModifierFunc}):()=>void{
    //找到属性
    if(ifHaveStatus(entity,statusKey)){
        const status = entity.status[statusKey]
        //创建修饰器
        if(target == "base"){
            return status.addByJSON(source,{
                "modifierValue":value,
                "applyMode":"absolute",
                "modifierType":type,
                "targetLayer":target,
                modifierFunc
            })
        }
        else if(target == "current"){
            return status.addByJSON(source,{
                "modifierValue":value,
                "applyMode":"snapshot",
                "modifierType":type,
                "targetLayer":target,
                modifierFunc
            })
        }
    }
    else{
        newError([entity,"不具备属性",statusKey])
    }
    // 如果出错，返回空函数
    return ()=>{}
}


// //判断对象是否具备某个属性

// //根据key值获取目标对象中的属性对象


// //修改目标属性的值,超过上限或下限的部分无效


// //初始化所有属性值


// //判断属性当前值合法
