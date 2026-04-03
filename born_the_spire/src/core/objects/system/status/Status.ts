import type { StatusMap } from "@/core/types/StatusMapData"
import type { Entity } from "../Entity"
import { Modifier } from "../modifier/Modifier"
import { StatusModifier } from "./StatusModifier"
import type { ModifierFunc, ModifierOptions, ModifierType, TargetLayer } from "./type"
import { newError } from "@/ui/hooks/global/alert"
import { ref, markRaw } from "vue"
import { getRefValue } from "@/core/hooks/refValue"

export type StatusOptions = {
    notNegative?:boolean//非负
}

export class Status extends Modifier<StatusModifier>{
    public readonly statusType = 'status' as const // 类型标识，用于 typeGuard
    public key:string//唯一键名
    public label:string//属性名称
    public options?:StatusOptions//备注：功能未完成
    private _originalBaseValue = ref<number | string>(0)//原始基础值（不受修饰器影响）
    private _value = ref<number | string>(0)//当前值
    private _baseValue = ref<number | string>(0)//基础值
    public get originalBaseValue():number | string{return getRefValue(this._originalBaseValue)}
    public get value():number | string{return getRefValue(this._value)}
    public get baseValue():number | string{return getRefValue(this._baseValue)}
    private owner:Entity
    constructor(owner:Entity,key:string,label?:string){
        super()
        this.key = key
        this.owner = owner
        this.label = label??key
    }

    /**
     * 设置原始基础值（用于卡牌升级等场景）
     * 修饰器会在此基础上继续生效
     */
    public setOriginalBaseValue(value: number | string): void {
        ;(this._originalBaseValue as any).value = value
        if (typeof value === 'string') {
            // 字符串类型直接更新所有值
            this._baseValue.value = value
            this._value.value = value
        } else {
            this.refresh()  // 数值类型需要重新计算修饰器
        }
    }
    //通过JSON数据添加属性修饰器，默认配置下添加的是基础修饰器
    addByJSON(source:any,options:Partial<ModifierOptions>&{modifierValue:number}){
        const statusKey = this.key
        const {modifierValue,targetLayer="base",modifierType="additive",clearable,modifierFunc} = options
        // 如果没有指定 applyMode，根据 targetLayer 设置默认值
        const applyMode = options.applyMode ?? "absolute"
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
        // 如果是字符串值，直接复制不进行计算
        if (typeof this._originalBaseValue.value === 'string') {
            this._baseValue.value = this._originalBaseValue.value
            this._value.value = this._originalBaseValue.value
            return
        }
        // 数值类型才进行修饰器计算
        //先刷新基础值，从原始基础值开始（而不是从0）
        this._baseValue.value = countBaseModifier(this.owner,this.originalBaseValue as number,this.store)
        //再用基础值刷新当前值，从基础值开始
        this._value.value = countCurrentModifier(this.owner,this.baseValue as number,this.value as number,this.store)
    }
    //返回当前值和基础值
    getRefValue(){
        return this._value
    }
    //清除可清理的修饰器（clearable: true）
    clearClearableModifiers(){
        const toRemove = this.store.filter(modifier => modifier.clearable)
        toRemove.forEach(modifier => this.delete(modifier.id))
    }
}
//计算基础值
function countBaseModifier(owner:Entity,baseValue:number,modifierArr:StatusModifier[]){
    let newValue = baseValue
    //排序
    const sortedModifiers = [...modifierArr].sort((a, b) => a.timeStamp - b.timeStamp)
    for(let i of sortedModifiers){
        // 只应用 targetLayer 为 "base" 的修饰器
        if(i.targetLayer === "base") {
            newValue = i.applyBase(owner,newValue,i)
        }
    }
    return newValue
}
//计算当前值
function countCurrentModifier(owner:Entity,baseValue:number,_currentValue:number,modifierArr:StatusModifier[]){
    let newValue = baseValue
    const sortedModifiers = [...modifierArr].sort((a, b) => a.timeStamp - b.timeStamp)
    for(let i of sortedModifiers){
        // 只应用 targetLayer 为 "current" 的修饰器
        if(i.targetLayer === "current") {
            newValue = i.applyCurrent(owner,baseValue,newValue,i)
        }
    }
    return newValue
}




// 工具方法

//通过实体的属性map创建属性对象
export function createStatusFromMap(owner:Entity,key:string,mapData:StatusMap):Status{
    let status:Status
    let value: number | string
    if(typeof mapData == "number"){
        value = mapData
        status = new Status(owner,key)
    }
    else{
        value = mapData.value
        status = new Status(owner,key,mapData?.label)
    }
    //设置原始基础值（而不是添加修饰器）
    // 支持数值和字符串类型
    if (value !== undefined) {
        status.setOriginalBaseValue(value)
    }

    return status
}

//添加属性:不允许重复
export function appendStatus(entity:Entity,status:Status){
    const key = status.key
    if(ifHaveStatus(entity,key)){
        newError([entity,"已具备属性",key])
    }
    //添加到对象的属性值中
    // 使用 markRaw 防止 Status 对象被 reactive 处理（保护内部的 ref）
    entity.status[key] = markRaw(status)
}
// 获取目标属性的值，如果目标不具备这个属性则报错，通过safe设置项在不具备属性时返回设定值
export function getStatusValue(entity:Entity,statusKey:string,defaultValue?:number|string){
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

//确保实体具备某个属性，如果不存在则创建
export function ensureStatusExists(entity:Entity, statusKey:string, initialValue:number = 0): void {
    if (!ifHaveStatus(entity, statusKey)) {
        // 使用 createStatusFromMap 创建 Status 对象（会自动设置原始基础值）
        const status = createStatusFromMap(entity, statusKey, initialValue)
        // 使用 markRaw 标记 Status 对象，防止被 reactive 处理（保护内部的 ref）
        entity.status[statusKey] = markRaw(status)
    }
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
                "clearable": false,  // base 层修改是永久的
                modifierFunc
            })
        }
        else if(target == "current"){
            return status.addByJSON(source,{
                "modifierValue":value,
                "applyMode":"snapshot",
                "modifierType":type,
                "targetLayer":target,
                "clearable": true,  // current 层修改是临时的
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
