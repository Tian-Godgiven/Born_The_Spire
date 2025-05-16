import { Describe } from "@/hooks/express/describe"
import { Organ } from "@/objects/Organ"
import { Target } from "@/objects/Target"
export type OrganMap = {
    label:string,
    key:string,
    describe?:Describe,
    onGet?:(who:Target)=>void
}

export const organList:OrganMap[] = [
    {
        label:"心脏",
        key:"original_organ_00001",
    },{
        label:"石芯",
        key:"original_organ_00002",
    },{
        label:"石肤",
        key:"original_organ_00003",
        describe:["受到的伤害值-1"],
        onGet:(who)=>{
            //受到伤害前，伤害值-1
            who.getTrigger("before","take","damage",(_s,_t,e)=>{
                console.log(e)
                e.value.now -= 1
            })
        }
    }
]

//通过key来获取器官对象
export function getOrganByKey(key:string):Organ{
    const data = organList.find(value=>value.key==key)
    if(!data)throw new Error("没有该器官对象")
    const organ = new Organ(data)
    return organ
}