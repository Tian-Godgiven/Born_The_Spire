
import { Card } from "@/objects/Card"
import { Describe } from "@/hooks/express/describe"
import { EffectMap } from "./effectList"

export type CardMap = {
    label:string,
    describe:Describe,
    key:string,
    effects:EffectMap[]
}

const cardList:CardMap[] = [
    {
        label:"打击",
        describe:[
            "造成",
            {
                key:["effects","damage","value"]
            },
            "点伤害"
        ],
        key:"original_card_00001",
        effects:[
            {
                key:"damage",
                value:5,
                targetType:"enemy"
            }
        ]
    }
]

export function getCardByKey(key:string){
    const data = cardList.find(value=>value.key == key)
    if(!data)throw new Error("不存在的卡牌")
    const card = new Card(data)
    return card
}