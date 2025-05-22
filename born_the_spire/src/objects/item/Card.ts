import { CardMap } from "@/static/list/item/cardList";
import { Target } from "@/objects/target/Target";
import { Item } from "./Item";
import { doBehavior } from "@/static/list/system/behaviorList";

export class Card extends Item{
    constructor(map:CardMap){
        super(map)
    }
    //对目标使用卡牌
    useCard(ownner:Target,target:Target){
        doBehavior("useCard",ownner,this,target)
    }
}