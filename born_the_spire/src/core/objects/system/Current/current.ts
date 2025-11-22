import { ref } from "vue";
import { Entity } from "../Entity";
import { TriggerMap } from "@/core/types/object/trigger";
import { createTriggerByTriggerMap } from "../trigger/Trigger";
import { newError } from "@/ui/hooks/global/alert";
import { CurrentMapData, getMetaFromCurrentMap } from "@/static/list/system/currents/currentMap";
import { getStatusValue } from "../status/Status";
import { ActionEvent } from "../ActionEvent";

type CurrentOption = {
    allowOverMin?:boolean|"breakdown",//是否允许某次修改超出下限值,默认为true
        // 例如当前值为3时扣除100，
        // 1.false:不会扣除并返回false
        // 2.true:会扣除3并返回3
        // 3.breakdown:会扣除3并返回100
    allowOverMax?:boolean|"breakdown",//是否允许某次修改超出上限值,默认为true
    maxBy?:string|number,//上限为属性值/特定值,默认无上限
    minBy?:string|number,//下限为属性值/特点值，默认为0
    reachMax?:(event:ActionEvent,ownner:Entity,current:Current)=>void,//达到上限时的回调函数
        reachMin?:(event:ActionEvent,ownner:Entity,current:Current)=>void,//达到下限时的回调函数
    onShow?:string|number|((owner:Entity,current:Current)=>number|string)//显示时的返回值
}

export class Current{
    public key:string;
    public label?:string;
    public _value = ref(0);
    public triggers:{id:string,remove:()=>void}[] = []//记录有关的触发器信息
    public options:CurrentOption;
    public owner:Entity//持有者
    get value(){
        return this._value.value
    }
    set value(value:number){
        this._value.value = value
    }
    constructor(source:Entity,owner:Entity,key:string,startValue:number,options:CurrentOption,triggers:TriggerMap){
        this.owner = owner
        this.key = key;
        this._value.value = startValue
        this.options= options
        //上下限值有默认值
        this.options.maxBy = options.maxBy??Infinity//上线默认为无限大
        this.options.minBy = options.minBy??0//下限默认为0
        //创建对应的触发器，并挂载到持有者上
        for(let i of triggers){
            const trigger = createTriggerByTriggerMap(source,owner,i)
            const res = owner.appendTrigger(trigger)
            this.triggers.push(res)
        }
        //将自身挂载到持有者上
        appendCurrent(owner,this)
    }
}

//初始化当前值
export function initCurrentFromMap<T extends Entity>(owner:Entity,mapData:CurrentMapData<T>){
    //从map里找到当前值
    for(let i of mapData){
        let key:string = typeof i == "string" ? i:i.key
        const meta = getMetaFromCurrentMap(key)
        //用传入的值覆盖meta的值
        if(typeof i != "string"){
            Object.assign(meta,i)
        }
        //获取初始值
        let startValue:number
        switch(meta.startValue){
            case "max":
                startValue = getCurrentMaxOrMin(owner,meta.maxBy??Infinity)
                break
            case "min":
                startValue = getCurrentMaxOrMin(owner,meta.minBy??0)
                break
            default:
                startValue = meta.startValue
                break
        }
        const option:CurrentOption = {...meta}
        //然后用meta值创建当前值对象
        new Current(owner,owner,key,startValue,option,meta.triggers??[])
    }
}

//为实体挂载一个当前值
export function appendCurrent(entity:Entity,current:Current,force:boolean=false){
    if(ifHaveCurrent(entity,current.key)){
        if(force){
            entity.current[current.key] = current
        }
        newError([entity,"已具备该当前值",current,"，且未设置强制覆盖。"])
    }
    else{
        entity.current[current.key] = current
    }
}

//判断实体是否具备某个当前值
export function ifHaveCurrent(entity:Entity,key:string){
    return entity.current[key] ? true:false
}

//获取某个当前值
export function getCurrentValue(entity:Entity,key:string,defaultValue?:number){
    const current = entity.current[key]
    if(current){
        return current.value
    }
    else if(defaultValue){
        return defaultValue
    }
    newError(["尝试在",entity,"上获取当前值",key,"但即不存在这个值，也没有设定默认值。"])
}

//获取某个当前值
export function getCurrentRefValue(entity:Entity,key:string,defaultValue?:number){
    const current = entity.current[key]
    if(current){
        return current._value
    }
    else if(defaultValue){
        return defaultValue
    }
    newError(["尝试在",entity,"上获取当前值",key,"但即不存在这个值，也没有设定默认值。"])
}

//获取当前值的上下限值
export function getCurrentMaxOrMin(owner:Entity,maxOrMin:string|number){
    if(typeof maxOrMin == "string"){
        return getStatusValue(owner,maxOrMin)
    }
    else{
        return maxOrMin
    }
}

//修改某个当前值
export function changeCurrentValue(target:Entity,key:string,newValue:number){
    const current = target.current[key]
    if(current){
        current.value = newValue
        return true
    }
    return false
}

