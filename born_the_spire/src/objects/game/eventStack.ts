import { nanoid } from "nanoid"
import { ActionEvent } from "../system/ActionEvent"

//事件栈：收集并存储一次事务中发生的事件，并依次执行
export class EventStack{
    //事件栈对象
    public stack:Record<number,EventUnit[]> = {}
    constructor(){}
    
    //收集事件
    gatherEvents(actionEvent:ActionEvent,triggerLevel:number=0){
        //创建事件栈单元
        const unit:EventUnit = {
            __key:nanoid(),
            level:actionEvent.info.level??0,
            actionEvent,
            triggerLevel
        }
        //按触发优先级添加到堆栈中
        if(!this.stack[triggerLevel]){
            this.stack[triggerLevel] = []
        }
        else{
            this.stack[triggerLevel].push(unit)
        }
        //宣布该事件
        this.announceEvents(actionEvent,triggerLevel)
    }
    //宣布一个事件将会发生，收集其触发的事件
    announceEvents(activeEvent:ActionEvent,triggerLevel:number){
        //触发事件before，触发级-=1
        activeEvent.triggerEvent("before",triggerLevel-=1)
        //触发事件的after，触发级+=1
        activeEvent.triggerEvent("after",triggerLevel+=1)
    }
    //执行事件栈
    doEvents(){
        //
    }
    
}

type EventUnit = {
    __key:string,//随机key
    actionEvent:ActionEvent,//该单元对应的事件
    level:number,//优先级,优先级越高越先执行
    triggerLevel:number,//触发优先级
}
