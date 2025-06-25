import { CardMap } from "@/static/list/item/cardList";
import { Target } from "@/objects/target/Target";
import { Item } from "./Item";
import { doBehavior, doBehaviorGroup } from "@/objects/system/Behavior";
import { CardPiles, Player } from "../target/player/Player";
import { costEnergy } from "../../static/list/system/behavior/energy";
import { getStatusValue } from "../system/Status";
import { isEqual } from "lodash";
import { newError } from "@/hooks/global/alert";
import { Entity } from "../system/Entity";

export class Card extends Item{
    public entry:string[] = []
    constructor(map:CardMap){
        super(map)
        this.entry.push(...map.entry??[])
    }
    haveEntry(entry:string){
        if(this.entry.includes(entry)){
            return true
        }
        return false
    }
}

//对目标使用卡牌
export function useCard(card:Card,fromPile:Card[],source:Player,target:Target){
    //消耗费用
    const cost = getStatusValue(card,"cost")
    if(costEnergy(card,card,source,cost)){
        doBehavior("useCard",source,card,target,{fromPile})
        //处理使用后的卡牌
        afterUseCard(card,fromPile,source,target)
    }
}

//处理使用后的卡牌,根据不同的词条执行不同行为
export function afterUseCard(card:Card,fromPile:Card[],ownner:Player,_target:Target){
    //消耗词条
    if(card.haveEntry("exhaust")){
        //将其消耗
        exhaustCard(fromPile,card,ownner,card)
    }
    else{
        //移入弃牌堆
        discardCard(fromPile,card,ownner,card)
    }
}

//从抽牌堆中抽取n张卡牌,这是一个行为
export function drawCardFromDrawPile(player:Player,number:number,medium:Entity){
    const drawPile = player.cardPiles.drawPile
    const length = drawPile.length
    //抽牌堆数量不足
    if(length < number){
        //先抽足够的数量，将抽牌堆清空
        drawBehavior(length)
        //弃牌堆填充抽牌堆
        player.fullDrawPile()
        //如果填充后还是不足，报一个信息
        if(drawPile.length < number-length){
            console.log("牌堆都抽空了")
            return;
        }
        //再抽剩余数量
        drawBehavior(number-length)
    }
    else{
        drawBehavior(number)
    }
    
    function drawBehavior(number:number){
        //获得抽牌堆的前n张卡牌
        const cards = drawPile.slice(0,number)
        //进行一个行为，使得玩家获得这n张卡牌
        doBehaviorGroup("drawFromDrawPile","drawCard",player,medium,cards,{drawNumber:number},(player,_medium,card)=>{
            //将指定卡牌移动到手牌堆
            cardMove(drawPile,card,player.cardPiles.handPile)
        })
    }
    
}

//抽取指定卡牌到手牌中
export function drawCard(fromPile:Card[],card:Card,player:Player,medium:Entity){
    doBehavior("drawCard",player,medium,card,{},()=>{
        cardMove(fromPile,card,player.cardPiles.drawPile)
    })
}

//丢弃卡牌，使得一张卡牌进入玩家的弃牌堆
export function discardCard(fromPile:Card[],card:Card,player:Player,medium:Entity){
    //从来源牌堆删除该卡牌
    const index = fromPile.findIndex(tmp=>isEqual(card,tmp))
    if(index>=0){
        //进行丢弃卡牌行为
        doBehavior("discard",player,medium,card,{},()=>{
            //将其放进玩家对象的弃牌堆
            player.cardPiles.discardPile.push(card)
            //从牌堆中删除该卡牌
            fromPile.splice(index,1)
        })
    }
    else{
        newError(["没有在来源牌堆中找到这张卡牌",fromPile,card])
    }
}
//丢弃玩家指定的牌堆中的所有牌
export function discardAllPile(player:Player,pileName:keyof CardPiles,medium:Entity){
    const pile = player.cardPiles[pileName]
    //仅触发一个行为，但会触发每个卡牌的过程事件
    doBehaviorGroup("discardAllPile","discard",player,medium,pile,{pileName},(_source,_medium,card)=>{
        //进入弃牌堆
        player.cardPiles.discardPile.push(card)
        //从牌堆中删除卡牌
        const index = pile.findIndex(tmp=>isEqual(tmp,card))
        pile.splice(index,1)
    })
}
//因回合结束而丢弃卡牌
export function turnEndDiscardCard(pile:Card[],card:Card,player:Player){
    //如果卡牌具备虚无词条，则会进入消耗堆
    if(card.haveEntry("void")){
        exhaustCard(pile,card,player,card)
    }
    //否则进入弃牌堆
    else{
        discardCard(pile,card,player,player)
    }
}

//消耗卡牌，使得一张卡牌进入玩家的消耗堆
export function exhaustCard(fromPile:Card[],card:Card,player:Player,medium:Entity){
    //从来源牌堆删除该卡牌
    const index = fromPile.findIndex(tmp=>isEqual(card,tmp))
    if(index>=0){
        //进行丢弃卡牌行为
        doBehavior("discard",player,medium,card,{},()=>{
            //将其放进玩家对象的消耗堆
            player.cardPiles.exhaustPile.push(card)
            //从牌堆中删除该卡牌
            fromPile.splice(index,1)
        })
    }
    else{
        newError(["没有在来源牌堆中找到这张卡牌",fromPile,card])
    }
}

//将卡牌从一个牌堆放到另一个牌堆
export function cardMove(from:Card[],card:Card,to:Card[]){
    const index = from.findIndex(tmp=>tmp==card)
    if(index >=0 ){
        //进入手牌堆
        to.push(card)
        //从来源牌堆删除
        from.splice(index,1)
    }
}