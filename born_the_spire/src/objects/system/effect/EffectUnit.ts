import { getFromEffectMap } from "@/static/list/system/effectMap"
import { createEffectByUnit, Effect } from "./Effect"

type EffectParams = number


// 效果单元类型
export interface EffectUnit{
    key:string,//效果关键字
    describe?:string[]//解释型描述，并不会直接显示
    params:Record<string,EffectParams>,//效果需要使用的参数
}

//通过effectUnit创建effect对象
export function getEffectByUnit(unit:EffectUnit):Effect{
    //从map中获取效果函数
    const data = getFromEffectMap(unit)
    //构建effect对象
    const effectObj =  createEffectByUnit(unit,data.effect,data.label)
    return effectObj
}