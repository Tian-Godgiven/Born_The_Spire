import { CharaMap } from "@/core/objects/target/Target"

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
            "max-health":50,//最大生命值
            "max-energy":3,//最大能量
        },
        potion:{
            max:3,
            now:["original_potion_00001"]
        },
        organ:["original_organ_00001"],
        card:[  "original_card_00001",
                // "original_card_00002",
                // "original_card_00003",
                "original_card_00005",
                "original_card_00006",
                "original_card_00007",
                // "original_card_00004"
            ],
    }
}