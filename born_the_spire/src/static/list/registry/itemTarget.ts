import { nowPlayer } from "@/objects/game/run";
import { Entity } from "@/objects/system/Entity";

type RegistryItem = (target:Entity[])=>boolean

//选择目标的约束函数注册表
const itemTargetMap = {
    "self":(target:Entity[])=>selectTarget(target,1,(target)=>target === nowPlayer),
} as const

export type ItemTarget = {
    faction?:"player"|"enemy",//可选的阵营,默认为敌方
    number?:number|"all",//可选的数量,默认为1
    key?:keyof typeof itemTargetMap,//判断关键字
}

function selectTarget(target:Entity[],number:number,allSelect:(target:Entity)=>boolean){
    if(!limitNumber(target,number)){
        return false;
    }
    //要求所有对象都满足allSelect的条件
    target.map(entity=>{
        if(!allSelect(entity)){
            console.log(entity,`不符合条件`)
            return false
        }
    })
    return true
}
function limitNumber(target:Entity[],number:number){
    console.log(`选择数量不正确，只能选择${number}个对象`)
    return target.length == number
}