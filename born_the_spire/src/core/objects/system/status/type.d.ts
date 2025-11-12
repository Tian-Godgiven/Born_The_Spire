export type TargetLayer = "base" |"current"   
export type ModifierType = "additive" | "multiplicative" | "function" 
export type ApplyMode = "absolute" | "snapshot"  
export type ModifierFunc = (owner:Entity,currentValue:number,value:number)=>number
export type ModifierOptions = {
    targetLayer:TargetLayer,
    modifierType:ModifierType,
    applyMode:ApplyMode,
    modifierValue:number,
    clearable?:boolean,
    modifierFunc?:ModifierFunc
}