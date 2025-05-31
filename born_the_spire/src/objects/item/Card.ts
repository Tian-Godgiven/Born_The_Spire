import { CardMap } from "@/static/list/item/cardList";
import { Target } from "@/objects/target/Target";
import { Item } from "./Item";
import { doBehavior, doBehaviorGroup } from "@/static/list/system/behaviorList";
import { CardPiles, costEnergy, Player } from "../target/Player";
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
export function afterUseCard(card:Card,fromPile:Card[],ownner:Player,target:Target){
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