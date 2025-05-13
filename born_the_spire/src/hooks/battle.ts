import { Card } from "@/class/Card"
import { ref } from "vue"
import { nowPlayer } from "./run"

export type Battle = {
    handCards:Card[],//手牌
    drawGroup:Card[],//抽牌堆
    discardGroup:Card[],//弃牌堆
    exhaustGroup:Card[],//消耗牌堆
    turn:number//当前回合
}

//当前的战斗
export const nowBattle = ref<Battle|null>(null)

//创建新的战斗
export function createNewBattle():Battle{
    const drawGroup = nowPlayer.value.getCardGroup()
    return {

    }
}