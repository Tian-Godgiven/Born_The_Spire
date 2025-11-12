import { Describe } from "@/ui/hooks/express/describe"
import { Organ } from "@/core/objects/target/Organ"
import { TargetMap } from "@/core/objects/target/Target"
import { ItemMap } from "@/core/objects/item/Item"

export type OrganMap = ItemMap&TargetMap&{
    label:string,
    key:string,
    describe?:Describe,
}

export const organList:OrganMap[] = [
    {
        label:"心脏",
        key:"original_organ_00001",
        interaction:{}
    },{
        label:"石芯",
        key:"original_organ_00002",
        describe:["最大生命+3"],
        interaction:{
            get:{
                "target":{"key":"self"},
                effects:[{
                    "key":"addStatusBase",
                    params:{value:3,statusKey:"max-health"},
                    "describe":["最大生命+3"],
                }]
            }
        },

    },{
        label:"石肤",
        key:"original_organ_00003",
        describe:["受到的伤害值-1"],
        interaction:{},
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