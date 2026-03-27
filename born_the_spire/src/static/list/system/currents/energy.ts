import type { Player } from "@/core/objects/target/Player";
import type { CurrentMap } from "@/core/types/CurrentMapData";

export const energyMap:CurrentMap<Player> = {
    startValue:0,
    minBy:0,
    triggers:[{
        //回合开始时，获得最大值能量
        key:"turnStart",
        "how":"take",
        "when":"after",
        importantKey:"turnStart_recoverEnergy",
        action:"recoverEnergy"
    },{
        //回合结束时，清空当前能量
        key:"turnEnd",
        how:"take",
        when:"after",
        importantKey:"turnEnd_emptyEnergy",
        action:"emptyEnergy"
    }]
}