import { showQuickInfo } from "@/ui/hooks/global/quickInfo"
import { Player } from "../objects/target/Player"
import { EffectFunc } from "../objects/system/effect/EffectFunc"
import { getStatusValue } from "../objects/system/status/Status"
import { changeCurrentValue, getCurrentValue } from "../objects/system/Current/current"

//消耗玩家的能量
export const costEnergy:EffectFunc<boolean> = (event,effect)=>{
    const {target} = event
    if(target instanceof Player == false) return false;
    const cost = effect.params.cost as number
    //只有玩家对象具备卡牌
    const ifEnough = checkEnergy(cost,target)
    if(ifEnough){
        const energy = getCurrentValue(target,"energy")
        const newValue = energy - cost
        changeCurrentValue(target,"energy",newValue,event)
    }
    else{
        showQuickInfo("能量不足")
        return false
    }
    return true
}

//支付费用：由事件的来源支付费用
export const pay_costEnergy:EffectFunc<boolean> = (event,effect)=>{
    const {source} = event
    if(source instanceof Player == false) return false;
    const cost = effect.params.cost as number
    //只有玩家对象具备卡牌
    const ifEnough = checkEnergy(cost,source)
    if(ifEnough){
        const energy = getCurrentValue(source,"energy")
        const newEnergy = energy - cost
        changeCurrentValue(source,"energy",newEnergy,event)
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
    const energy = getCurrentValue(target,"energy",0)
    if(energy >= cost){
        return true
    }
    return false
}

//获取指定量的能量
export const getEnergy:EffectFunc = (event,effect)=>{
    const {target} = event
    if(target instanceof Player == false) return;
    let value:number = 0
    //目标值
    const energy = effect.params.value as "max"|number
    //修改当前值为max属性
    if(energy == "max"){
        value = getStatusValue(target,"max-energy",0)
    }
    //获得指定的值+当前值
    else{
        value = getCurrentValue(target,"energy") + energy
    }
    changeCurrentValue(target,"energy",value,event)
    return true
}

//清空能量
export const emptyEnergy:EffectFunc = (event,_effect)=>{
    const {target} = event
    if(target instanceof Player == false) return;
    changeCurrentValue(target,"energy",0,event)
    return true
}
