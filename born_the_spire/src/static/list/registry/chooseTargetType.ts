import { nowBattle } from "@/core/objects/game/battle";
import { nowPlayer } from "@/core/objects/game/run";
import { Entity } from "@/core/objects/system/Entity";
import { Target } from "@/core/objects/target/Target";

// type RegistryItem = (target:Entity[])=>boolean

//选择目标的约束函数注册表
const chooseTargetType = {
    "self":(target:Entity[])=>selectTarget(target,1,(target)=>target === nowPlayer),
} as const

export type TargetType = {
    faction?:"player"|"enemy"|"all",//可选的阵营,默认为敌方
    number?:number|"all",//可选的数量,默认为1
    key?:keyof typeof chooseTargetType,//判断关键字
}

//根据targetType来判断当前场上哪些对象满足key对应的约束函数要求
export function getSpecificTargetsByTargetType(targetType:TargetType&{key:string}):Target[]{
    let nowTargetArr:Target[]
    //先看阵营
    switch(targetType?.faction){
        case "player":
            nowTargetArr = nowBattle.value?.getTeam("player") ?? []
            break;
        case "all":
            const enemy = nowBattle.value?.getTeam("enemy") ?? []
            const player = nowBattle.value?.getTeam("player") ?? []
            nowTargetArr = [...player,...enemy]
            break;
        default:
            nowTargetArr = nowBattle.value?.getTeam("enemy") ?? []
    }
    //然后获得key对应的约束函数
    
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
    if(target.length > number){
        console.log(`选择数量不正确，只能选择${number}个对象`)
    }
    
    return target.length <= number
}