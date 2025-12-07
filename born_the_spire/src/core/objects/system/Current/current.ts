import { ref } from "vue";
import { Entity } from "../Entity";
import { TriggerMap } from "@/core/types/object/trigger";
import { createTriggerByTriggerMap } from "../trigger/Trigger";
import { newError } from "@/ui/hooks/global/alert";
import { CurrentMapData, getMetaFromCurrentMap } from "@/static/list/system/currents/currentMap";
import { getStatusValue } from "../status/Status";
import { ActionEvent } from "../ActionEvent";
import { get, max } from "lodash";
import { getRefValue, setRefValue } from "@/core/hooks/refValue";

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
        return getRefValue(this._value)
    }
    set value(value:number){
        setRefValue(this,"_value",value)
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

//工具函数：获取当前值的上下限值minBy或者maxBy对应的数值
function getCurrentMaxOrMin(owner:Entity,maxOrMin:string|number){
    if(typeof maxOrMin == "string"){
        return getStatusValue(owner,maxOrMin)
    }
    else{
        return maxOrMin
    }
}

//修改某个当前值，返回实际修改的值或修改失败false
export function changeCurrentValue(target:Entity,key:string,newValue:number,event:ActionEvent):false|number{
    const current = target.current[key]
    if(current){
        //超出上限的情况
        let result = changeCurrentOverMax(target,current,newValue,event)
        if(result !== true)return result
        //超出下限的情况
        let result2 = changeCurrentOverMin(target,current,newValue,event)
        if(result2 !== true)return result2

        //没有提前结束，则修改为新的值，并返回修改值
        const nowValue = current.value
        current.value = newValue
        return Math.abs(newValue-nowValue)
    }
    return false
}

//修改超出上限值
function changeCurrentOverMax(target:Entity,current:Current,newValue:number,event:ActionEvent):boolean|number{
    const maxBy = current.options.maxBy
    //没有上限返回true即可
    if(!maxBy)return true
    //当前值上限和当前值
    const maxValue = getCurrentMaxOrMin(target,maxBy)
    const nowValue = current._value.value
    
    let res:boolean|number = true
    //超过了上限
    if(newValue > maxValue){
        switch(current.options.allowOverMax){
            case false:
                //禁止超过上限的修改
                return false;
            case true:
                //允许超过，但返回值是当前值和最大值的差值
                res = maxValue - nowValue
                break;
            case "breakdown":
                //允许超过，并且返回的当前值和预期值的差值
                res = newValue - nowValue
                break;
        }
    }
    //达到上限
    if(newValue >= maxValue){
        //触发上限回调
        current.options.reachMax?.(event,target,current)
    }
    return res
}


//修改超出下限值
function changeCurrentOverMin(target:Entity,current:Current,newValue:number,event:ActionEvent):boolean|number{
    const minBy = current.options.minBy
    //没有上限返回true即可
    if(!minBy)return true
    //当前值上限和当前值
    const minValue = getCurrentMaxOrMin(target,minBy)
    const nowValue = current._value.value
    
    let res:boolean|number = true
    //超过了下限
    if(newValue < minValue){
        switch(current.options.allowOverMin){
            case false:
                //禁止超过上限的修改
                return false;
            case true:
                //允许超过，但返回值是当前值和最大值的差值
                res = nowValue - minValue
                break;
            case "breakdown":
                //允许超过，并且返回的当前值和预期值的差值
                res = nowValue - newValue
                break;
        }
    }
    //达到上限
    if(newValue <= minValue){
        //触发上限回调
        current.options.reachMin?.(event,target,current)
    }
    return res
}

