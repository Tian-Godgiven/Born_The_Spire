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
}
export const playerList:Record<string,PlayerMap> = {
    "default":{
        label:"你",
        key:"original_chara_00001",
        money:{
            "original_money_00001":100,
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
        card:["original_card_00001"],
        trigger:{}
    }
}