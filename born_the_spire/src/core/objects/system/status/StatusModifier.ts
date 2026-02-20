import { Entity } from "../Entity"
import { ModifierObj } from "../modifier/Modifier"
import { ApplyMode, ModifierOptions, ModifierType, TargetLayer } from "./type"

export class StatusModifier extends ModifierObj{
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
    applyBase(owner:Entity, baseValue: number, modifier: StatusModifier): number {
        switch (modifier.modifierType) {
            case "additive":
                if (modifier.applyMode === "absolute") {
                    return baseValue + modifier.value;
                } else if (modifier.applyMode === "snapshot") {
                    // additive + snapshot 在基础层通常不常见，但保持逻辑
                    return (modifier.snapshotBaseValue || 0) + modifier.value;
                }
                break;

            case "multiplicative":
                if (modifier.applyMode === "snapshot" && modifier.snapshotBaseValue !== undefined) {
                    // 差值计算: base = base + snapshotBaseValue * (multiplier - 1)
                    return baseValue + modifier.snapshotBaseValue * (modifier.value - 1);
                }
                break;

            case "function":
                if (modifier.modifierFunc) {
                    return modifier.modifierFunc(owner, baseValue, modifier.value);
                }
                break;
        }
        return baseValue;
    }

    applyCurrent(owner:Entity,baseValue: number,currentValue: number,  modifier: StatusModifier): number {
        switch (modifier.modifierType) {
            case "additive":
                if (modifier.applyMode === "absolute") {
                    return currentValue + modifier.value;
                } else if (modifier.applyMode === "snapshot") {
                    // additive + snapshot: current = snapshotValue + value
                    return (modifier.snapshotValue || 0) + modifier.value;
                }
                break;

            case "multiplicative":
                if (modifier.applyMode === "snapshot") {
                    if (modifier.snapshotValue !== undefined) {
                        // 当前层差值计算: current = base + snapshotValue * (multiplier - 1)
                        return baseValue + modifier.snapshotValue * (modifier.value - 1);
                    }
                }
                break;
            case "function":
                if (modifier.modifierFunc) {
                    return modifier.modifierFunc(owner, currentValue, modifier.value);
                }
                break;
        }
        return currentValue;
    }

}


