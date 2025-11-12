export type StatusMap = {
    label:string,//显示的文本
    value:number,//起始值
    notNegative?:boolean,//非负
    unstackable?:boolean//不可堆叠
}|number

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
    },
    "energy":{
        label:"能量",
        value:0,
    },
    "cost":{
        label:"消耗能量",
        value:0,
        notNegative:true,
    }
} as const

// 获取 statusMapList 中键的类型
type StatusKey = keyof typeof statusMapList;

// 自定义类型保护函数，验证 key 是否是 statusMapList 的有效键
function isStatusKey(key: any): key is StatusKey {
    return key in statusMapList;
}