import { Potion } from "@/core/objects/item/Subclass/Potion";
import { ItemMap } from "@/core/objects/item/Item";

export type PotionMap = ItemMap & {
    targetType:"player"|"enemy"|"all",
    canDrop?: boolean  // 是否可丢弃，默认 true
}

const potionList:PotionMap[] = [
    // 简单药水 - 单个 use
    {
        label:"生命药剂",
        status:{
            "heal":10
        },
        describe:["恢复",{key:["status","heal"]}],
        targetType:"player",
        key:"original_potion_00001",
        interaction:{
            use:{
                label: "饮用",
                target: {key: "self"},
                effects: [{
                    key: "heal",
                    params: {value: 10}
                }]
            }
        }
    },
    // 爆炸药水 - 多个 use
    {
        label:"爆炸药水",
        status:{
            "heal":10,
            "damage":15
        },
        describe:["饮用恢复",{key:["status","heal"]},"或投掷造成",{key:["status","damage"]},"伤害"],
        targetType:"all",
        key:"original_potion_00002",
        interaction:{
            use:[
                {
                    label: "饮用",
                    target: {key: "self"},
                    effects: [{
                        key: "heal",
                        params: {value: 10}
                    }]
                },
                {
                    label: "投掷",
                    target: {faction: "enemy"},
                    effects: [{
                        key: "damage",
                        params: {value: 15}
                    }]
                }
            ]
        }
    },
    // 诅咒药水 - 无法丢弃
    {
        label:"诅咒药水",
        status:{
            "damage":5
        },
        describe:["无法丢弃！饮用受到",{key:["status","damage"]},"伤害"],
        targetType:"player",
        canDrop: false,  // 无法丢弃
        key:"original_potion_00003",
        interaction:{
            possess:{
                target: {key: "self"},
                effects: [],
                // 持有时的负面效果（可以添加）
            },
            use:{
                label: "勉强饮用",
                target: {key: "self"},
                effects: [{
                    key: "damage",
                    params: {value: 5}
                }]
            }
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