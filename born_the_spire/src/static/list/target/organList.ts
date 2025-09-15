import { Describe } from "@/hooks/express/describe"
import { Organ } from "@/objects/target/Organ"
import { TargetMap } from "@/objects/target/Target"
import { EffectUnit } from "../system/effectMap"
import { ItemMap } from "@/objects/item/Item"
export type OrganMap = ItemMap&TargetMap&{
    label:string,
    key:string,
    describe?:Describe,
    behavior?:{
        getOrgan?:EffectUnit[]
    }
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
        behavior:{
            getOrgan:[{
                key:"take_reduce_damage",
                value:1,
                targetType:"self"
            }]
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