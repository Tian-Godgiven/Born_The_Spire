/**
 * 目标选择类型定义
 */

export type TargetType = {
    faction?:"player"|"enemy"|"all"|"opponent",//可选的阵营,默认为敌方。opponent表示使用者的敌对阵营
    number?:number|"all",//可选的数量,默认为1
    key?:string,//判断关键字
}
