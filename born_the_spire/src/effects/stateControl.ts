import { ActionEvent } from "@/objects/system/ActionEvent";
import { Effect } from "@/objects/system/Effect";
import { addStateToTarget, createStateByKey } from "@/objects/system/State";

export function getStateByEffect(event:ActionEvent,effect:Effect){
    const {source,medium,target} = event
    //创建状态对象
    const stateInfo = effect.info.state
    const state = createStateByKey(stateInfo.key,stateInfo.stacks)
    //来源使得目标获得状态
    if(state){
        addStateToTarget(source,medium,target,state)
    }
}