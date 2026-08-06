import type { Player } from "@/core/objects/target/Player";
import type { CurrentMap } from "@/core/types/CurrentMapData";
import { TriggerLevel } from "@/core/objects/system/trigger/triggerLevel";

export const energyMap:CurrentMap<Player> = {
    startValue:0,
    minBy:0,
    triggers:[{
        //回合开始时，获得最大值能量
        //必须排在所有 turnStart 触发器最前面：能量恢复是赋值（设为 max-energy），
        //任何排在它前面的能量增益都会被它抹掉。三层顺序缺一不可——
        //  when:"before"      before 整批先于 after 整批
        //  how:"make"         同一 when 内 make 先于 via 先于 take
        //  level:FIRST        同一 how 列表内按 level 降序
        //别的内容想在回合开始加能量，挂 after 即可（默认就在它之后）
        key:"turnStart",
        "how":"make",
        "when":"before",
        level:TriggerLevel.FIRST,
        importantKey:"turnStart_recoverEnergy",
        action:"recoverEnergy"
    },{
        //回合结束时，清空当前能量
        //和上面那条是同一个道理的镜像：清空也是赋值（设为 0），
        //必须排在所有 turnEnd 触发器最后面，否则「回合结束获得能量」类效果会白给
        //  when:"after" + how:"take" + level:LAST 三层都占住末位
        key:"turnEnd",
        how:"take",
        when:"after",
        level:TriggerLevel.LAST,
        importantKey:"turnEnd_emptyEnergy",
        action:"emptyEnergy"
    }]
}