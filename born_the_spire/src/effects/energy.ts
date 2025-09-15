import { showQuickInfo } from "@/hooks/global/quickInfo"
import { Entity } from "@/objects/system/Entity"
import { changeStatusValue, getStatusValue } from "@/objects/system/Status"
import { Player } from "../objects/target/Player"
import { createEffectByMap, doEffect } from "@/objects/system/effect/Effect"

//消耗玩家的能量
export function costEnergy(source:Entity,medium:Entity,target:Player,cost:number):boolean{
    const ifEnough = checkEnergy(cost,target)
    if(ifEnough){
        const effect = createEffectByMap({
            label:"消耗能量",
            key:"costEnergy",
            targetType:"player",
            value:cost,
            effect:()=>{
                const energy = getStatusValue(target,"energy","now")
                const newEnergy = energy - cost
                changeStatusValue(source,medium,target,"energy",newEnergy,"now")
            }
        })
        doEffect(source,medium,target,effect)
    }
    else{
        showQuickInfo("能量不足")
    }
    return ifEnough
}

//判断能量是否足够
function checkEnergy(cost:number,target:Player):boolean{
    //判断目标的能量是否足够
    const energy = getStatusValue(target,"energy","now")
    if(energy >= cost){
        return true
    }
    return false
}

//获取指定量的能量
export function getEnergy(source:Entity,medium:Entity,target:Player,energy:number|"max"){
    let value:number = 0
    //修改当前值为max
    if(energy == "max"){
        value = getStatusValue(target,"energy","max")
    }
    //获得指定的值+当前值
    else{
        value = getStatusValue(target,"energy","now") + energy
    }
    const effect = createEffectByMap({
        key:"getEnergy",
        label:"获得能量",
        targetType:"any",
        value,
        effect:()=>{
            //获取能量
            changeStatusValue(source,medium,target,"energy",value,"now")
        }
    })
    doEffect(source,medium,target,effect)
}

//清空能量
export function emptyEnergy(source:Entity,medium:Entity,target:Player){
    const effect = createEffectByMap({
        label:"清空能量",
        key:"emptyEnergy",
        targetType:"player",
        value:0,
        effect:()=>{
            changeStatusValue(source,medium,target,"energy",0,"now")
        }
    })
    doEffect(source,medium,target,effect)
}
