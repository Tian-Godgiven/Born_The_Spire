import { getFromEffectMap } from "@/static/list/system/effectMap"
import { createEffectByUnit, Effect } from "./Effect"
import { EffectParams } from "./EffectFunc"
import { ActionEvent } from "../ActionEvent"


// 效果单元类型，这是效果对象存储在JSON中的格式
export interface EffectUnit{
    key:string,//效果关键字
    params:EffectParams,//效果需要使用的参数
    describe?:string[]//解释型描述，并不会直接显示
    resultStoreAs?:string//该效果的返回值会存放在事件的_results的指定key下面
}

//通过effectUnit创建effect对象
export function getEffectByUnit(event:ActionEvent,unit:EffectUnit):Effect{
    //从map中获取效果函数
    const data = getFromEffectMap(unit)
    //构建effect对象
    return createEffectByUnit(event,unit,data.effect,data.label)
}