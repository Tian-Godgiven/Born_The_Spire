import { isArray } from "lodash";
import { Effect } from "./Effect";
import { Entity } from "./Entity";

export class ActionEvent<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity>{
    constructor(
        public key:string,//事件的触发key
        public source:s,//执行该事件的目标
        public medium:m,//
        public target:t,//接受该事件的目标
        public info:Record<string,any>,//该事件执行全程的信息
        public effect?:Effect
    ){}
    //触发这个事件
    triggerEvent(when:"before"|"after"){
        this.source.makeEvent(when,this);
        this.medium.viaEvent(when,this)
        this.target.takeEvent(when,this)
    }
    //发生这个事件，会调用触发器
    happen(doEvent:()=>void){
        this.triggerEvent("before")
        doEvent()
        this.triggerEvent("after")
    }
}

// 进行一个行为，产生一个事件
export function doAction(
    key:string,
    source:Entity,
    medium:Entity,
    target:Entity,
    info:Record<string,any>={},
    doWhat:()=>void=()=>{}
){
    //创建行为事件
    const event = new ActionEvent(key,source,medium,target,info)
    event.happen(()=>{doWhat()})
}

//进行一个批量行为，其可能涉及多个对象，每个对象都会进行一次事件
export function doActionGroup<S extends Entity,M extends Entity,T extends Entity>(
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
        event.happen(()=>{doWhat(source,medium,target)})
    }
    
}