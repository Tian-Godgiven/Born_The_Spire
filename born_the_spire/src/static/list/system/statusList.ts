import { Status } from "@/objects/system/Status"
import { isNumber, isObject } from "lodash"

export type StatusMap = {
    label:string,//显示的文本
    notNegative?:boolean,//非负
    unstackable?:boolean//不可堆叠，也不会显示层数
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
        if(isStatusKey(key)){
            theMap = statusMapList[key]
        }
        else{
            if(isNumber(map)){
                theMap = {
                    label:key,
                    valueType:"number",
                    value:map
                }
            }
            else{
                theMap = {
                    label:key,
                    valueType:"max",
                    value:map
                }
            }
        }
        theMap.value = map
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
        return {
            ...map,
            allowOver:map.allowOver??false,
            value,
            key
        }
    }
    //否则直接返回就行
    return {
        ...map,
        key
    }
}

export function getMap(key:string){
    if(isStatusKey(key)){
        return statusMapList[key]
    }
    return false
}

export const statusMapList = {
    "health":{
        label:"生命",
        value:0,
        valueType:"max",
    },
    "energy":{
        label:"能量",
        value:0,
        valueType:"max",
        trigger:[
        //回合开始时获得最大能量
        {
            
        },
        // 回合结束时失去所有能量
        {

        }]
    },
    "cost":{
        label:"消耗能量",
        value:0,
        valueType:"number",
        notNegative:true
    }
} as const

// 获取 statusMapList 中键的类型
type StatusKey = keyof typeof statusMapList;

// 自定义类型保护函数，验证 key 是否是 statusMapList 的有效键
function isStatusKey(key: any): key is StatusKey {
    return key in statusMapList;
}