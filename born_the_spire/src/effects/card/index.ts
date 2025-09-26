import { Card } from "@/objects/item/Card"

//将卡牌从一个牌堆放到另一个牌堆
export function cardMove(from:Card[],card:Card,to:Card[]){
    if(!card){throw new Error("没有指定移动的卡牌！")}
    if(!from || !to){throw new Error("没有指定来源牌堆或目标牌堆！")}
    const index = from.findIndex(tmp=>tmp==card)
    if(index >=0 ){
        //进入目标牌堆
        to.push(card)
        //从来源牌堆删除
        from.splice(index,1)
        return true
    }
    throw new Error("没有在来源牌堆找到目标卡牌！")
    return false
}