import { CurrentMap } from "./currentMap";
import { kill } from "@/core/hooks/chara";
import { Chara } from "@/core/objects/target/Target";

export const healthMap:CurrentMap<Chara> = {
    maxBy:"max-health",//上限值
    minBy:0,//下限值
    //达到下限时触发死亡事件
    reachMin:(event,ownner)=>{
        kill(event,ownner,{reason:"生命值达到下限"})
    }
}