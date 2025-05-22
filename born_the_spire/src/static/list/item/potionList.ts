import { Potion } from "@/objects/item/Potion";
import { ItemMap } from "@/objects/item/Item";

export type PotionMap = ItemMap & {
    targetType:"player"|"enemy"|"all",
}

const potionList:PotionMap[] = [
    {
        label:"生命药剂",
        status:{
            "original_status_00003":10
        },
        describe:["恢复",{key:["status","heal"]}],
        targetType:"player",
        key:"original_potion_00001",
        behavior:{
            use:[{
                "value":10,
                "targetType":"player",
                "key":"heal"
            }]
        }
        
    }
]

//获取药水对象
export function getPotionByKey(potionKey:string):Potion{
    //获取数据
    const map = potionList.find(item=>item.key == potionKey)
    if(!map){
        throw new Error(`不存在的药水key${potionKey}`)
    }
    //生成药水对象
    const potion = new Potion(map)
    return potion
}