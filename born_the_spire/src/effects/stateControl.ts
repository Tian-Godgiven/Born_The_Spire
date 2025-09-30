import { EffectFunc } from "@/objects/system/effect/EffectFunc";
import { addStateToTarget, createStateByKey } from "@/objects/system/State";

export const getStateByEffect:EffectFunc = (event,effect)=>{
    const {source,medium,target} = event
    //创建状态对象
    const stateInfo = effect.info.state
    const state = createStateByKey(stateInfo.key,stateInfo.stacks)
    //来源使得目标获得状态
    if(state){
        addStateToTarget(source,medium,target,state)
    }
}