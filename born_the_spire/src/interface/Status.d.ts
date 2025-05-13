//属性值分为3种类型：纯数值，范围值和布尔值
export type Status = {
    label:string,//属性名
    key:string,
    
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
})