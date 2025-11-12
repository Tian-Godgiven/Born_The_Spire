import { showQuickInfo } from "@/ui/hooks/global/quickInfo"
import { Player } from "../objects/target/Player"
import { EffectFunc } from "../objects/system/effect/EffectFunc"
import { changeStatusValue, getStatusValue } from "../objects/system/status/Status"

//消耗玩家的能量
export const costEnergy:EffectFunc<boolean> = (event,effect)=>{
    const {source,medium,target} = event
    if(target instanceof Player == false) return false;
    const cost = effect.params.cost as number
    //只有玩家对象具备卡牌
    const ifEnough = checkEnergy(cost,target)
    if(ifEnough){
        const energy = getStatusValue(target,"energy")
        const newEnergy = energy - cost
        changeStatusValue(target,"energy",newEnergy)
        // changeStatusValue(source,medium,target,"energy",newEnergy,"now")//未完成，应该添加修饰器的
    }
    else{
        showQuickInfo("能量不足")
        return false
    }
    return true
}

//玩家支付费用：事件的来源扣除费用
export const pay_costEnergy:EffectFunc<boolean> = (event,effect)=>{
    const {source,medium} = event
    if(source instanceof Player == false) return false;
    const cost = effect.params.cost as number
    //只有玩家对象具备卡牌
    const ifEnough = checkEnergy(cost,source)
    if(ifEnough){
        const energy = getStatusValue(source,"energy")
        const newEnergy = energy - cost
        changeStatusValue(source,"energy",newEnergy)
        // changeStatusValue(source,medium,target,"energy",newEnergy,"now")//未完成，应该添加修饰器的
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
    const energy = getStatusValue(target,"energy",0)
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
        // value = getStatusValue("max-energy")
    }
    //获得指定的值+当前值
    else{
        // value = target.status.getStatusValue("energy") + energy
    }
    // source.changeStatusValue("energy",value)
        // changeStatusValue(source,medium,target,"energy",newEnergy,"now")//未完成，应该添加修饰器的
    return true
}

//清空能量
export const emptyEnergy:EffectFunc = (event,_effect)=>{
    const {source,medium,target} = event
    if(target instanceof Player == false) return;
    // source.changeStatusValue("energy",0)
        // changeStatusValue(source,medium,target,"energy",newEnergy,"now")//未完成，应该添加修饰器的
    return true
}
