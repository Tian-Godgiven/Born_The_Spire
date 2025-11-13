import { ref } from "vue";
import { Entity } from "../Entity";

type CurrentOption = {
    allowOverMin?:boolean|"breakdown",//是否允许某次修改超出下限值,默认为true
        // 例如当前值为3时扣除100，
        // 1.false:不会扣除并返回false
        // 2.true:会扣除3并返回3
        // 3.breakdown:会扣除3并返回100
    allowOverMax?:boolean|"breakdown",//是否允许某次修改超出上限值,默认为true
    maxBy?:string|number,//上限为属性值/特定值,默认无上限
    minBy?:string|number,//下限为属性值/特点值，默认为0
    reachMax?:(ownner:Entity,current:Current)=>void,//达到上限时的回调函数
    reachMin?:(ownner:Entity,current:Current)=>void,//达到下限时的回调函数
    onShow?:string|number|((ownner:Entity,current:Current)=>number|string)//显示时的返回值
}

export class Current{
    public key:string;
    public label?:string;
    public _value = ref(0);
    public triggers:{

    }
    constructor(key:string,defaultValue:number,options:{}){

    }
}

//为实体挂载一个当前值，同时挂载对应的触发器
export function appendCurrent(entity:Entity,currentMap:currentMap){

}

//获取某个当前值
export function getCurrentValue(entity:Entity,key:string,defaultValue?:number){
    return defaultValue??0
}

//修改某个当前值
export function changeCurrentValue(source:any,target:Entity,key:string,newValue:number){
    //
}

