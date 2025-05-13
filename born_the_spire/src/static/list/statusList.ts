type Status = {
    label:string,
    key:string,
    valueType:"number"|"bool"|"max",
    hidden?:boolean//是否不显示在状态栏
}
//固有属性
export const statusList:Status[] = [
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
        hidden:true
    }
]