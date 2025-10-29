
import { Card } from "@/core/objects/item/Card"
import { ItemMap } from "@/core/objects/item/Item"

export type CardMap = ItemMap & {
    status:{
        cost:number|null
    }
    entry?:string[],
}

const cardList:CardMap[] = [{
    label:"打击",
    status:{
        damage:5,
        cost:1,
    },
    describe:[
        "造成",{key:["status","damage"]},"点伤害"
    ],
    key:"original_card_00001",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:5},
            }]
        }
    }
},{
    label:"消耗打击",
    status:{
        damage:15,
        cost:1,
    },
    entry:["exhaust"],
    describe:[
        "造成",{key:["status","damage"]},"点伤害"
    ],
    key:"original_card_00002",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:15},
            }]
        }
    }
},{
    label:"虚无打击",
    status:{
        damage:15,
        cost:1,
    },
    entry:["void"],
    describe:[
        "造成",{key:["status","damage"]},"点伤害"
    ],
    key:"original_card_00003",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:15},
            }]
        }
    }
},{
    label:"肌肉强化",
    status:{
        power:1,
        cost:0
    },
    entry:["exhaust"],
    describe:["获得",{key:["status","power"]},"层力量"],
    key:"original_card_00004",
    interaction:{
        use:{
            target:{faction:"player",key:"self"},
            effects:[{
                key:"getStatus",
                params:{statusKey:"power",stacks:1},
            }]
        }
    }
},{
    label:"旋风斩",
    status:{
        cost:1,
        damage:3
    },
    describe:["对敌方全体造成",{key:["status","damage"]},"点伤害"],
    key:"original_card_00005",
    interaction:{
        use:{
            target:{number:"all"},
            effects:[{
                key:"damage",
                params:{value:3},
            }]
        }
    }
},{
    label:"末日",
    status:{
        cost:3,
        damage:999,
    },
    describe:["对所有人造成",{key:["status","damage"]},"点伤害"],
    key:"original_card_00006",
    interaction:{
        use:{
            target:{faction:"all"},
            effects:[{
                key:"damage",
                params:{value:999},
            }]
        }
    }
}]

export function getCardByKey(key:string){
    const data = cardList.find(value=>value.key == key)
    if(!data)throw new Error("不存在的卡牌")
    const card = new Card(data)
    return card
}