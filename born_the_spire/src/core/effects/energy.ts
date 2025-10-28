import { showQuickInfo } from "@/ui/hooks/global/quickInfo"
import { changeStatusValue, getStatusValue } from "@/core/objects/system/Status"
import { Player } from "../objects/target/Player"
import { EffectFunc } from "../objects/system/effect/EffectFunc"

//消耗玩家的能量
export const costEnergy:EffectFunc = (event,effect)=>{
    const {source,medium,target} = event
    if(target instanceof Player == false) return;
    const cost = effect.params.cost as number
    //只有玩家对象具备卡牌
    const ifEnough = checkEnergy(cost,target)
    if(ifEnough){
        const energy = getStatusValue(target,"energy","now")
        const newEnergy = energy - cost
        changeStatusValue(source,medium,target,"energy",newEnergy,"now")
    }
    else{
        showQuickInfo("能量不足")
        return false
    }
    return true
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
export const getEnergy:EffectFunc = (event,effect)=>{
    const {source,medium,target} = event
    if(target instanceof Player == false) return;
    let value:number = 0
    const energy = effect.params.value as "max"|number
    //修改当前值为max
    if(energy == "max"){
        value = getStatusValue(target,"energy","max")
    }
    //获得指定的值+当前值
    else{
        value = getStatusValue(target,"energy","now") + energy
    }
    changeStatusValue(source,medium,target,"energy",value,"now")
    return true
}

//清空能量
export const emptyEnergy:EffectFunc = (event,_effect)=>{
    const {source,medium,target} = event
    if(target instanceof Player == false) return;
    changeStatusValue(source,medium,target,"energy",0,"now")
    return true
}
