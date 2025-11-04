import { Entity } from "../Entity"
import { Modifier, ModifierObj } from "./Modifier"

type TargetLayer = "base" |"current"   
type ModifierType = "additive" | "multiplicative" | "function" 
type ApplyMode = "absolute" | "snapshot"  
type ModifierOptions = {
    targetLayer:TargetLayer,
    modifierType:ModifierType,
    applyMode:ApplyMode,
    modifierValue:number,
    clearable?:boolean,
    modifierFunc?:(owner:Entity,currentValue:number,value:number)=>number
}

//属性修饰器对象
class StatusModifierObj extends ModifierObj{
    public statusKey: string           // 作用的属性键
    public targetLayer:  TargetLayer
    public modifierType:  ModifierType  
    public applyMode: ApplyMode
    public timeStamp: number            
    public snapshotValue?: number 
    public snapshotBaseValue?: number 
    public value: number    
    public clearable:boolean = true
    public modifierFunc?:(owner:Entity,currenValue:number,value:number)=>number//通过这个值来修改对应的属性值
    constructor(statusKey:string,source:any,tmp:ModifierOptions,{value,baseValue}:{value:number,baseValue:number}){
        super(source)
        const {targetLayer="current",modifierType="additive",applyMode="snapshot",modifierValue=0,clearable,modifierFunc} = tmp
        this.statusKey = statusKey
        this.targetLayer = targetLayer;
        this.modifierType = modifierType;
        this.applyMode = applyMode
        this.timeStamp = Date.now()
        this.value = modifierValue
        this.clearable = clearable ?? true
        if(modifierType == "function" && modifierFunc){
            this.modifierFunc = modifierFunc
        }
        //如果是快照类型，则记录当前快照值
        if(applyMode == "snapshot"){
            this.snapshotBaseValue = baseValue;
            this.snapshotValue = value
        }
    }
}

export class StatusModifier extends Modifier<StatusModifierObj>{
    public statusKey:string
    private _value:number = 0//当前值
    private _baseValue:number = 0//基础值
    public get value():number{return this._value}
    public get baseValue():number{return this._baseValue}
    constructor(statusKey:string){
        super()
        this.statusKey = statusKey
    }
    //通过JSON数据添加属性修饰器，默认配置下添加的是基础修饰器
    addByJSON(statusKey:string,source:any,options:{
        modifierValue:number,
        targetLayer?:TargetLayer,
        modifierType?:ModifierType,
        applyMode?:ApplyMode,
        clearable?:boolean,
        modifierFunc?:(owner:Entity,value:number)=>number})
    {
        const {modifierValue,targetLayer="base",applyMode="absolute",modifierType="additive",clearable,modifierFunc} = options
        const modifierObj = new StatusModifierObj(statusKey,source,{
            targetLayer,
            modifierType,
            applyMode,
            modifierValue,
            modifierFunc,
            clearable
        },{value:this.value,baseValue:this.baseValue});
        this.add(modifierObj)
    }
    //刷新，重新计算当前值和基础值
    refresh(owner:Entity): void {
        //刷新基础值
        this._baseValue = countBaseValue(this._baseValue,this.store)
        //刷新当前值
        this._value = countCurrentValue(this.baseValue,this.store)
    }
}

function countAddictive(baseValue:number,obj:StatusModifierObj){
    return baseValue + obj.value
}
function countSnapshotAdd(baseValue:number,obj:StatusModifierObj){
    const v = obj.value
    return baseValue + v
}
function countMultiplicative(baseValue:number,obj:StatusModifierObj){
    return baseValue + (obj.value - 1)
}
function countSnapshotMulti(baseValue:number,obj:StatusModifierObj){
    const multiplier = obj.value
    const snapBase = obj.snapshotBaseValue ?? baseValue // 若未设置，防御性回退
    return baseValue + snapBase * (multiplier - 1);
}
function countBaseValue(baseValue:number,objs:StatusModifierObj[]){
    let currentValue = baseValue
    //1计算基础值
    const baseObj =objs.filter(obj=>obj.targetLayer == "base")
    //1.1排序并提取
    const sortedBase = baseObj.sort((a,b)=>a.timeStamp - b.timeStamp)
    return countByModifierType(currentValue,sortedBase)
}
function countCurrentValue(baseValue:number,objs:StatusModifierObj[]){
    let currentValue = baseValue
    //1计算基础值
    const baseObj =objs.filter(obj=>obj.targetLayer == "current")
    //1.1排序
    const sortedBase = baseObj.sort((a,b)=>a.timeStamp - b.timeStamp)
    //1.2按类型处理
    for(let obj of sortedBase){
        if(obj.modifierType == "additive"){
            if(obj.applyMode == "absolute"){
                currentValue = countAddictive(currentValue,obj)
            }
            else if(obj.applyMode == "snapshot"){
                currentValue = countSnapshotAdd(currentValue,obj)
            }
        }
        else if(obj.modifierType == "multiplicative"){
            
        }
    }
    
}
function countByModifierType(baseValue:number,objs:StatusModifierObj[]){
    let currentValue = baseValue
    const baseAdd = objs.filter(i=>i.modifierType == "additive")
    const baseMulti = objs.filter(i=>i.modifierType == "multiplicative")
    const baseFunc = objs.filter(i=>i.modifierType == "function")
    //1.2先计算非临时类型值
    for(let obj of baseAdd){
        currentValue = countAddictive(currentValue,obj)
    }
    //1.3再计算乘除
    let multiValue = 1
    for(let obj of baseMulti){
        //大于1的相加，否则相减其倒数
        multiValue = countMultiplicative(multiValue,obj)
    }
    currentValue = currentValue * multiValue
    //1.4最后给函数们计算
    for(let obj of baseFunc){
        if(obj.modifierFunc){
            currentValue = obj?.modifierFunc?.(owner,currentValue,obj.value)
        }
    }
    return currentValue
}

