import { TurnMap } from "@/objects/target/player/Turn"
import { CharaMap } from "@/objects/target/Target"

export type PlayerMap = CharaMap & {
    key:string
    money:Record<string,number>,
    potion:{
        max:number,
        now:string[]
    }
    organ:string[]
    card:string[],
    turn:TurnMap
}
export const playerList:Record<string,PlayerMap> = {
    "default":{
        label:"你",
        key:"original_chara_00001",
        money:{
            "original_money_00001":100,
        },
        turn:{
            end:{
                "discard":{
                    type:"all"
                }
            },
            start:{
                "drawCard":5,
                "getEnergy":3
            }
        },
        status:{
            //生命值
            "health":50,
            //能量
            "energy":3
        },
        potion:{
            max:3,
            now:["original_potion_00001"]
        },
        organ:["original_organ_00001"],
        card:["original_card_00001","original_card_00001","original_card_00001","original_card_00001","original_card_00001","original_card_00001","original_card_00001","original_card_00001","original_card_00002","original_card_00003"],
        trigger:{}
    }
}