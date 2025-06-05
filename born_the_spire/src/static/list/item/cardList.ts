
import { Card } from "@/objects/item/Card"
import { ItemMap } from "@/objects/item/Item"
import { EffectKeyMap } from "../system/effectList"

export type CardMap = ItemMap & {
    entry?:string[],
    behavior:{
        useCard:EffectKeyMap[]
    }
}

const cardList:CardMap[] = [{
    label:"打击",
    status:{
        damage:5,
        cost:1,
    },
    describe:[
        "造成",
        {
            key:["status","damage"]
        },
        "点伤害"
    ],
    key:"original_card_00001",
    behavior:{
        useCard:[{
            key:"damage",
            value:5,
            targetType:"enemy"
        }]
    }
},{
    label:"消耗打击",
    status:{
        damage:15,
        cost:1,
    },
    entry:["exhaust"],
    describe:[
        "造成",
        {
            key:["status","damage"]
        },
        "点伤害"
    ],
    key:"original_card_00002",
    behavior:{
        useCard:[{
            key:"damage",
            value:5,
            targetType:"enemy"
        }]
    }
},{
    label:"虚无打击",
    status:{
        damage:15,
        cost:1,
    },
    entry:["void"],
    describe:[
        "造成",
        {
            key:["status","damage"]
        },
        "点伤害"
    ],
    key:"original_card_00003",
    behavior:{
        useCard:[{
            key:"damage",
            value:5,
            targetType:"enemy"
        }]
    }
}]

export function getCardByKey(key:string){
    const data = cardList.find(value=>value.key == key)
    if(!data)throw new Error("不存在的卡牌")
    const card = new Card(data)
    return card
}