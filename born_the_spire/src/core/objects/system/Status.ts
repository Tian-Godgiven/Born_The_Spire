import { Entity } from "./Entity"
import { newError } from "@/ui/hooks/global/alert"
import { StatusModifier } from "./modifier/StatusModifier"

export type StatusType = "number"|"max"
export type StatusOptions = {
    notNegative?:boolean//非负
    unstackable?:boolean//不可堆叠
    allowOver?:boolean//是否允许超出上限
}

//属性根据其值分为2种类型：纯数值，范围值
export class Status{
    public label?:string//属性名
    public key:string
    public valueType:StatusType
    public options:StatusOptions//未实现
    public _modifier?:StatusModifier//属性修饰器
    constructor(source:any,key:string,defaultValue:number,valueType:StatusType = "number",options?:StatusOptions){
        this.key = key;
        this.valueType = valueType
        //构建基础的属性修饰器
        this._modifier = new StatusModifier(this.key)
        this._modifier.addByJSON(key,source,{
            "modifierValue":defaultValue,clearable:false
        })//基础修饰器不可清除
        //刷新一下
        this._modifier.refresh()
        //设置
        this.options = options ?? {}
    }
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
            //未完成，没有数值类型差分
            // switch(type){
            //     case "now":
            //         return status.value.now
            //     case "max":
            //         return status.value.max;
            //     case "min":
            //         if(!status.value.min){
            //             newError(["该属性不存在min值",status,"将会返回0"])
            //             return 0
            //         }
            //         return status.value.min;
            //     default:
            //         return status.value.now
            // }
            return status.value.max
        default:
            newError(["无法识别的属性类型",target,statusKey,status])
            throw new Error()
    }
}

//修改目标属性的值,超过上限或下限的部分无效
export async function changeStatusValue(source:Entity,medium:Entity,target:Entity,statusKey:string,newValue:number,type:"now"|"min"|"max"="now"){
    const oldValue = getStatusValue(target,statusKey,type)
    //找到属性对象
    const status = target.status[statusKey]
    //判断输入值是否合法
    // newValue = checkValue(status,newValue,type)
    //进行事件：修改属性,传入属性key和修改前后的值
    //未完成 属性修改事件
    // doEvent("changeStatus",source,medium,target,{
    //     statusKey,
    //     oldValue,
    //     newValue
    // },[])
    //改变之后

}

//初始化所有属性值
export function refreshAllStatus(target:Entity){
    for(let key in target.status){
        const status = target.status[key]
        status.refresh()
    }
}

//判断属性当前值合法
function checkValue(status:Status,newValue:number,type:"now"|"min"|"max"){
    //若属性为“非负”的
    if(status.options.notNegative){
        if(newValue < 0){
            return false
        }
    }
    if(status.valueType == "max"){
        // switch(type){
        //     case "now":
        //         //不会超过上限，也不会低于下限
        //         if(newValue > status.value.max){
        //             //不允许溢出
        //             if(!status.options.allowOver){
        //                 newValue = status.value.max
        //             }
        //         }
        //         if(status.value.min && newValue < status.value.min){
        //             newValue = status.value.min
        //         }
        //         break;
        //     case "max":
        //         //不会低于下限值
        //         if(status.value.min && newValue < status.value.min){
        //             newValue = status.value.min
        //         }
        //         status.value.max = newValue
        //         break;
        //     case "min":
        //         //不会超过上限值
        //         if(newValue > status.value.max){
        //             newValue = status.value.max
        //         }
        //         break;
        // }
    }
    return newValue           
}