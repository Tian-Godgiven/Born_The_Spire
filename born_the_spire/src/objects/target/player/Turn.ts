

type TurnEnd = {
    discard:{
        type:"all"
    }|{
        type:"choose"|"random",//选择或随机选择丢弃卡牌
        number:number
    }
}
type TurnStart = {
    getEnergy:number|"max",
    drawCard:number
}
export type TurnMap = {
    end:TurnEnd,
    start:TurnStart
}

//回合对象，回合对象是玩家角色回合行为的媒介
//包括：回合开始时抽牌和回复能量，回合结束时弃掉所有手牌
export class Turn{
    public status:{
        end:TurnEnd,
        start:TurnStart
    } = {
        end:{
            discard:{type:"all"}//弃牌数量
        },
        start:{
            getEnergy:"max",//获得能量数量
            drawCard:5//抽牌数量
        }
    }
    constructor(map:TurnMap){
        this.status.end = map.end
        this.status.start = map.start
    }
}

