import { nowBattle } from "@/core/objects/game/battle";
import { nowPlayer } from "@/core/objects/game/run";
import { Entity } from "@/core/objects/system/Entity";
import { Target } from "@/core/objects/target/Target";
import { newError } from "@/ui/hooks/global/alert";

type RegistryItem = (target:Entity)=>boolean
interface RegistryValue{
    (targets:Entity[],ifFilter:false):boolean,
    (targets:Entity[],ifFilter:true):Target[],
}

//选择目标的约束函数注册表
const chooseTargetType:Record<string,(targets:Target[],ifFilter:boolean)=>boolean|Target[]> = {
    "self":(targets:Target[],ifFilter:boolean)=>{
        const func = (t:Target)=>t === nowPlayer.getSelf()
        console.log(targets,ifFilter)
        if(ifFilter){
            console.log(targets)
            return targets.filter(t=>func(t))
        }
        return selectTarget(targets,func,1)
    },
}

//示例注册“选择非自身”的1个目标类型
// registeChooseTargetType({
//     key:"self",
//     func:(target)=>target !== nowPlayer.getSelf(),
//     number:1
// })
//为注册表添加约束函数
export function registeChooseTargetType({key,func,number}:{key:string,func:RegistryItem,number?:number}){
    chooseTargetType[key] = (targets:Target[],ifFilter:boolean)=>{
        //过滤函数,得到满足条件的对象
        if(ifFilter){
            return targets.filter(t=>func(t))
        }
        //验证函数,判断这些对象是否都满足条件
        else{
            return selectTarget(targets,func,number)
        }
    }
}

export type TargetType = {
    faction?:"player"|"enemy"|"all",//可选的阵营,默认为敌方
    number?:number|"all",//可选的数量,默认为1
    key?:keyof typeof chooseTargetType,//判断关键字
}

//根据targetType来判断当前场上哪些对象满足key对应的约束函数要求
export function getSpecificTargetsByTargetType(targetType:TargetType&{key:string}):Target[]{
    let nowTargetArr:Target[]
    //先按照阵营获取可选对象
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
    //过滤约束函数
    if(targetType?.key){
        const func = chooseTargetType[targetType.key] as RegistryValue
        console.log(func)
        if(!func){
            newError(["选择目标类型注册表中不存在指定key对应的约束函数",targetType.key])
        }
        //过滤可选目标
        console.log(nowTargetArr)
        nowTargetArr = func(nowTargetArr,true)
    }
    return nowTargetArr
    
}

// 判断targets是否满足条件
// func: 对每个对象的判断函数
// allSelect: 要求所有对象都满足func条件，否则返回空数组
function selectTarget(targets:Target[],func:(target:Target)=>boolean,number?:number):boolean{
    if(number && !limitNumber(targets,number)){
        return false;
    }
    //要求所有对象都满足allSelect的条件
    for(let t of targets){
        if(!func(t)){
            return false
            
        }
    }
    return true
}
function limitNumber(target:Target[],number:number){
    if(target.length > number){
        console.log(`选择数量不正确，只能选择${number}个对象`)
        return false
    }
    return true
}