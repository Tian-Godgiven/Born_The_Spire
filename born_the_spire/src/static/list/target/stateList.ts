import { createTrigger } from "@/objects/system/Trigger"
import { changeStateStack, getStateStack,StateData} from "@/objects/target/State"

export const stateList:StateData[] = [
{
    label:"力量",
    key:"power",
    describe:["造成的伤害提高"],
    showType:"number",
    repeate:"stack",
    effect:(getter,state)=>{
        //返回获得者状态者将会获得的触发器
        return createTrigger({
            when:"before",
            how:"make",
            key:"damage",
            sourceKey:state.key,
            //使得damage增加获得者当前的力量层数
            callback:({effect})=>{
                const stack = getStateStack(getter,"power")
                if(stack&&effect){
                    effect.value.now += stack
                }
            }
        })
    },
    behavior:{
        turnEnd:(getter,state)=>{
            //当前层数
            const stack = getStateStack(getter,state.key)
            if(stack){
                changeStateStack(stack-1,getter,state.key)
            }
        }
    }
}
]