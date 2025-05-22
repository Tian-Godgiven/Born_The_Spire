//属性根据其值分为3种类型：纯数值，范围值和布尔值
export type Status = {
    label:string,//属性名
    key:string,
    allowOver?:boolean//允许超出上限
} & ({
    valueType:"number"
    value:number,//纯数值类型
}|{
    valueType:"max"
    value:{
        now:number,//当前值
        min?:number,
        max?:number//最大值
    }
}|{
    valueType:"bool",
    value:boolean//布尔值
}|{
    valueType:null
    value:number|boolean
})

type StatusMap = {
    label:string,
    key:string,
    valueType:"number"|"bool"|"max",
    hidden?:boolean//是否不显示在状态栏
    allowOver?:boolean//是否允许超出上限，默认为否
}
//属性列表
export const statusList:StatusMap[] = [
    {
        label:"生命",
        key:"original_status_00001",
        valueType:"max",
        hidden:true
    },
    {
        label:"能量",
        key:"original_status_00002",
        valueType:"max",
        hidden:true,
        allowOver:true
    }
]

//设定指定属性的值，并返回设定后的属性对象
export function getStatusByKey(statusKey:string,value:number|boolean):Status{
    //从列表中找到指定的属性
    const status = statusList.find(status=>status.key == statusKey)
    //如果没找到，我们将其视作一个暂记属性
    if(!status){
        const status = {
            label:statusKey,
            key:statusKey,
            value,
            valueType:null
        }
        return status
    }
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

//尝试访问一个属性对象的值