import type { Player } from "@/core/objects/target/Player";
import { CurrentMap } from "@/core/types/CurrentMapData";

export const energyMap:CurrentMap<Player> = {
    startValue:0,
    minBy:0,
    triggers:[{
        //回合开始时，获得最大值能量
        key:"turnStart",
        "how":"take",
        "when":"after",
        importantKey:"turnStart_recoverEnergy",
        "event":[{
            key:"turnStart_recoverEnergy",
            label:"回合开始时恢复能量",
            "effect":[{
                "key":"getEnergy",
                params:{
                    value:"max",
                }
            }],
            "targetType":"triggerOwner",
        }],
    },{
        //回合结束时，清空当前能量
        key:"turnEnd",
        how:"take",
        when:"after",
        importantKey:"turnEnd_emptyEnergy",
        event:[{
            key:"turnEnd_emptyEnergy",
            label:"回合结束时清空能量",
            "effect":[{
                "key":"emptyEnergy",
                params:{}
            }],
            "targetType":"triggerOwner",
        }],
    }]
}