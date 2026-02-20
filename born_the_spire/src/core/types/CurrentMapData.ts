import { Current } from "@/core/objects/system/Current/current"
import { Entity } from "@/core/objects/system/Entity"
import { TriggerMap } from "@/core/types/object/trigger"
import { ActionEvent } from "@/core/objects/system/ActionEvent"

export type CurrentMap<T extends Entity> = {
    startValue:"max"|"min"|number//初始值
    triggers?:TriggerMap,
    //设置选项
    allowOverMin?:boolean|"breakdown",//是否允许某次修改超出下限值,默认为true
    allowOverMax?:boolean|"breakdown",//是否允许某次修改超出上限值,默认为true
    maxBy?:string|number,//上限为属性值/特定值,默认无限大
    minBy?:string|number,//下限为属性值/特点值，默认为0
    reachMax?:(event:ActionEvent,ownner:T,current:Current)=>void,//达到上限时的回调函数
    reachMin?:(event:ActionEvent,ownner:T,current:Current)=>void,//达到下限时的回调函数
    onShow?:string|number|((ownner:T,current:Current)=>number|string)//显示时的返回值
}

export type CurrentMapData<T extends Entity> = ((Partial<CurrentMap<T>>&{key:string})|string)[]
