import { Status } from "@/objects/system/Status"
import { cloneDeep, isNumber, isObject } from "lodash"

export type StatusMap = {
    label:string,//显示的文本
    notNegative?:boolean,//非负
    unstackable?:boolean//不可堆叠
    defaultValue?:boolean//是否启用默认值，为true时value就是默认值
}&(
//仅数字
{
    value:number,
    valueType:"number"
}|
//最大值
{
    allowOver?:boolean//是否允许超出上限，默认为否
    value:number//默认为max的值
    |{
        min?:number|null
        now?:number,//默认为max的值
        max:number,
    },
    valueType:"max"
})

//读取map获取Status对象
export function initStatusByMap(key:string,map:StatusMap|Status["value"]):Status{
    if(!isObject(map) || !("label" in map)){
        let theMap:StatusMap
        //已存在的属性
        if(isStatusKey(key)){
            //基础map
            theMap = statusMapList[key]
            //设置基础map的值
            theMap.value = map
        }
        //手工制作的简易属性map，这种情况下默认其为默认值
        else{
            //纯数字默认为Number类型
            if(isNumber(map)){
                theMap = {
                    label:key,
                    valueType:"number",
                    value:map,
                    defaultValue:true,
                }
            }
            //否则为max类型
            else{
                theMap = {
                    label:key,
                    valueType:"max",
                    value:map,
                    defaultValue:true,
                }
            }
        }
        
        const newStatus =  initStatusByMap(key,theMap)
        return newStatus
    }

    //如果valueType为“max”，则会生成这个属性的值对象
    if(map.valueType == "max"){
        const theValue = map.value
        let value:Status["value"]
        if(isObject(theValue)){
            value = {
                min:theValue.min??null,
                now:theValue.now??theValue.max,
                max:theValue.max
            }
        }
        else{
            value = {
                min:null,
                now:theValue,
                max:theValue
            }
        }
        const defaultValue = map.defaultValue?cloneDeep(value):null
        console.log(defaultValue,value)
        return {
            ...map,
            allowOver:map.allowOver??false,
            value,
            //如果要求默认值则使用value作为默认值，否则默认值为null
            defaultValue,
            key
        }
    }
    //number类型可以直接返回就行
    return {
        ...map,
        defaultValue:map.defaultValue?map.value:null,
        key
    }
}

export function getMap(key:string){
    if(isStatusKey(key)){
        return statusMapList[key]
    }
    return false
}

export const statusMapList:Record<string,StatusMap> = {
    "health":{
        label:"生命",
        value:0,
        valueType:"max",
        defaultValue:true
    },
    "energy":{
        label:"能量",
        value:0,
        valueType:"max",
        defaultValue:true
    },
    "cost":{
        label:"消耗能量",
        value:0,
        valueType:"number",
        notNegative:true,
        defaultValue:true
    }
} as const

// 获取 statusMapList 中键的类型
type StatusKey = keyof typeof statusMapList;

// 自定义类型保护函数，验证 key 是否是 statusMapList 的有效键
function isStatusKey(key: any): key is StatusKey {
    return key in statusMapList;
}