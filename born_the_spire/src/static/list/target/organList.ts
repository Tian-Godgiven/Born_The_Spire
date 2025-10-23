import { Describe } from "@/ui/hooks/express/describe"
import { Organ } from "@/core/objects/target/Organ"
import { TargetMap } from "@/core/objects/target/Target"
import { ItemMap } from "@/core/objects/item/Item"
import { EffectUnit } from "@/core/objects/system/effect/EffectUnit"

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
        trigger:[{
            how:"via",
            key:"getOragn",
            event:[{
                key:"protect",
                label:"石肤防护",
                targetType:"eventTarget",
                effect:[
                    {key:"take_reduce_damage",params:{value:1}}
                ]
            }]
        }]
        
    }
]

//通过key来获取器官对象
export function getOrganByKey(key:string):Organ{
    const data = organList.find(value=>value.key==key)
    if(!data)throw new Error("没有该器官对象")
    const organ = new Organ(data)
    return organ
}