import { Target } from "@/objects/Target"
import _, { isArray } from "lodash"

export type EffectMap = {
    key:string,
    value:number|[number,number],
    targetType:"player"|"enemy"|"all"
}

//通过effectMap获取effect
export function getEffectByMap(map:EffectMap):Effect{
    const data = effectList.find(tmp=>tmp.key == map.key)
    if(!data)throw new Error("没有找到目标效果")
    let value:Effect["value"] = {now:0}
    let valueType:Effect["valueType"] = "number"
    if(typeof map.value == "number"){
        return numberType(data,map.value)
    }
    else if(isArray(map.value)){
        return rangeType(data,map.value)
    }
    return {
        ...data,
        ...map,
        value,
        valueType
    }

    function numberType(data:EffectData,mapValue:number):Effect{
        valueType = "number"
        value = {
            now:mapValue
        }
        return {
            ...data,
            ...map,
            value,
            valueType
        }
    }
    function rangeType(data:EffectData,mapValue:[number,number]){
        valueType = "range"
        value = {
            min:mapValue[0],
            max:mapValue[1],
            now:0
        }
        return {
            ...data,
            ...map,
            value,
            valueType
        }
    }
    
}

export type Effect = {
    label:string,//效果名称
    key:string//效果关键词
    targetType:"player"|"enemy"|"all"//效果作用对象
    effect:(source:Target,target:Target,effect:Effect)=>void
}&({
    valueType:"range"//范围型
    value:{
        min:number,
        now:number
        max:number
    }//效果值
}|{
    valueType:"number"//数值型
    value:{now:number}//效果值
})
//触发效果
export function makeEffect(source:Target,target:Target,effectMap:EffectMap){
    const effect = getEffectByMap(effectMap)
    const effectFunc = effect.effect
    if(!effect)throw new Error("目标不存在")
    //获取效果值
    getEffectValue(effect)
    //造成效果前
    source.makeEffect("before",target,effect)
    target.takeEffect("before",source,effect)
    //造成效果
    effectFunc(source,target,effect)
    //造成效果后
    source.makeEffect("after",target,effect)
    target.takeEffect("after",source,effect)
}

type EffectData = {
    label:string,
    key:string,
    effect:(source:Target,target:Target,effect:Effect)=>void
}
//效果表
const effectList:EffectData[] = [{
    //造成伤害
    label:"造成伤害",
    key:"damage",
    effect:(_source,target,effect)=>{
        //目标的当前生命值减少value值
        const health = target.getStatusByKey("original_status_00001")
        if(health.valueType == "max"){
            health.value.now -= effect.value.now
        }
    },
}]

//获取效果值
function getEffectValue(effect:Effect){
    //获取range类型的当前value
    let value:number
    if(effect.valueType=="range"){
        value = _.random(effect.value.min,effect.value.max)
        effect.value.now = value
    }
    return effect
}