import { changeStateStack, getStateStack,StateData} from "@/objects/target/State"

export const stateList:StateData[] = [
{
    label:"力量",
    key:"power",
    describe:["造成的伤害提高"],
    showType:"number",
    repeate:"stack",
    behavior:[
    //造成伤害时，使得伤害值提升等同状态层数
    {
        when:"before",
        how:"make",
        key:"damage",
        callback:(getter,_state,{effect})=>{
            const stack = getStateStack(getter,"power")
            if(stack&&effect){
                effect.value.now += stack
            }
        }
    },
    //回合结束时，当前层数-1
    {
        when:"after",
        how:"on",
        key:"turnEnd",
        callback:(getter,state)=>{
            //当前层数
            const stack = getStateStack(getter,state.key)
            if(stack){
                changeStateStack(stack-1,getter,state.key)
            }
        }
    }]
}
]