import { Money } from "@/interface/Money";
import { Status } from "@/interface/Status";
import { moneyList } from "@/static/list/moneyList";
import { statusList } from "@/static/list/statusList";

//设定指定属性的值，并返回设定后的属性对象
export function setStatus(statusKey:string,value:number|boolean):Status{
    //从列表中找到指定的属性
    const status = statusList.find(status=>status.key == statusKey)
    if(!status)throw new Error("不存在的属性值")
    //根据类型设定其值
    const valueType = status.valueType
    switch(valueType){
        case "number":
            if(typeof value == "number")
            return {
                ...status,
                valueType,
                value
            }
            break;
        case "bool":
            if(typeof value == "boolean")
            return {
                ...status,
                valueType,
                value
            }
            break;
        case "max":
            if(typeof value == "number")
            return {
                ...status,
                valueType,
                value:{
                    now:value,
                    max:value
                }
            }
            break;
        default:{
            throw new Error("设置属性出错")
        }
    }
    throw new Error("设置属性出错")
}
//设定指定金钱的值，返回设定后的金钱对象
export function setMoney(key:string,num:number):Money{
    //从列表中找到指定的对象
    const money = moneyList.find(item=>item.key == key)
    if(!money)throw new Error("没有找到金钱对象")
    return {
        ...money,
        num
    }
}