import { PotionMap } from "@/core/objects/item/Subclass/Potion";

export const potionList:PotionMap[] = [
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
    },
    // 火焰药水
    {
        label:"火焰药水",
        status:{
            "damage":20
        },
        describe:["对单个目标造成",{key:["status","damage"]},"点伤害"],
        targetType:"enemy",
        key:"original_potion_00004",
        interaction:{
            use:{
                label: "投掷",
                target: {faction: "enemy"},
                effects: [{
                    key: "damage",
                    params: {value: 20}
                }]
            }
        }
    },
    // 瓶中精灵 - 无法使用（等待战斗系统完善）
    {
        label:"瓶中精灵",
        status:{
            "reviveHealth":30
        },
        describe:["死亡时以",{key:["status","reviveHealth"]},"点生命值复活（当前无法使用，等待战斗系统完善）"],
        targetType:"player",
        canDrop: false,  // 无法丢弃
        key:"original_potion_00005",
        interaction:{
            // 暂无 use 交互，无法主动使用
            // 未来实现：possess 时添加触发器，监听死亡事件并复活
        }
    }
]

//获取药水对象
export async function getPotionByKey(potionKey:string){
    const { Potion } = await import("@/core/objects/item/Subclass/Potion")
    //获取数据
    const map = potionList.find(item=>item.key == potionKey)
    if(!map){
        throw new Error(`不存在的药水key${potionKey}`)
    }
    //生成药水对象
    const potion = new Potion(map)
    return potion
}