import { Card } from "@/core/objects/item/Card"
import { newError } from "@/ui/hooks/global/alert"

//将卡牌从一个牌堆放到另一个牌堆
export function cardMove(from:Card[],card:Card,to:Card[]){
    if(!card){newError(["没有指定移动的卡牌！"])}
    if(!from || !to){newError(["没有指定来源牌堆或目标牌堆！"])}
    const index = from.findIndex(tmp=>tmp.__id==card.__id)
    if(index >=0 ){
        //进入目标牌堆
        to.push(card)
        //从来源牌堆删除
        from.splice(index,1)
        console.log("移动卡牌后的来源数量和目标数量",from.length,to.length)
        return true
    }
    
    newError(["没有在来源牌堆找到目标卡牌！"])
}

//打乱牌堆
export function washPile(pile:Card[]){
    
}