import { nanoid } from "nanoid"
import { ActionEvent } from "../system/ActionEvent"

//事件栈：收集并存储一次事务中发生的事件，并依次执行
export class EventStack{
    //事件栈对象
    public stack:Record<number,EventUnit[]> = {}
    //记录列表
    private recordList:string[] = []
    constructor(){}
    
    //收集事件
    async gatherEvents(actionEvent:ActionEvent,triggerLevel:number=0){
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
        //记录该事件
        this.recordList.push(unit.__key)
        console.log(unit.__key)
        //宣布该事件，等待宣布结束
        await actionEvent.announce(triggerLevel)
        //宣布结束，尝试进行核销
        console.log(this.recordList,unit.__key)
        if(this.recordList[this.recordList.length-1] == unit.__key){
            this.recordList.pop()
            console.error("事件核销成功")
            return this.recordList
        }
        //核销失败，报错
        else{
            console.error("事件核销失败")
            return false
        }
        
    }
    //整理事件
    organizeEvents(){
        //将各个事件按level排序
        for(let key in this.stack){
            const values = this.stack[key]
            values.sort((a, b) => b.level - a.level);
        }
    }
    //执行事件栈
    async doEvents(){
        //按触发级依次获取数组
        const keys = Array.from(Object.keys(this.stack)).sort((x, y) => {
            const a = Number(x)
            const b = Number(y)
            // 处理Infinity的情况
            if (a === Infinity && b === Infinity) return 0;
            if (a === Infinity) return -1; // Infinity永远最大
            if (b === Infinity) return 1;
            
            // 普通数字比较
            return b - a;
        });

        // 按排序后的键获取事件数组
        for (const key of keys) {
            const events = this.stack[Number(key)];
            //遍历执行其中的事件
            for(let e of events){
                if(e.actionEvent.onExecute){
                    await e.actionEvent.onExecute()
                }
            }
        }
    }
    
}

type EventUnit = {
    __key:string,//随机key
    actionEvent:ActionEvent,//该单元对应的事件
    level:number,//优先级,优先级越大越先执行
    triggerLevel:number,//触发级，触发级越大越先执行
}
