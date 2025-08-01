import { doAction } from "@/objects/system/ActionEvent"
import { Entity } from "./Entity"
import { newError } from "@/hooks/global/alert"
import { cloneDeep } from "lodash"

export type StatusType = "number"|"max"
//属性根据其值分为2种类型：纯数值，范围值
export type Status = StatusNumber|StatusMax
type StatusBase = {
    label?:string,//属性名
    notNegative?:boolean,//非负
    unstackable?:boolean,//不可堆叠
    key:string,
}
type StatusNumber = StatusBase&{
    valueType:"number"
    value:number,//纯数值类型
    defaultValue:number|null//战斗开始时刷新所有属性值为该属性的默认值，若不具备默认值则删除该属性
}
type StatusMax = StatusBase&{
    valueType:"max"
    allowOver:boolean//是否允许超出上限
    value:{
        now:number,//当前值
        min:number|null,
        max:number//最大值
    }
    defaultValue:{
        now:number,
        min:number|null,
        max:number
    }|null
}

//根据key值获取目标对象中的属性对象
export function getStatusByKey<T extends StatusType>(target:Entity,statusKey:string,type:T):Status&{valueType:T}
export function getStatusByKey<T extends StatusType>(target:Entity,statusKey:string,type:T,allowNull:boolean):Status&{valueType:T}|null
export function getStatusByKey<T extends StatusType>(target:Entity,statusKey:string,type?:T,allowNull?:boolean,){
    const targetStatus = target.status[statusKey]
    if(!target){
        if(allowNull){
            return null
        }
        newError(["没能从对象上找到指定的属性",target,statusKey])
    }
    let statusType:StatusType|undefined = type
    if(!statusType){
        statusType = "number"
    }
    if(targetStatus.valueType != statusType){
        newError(["找到的属性与要求的类型不符合",targetStatus,statusType])
    }
    return targetStatus
}

//判断对象是否具备某个属性
export function haveStatus(target:Entity,statusKey:string){
    if(statusKey in target.status){
        return true
    }
    return false
}

//根据key值获取目标属性的值
export function getStatusValue(target:Entity,statusKey:string,type:"now"|"min"|"max"="now"):number{
    //找到属性对象
    const status = target.status[statusKey]
    if(!status){
        newError(["对象不具备指定的属性",target,statusKey])
    }
    //根据类型决定返回值
    switch(status.valueType){
        case "number":
            return status.value
        case "max":
            switch(type){
                case "now":
                    return status.value.now
                case "max":
                    return status.value.max;
                case "min":
                    if(!status.value.min){
                        newError(["该属性不存在min值",status,"将会返回0"])
                        return 0
                    }
                    return status.value.min;
                default:
                    return status.value.now
            }
        default:
            newError(["无法识别的属性类型",target,statusKey,status])
            throw new Error()
    }
}

//修改目标属性的值,超过上限或下限的部分无效
export function changeStatusValue(source:Entity,medium:Entity,target:Entity,statusKey:string,newValue:number,type:"now"|"min"|"max"="now"){
    const oldValue = getStatusValue(target,statusKey,type)
    //找到属性对象
    const status = target.status[statusKey]
    //改变之前
    //判断输入值
    newValue = checkValue(status,newValue,type)
    //进行行为：修改属性,传入属性key和修改前后的值
    doAction("changeStatus",source,medium,target,{
        statusKey,
        oldValue,
        newValue
    },()=>{
        //根据类型决定修改对象值
        switch(status.valueType){
            case "number":
                status.value = newValue
                break;
            case "max":
                switch(type){
                    case "now":
                        status.value.now = newValue
                        break;
                    case "max":
                        status.value.max = newValue
                        break;
                    case "min":
                        status.value.min = newValue
                        break;
                    default:
                        status.value.now = newValue
                        break;
                }
                break;
            default:
                newError(["无法识别的属性类型",target,statusKey,status])
                throw new Error()
        }
    })
    //改变之后

}

//初始化所有属性值
export function defaultStatusValue(target:Entity){
    for(let key in target.status){
        const status = target.status[key]
        //将其value设置成defaultValue
        if(status.defaultValue){
            target.status[key].value = cloneDeep(status.defaultValue)
        }
        //删除该属性
        else{
            delete target.status[key]
        }
    }
}

//判断输入值是否合法
function checkValue(status:Status,newValue:number,type:"now"|"min"|"max"){
    //若属性为“非负”的
    if(status.notNegative){
        if(newValue < 0){
            return 0
        }
    }
    if(status.valueType == "max"){
        switch(type){
            case "now":
                //不会超过上限，也不会低于下限
                if(newValue > status.value.max){
                    //不允许溢出
                    if(!status.allowOver){
                        newValue = status.value.max
                    }
                }
                if(status.value.min && newValue < status.value.min){
                    newValue = status.value.min
                }
                break;
            case "max":
                //不会低于下限值
                if(status.value.min && newValue < status.value.min){
                    newValue = status.value.min
                }
                status.value.max = newValue
                break;
            case "min":
                //不会超过上限值
                if(newValue > status.value.max){
                    newValue = status.value.max
                }
                break;
        }
    }
    return newValue           
}