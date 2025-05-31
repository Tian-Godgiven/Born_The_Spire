import { ActionEvent } from "@/objects/system/ActionEvent";
import { Entity } from "@/objects/system/Entity";
import { isArray } from "lodash";

//进行一个行为
export function doBehavior(
    key:string,
    source:Entity,
    medium:Entity,
    target:Entity,
    info:Record<string,any>={},
    doWhat:()=>void=()=>{}
){
    //创建行为事件
    const event = new ActionEvent(key,source,medium,target,info)
    //触发行为事件
    event.triggerEvent("before")
    doWhat()
    event.triggerEvent("after")
}

//进行一个批量行为，其可能涉及多个对象，每个对象都会进行一次事件
export function doBehaviorGroup<S extends Entity,M extends Entity,T extends Entity>(
    key:string,//行为key
    eventKey:string,//单独的行为事件key
    source:S|S[],
    medium:M|M[],
    target:T|T[],
    info:Record<string,any>={},
    //对每个对象都会触发的回调函数
    doWhat:(source:S,medium:M,target:T)=>void=()=>{}
){
    // 判断是否需要遍历数组，若是数组则遍历并创建多个事件
    const sourceA = isArray(source) ? source : [source];
    const mediumA = isArray(medium) ? medium : [medium];
    const targetA = isArray(target) ? target : [target];
    const events: ActionEvent[] = [];
    // 使用三重循环来遍历source、medium和target数组
    sourceA.forEach(s => {
        mediumA.forEach(m => {
            targetA.forEach(t => {
                doOneEvent(s,m,t)
            });
        });
    });
    //分别进行一个行为事件
    function doOneEvent(source:S,medium:M,target:T){
        //创建行为事件
        const event = new ActionEvent(eventKey,source,medium,target,info)
        //添加到数组
        events.push(event)
        //触发行为事件
        event.triggerEvent("before")
        doWhat(source,medium,target)
        event.triggerEvent("after")
    }
    
}