import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { createStateByKey } from "@/core/objects/system/State";
import { isEntity } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";

export const getState:EffectFunc = (event,effect)=>{
    const {source,medium,target} = event

    // 状态只能添加到实体对象上
    if (!isEntity(target)) {
        newError(["状态效果只能作用于实体对象，当前目标类型:", target.participantType])
        return
    }

    //创建状态对象
    // const stateInfo = effect.info.state
    // const state = createStateByKey(stateInfo.key,stateInfo.stacks)
    // //来源使得目标获得状态
    // if(state){
    //     addStateToTarget(source,medium,target,state)
    // }
}