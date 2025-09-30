import { nanoid } from "nanoid"
import { ActionEvent } from "../system/ActionEvent"

//事件栈：收集并存储一次事务中发生的事件，并依次执行
export class EventStack{
    //事件栈对象，按照排序规则依次排列的2级数组
    public stack:EventUnit[][] = []
    //收集列表，在收集阶段临时存放收集到的事件，仅按照触发的时间顺序排列
    private gatherStack:EventUnit[] = []
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
        //收集到收集堆栈中
        this.gatherStack.push(unit)
        //宣布该事件
        actionEvent.announce(triggerLevel)
    }
    //整理事件
    organizeEvents(){
        //将各个事件先按triggerlevel分成n组
        const triggerLevelMap:Record<number,EventUnit[]> = {}
        for(let unit of this.gatherStack){
            //按照triggerLevel为key
            if(!triggerLevelMap[unit.triggerLevel]){
                triggerLevelMap[unit.triggerLevel] = []
            }
            triggerLevelMap[unit.triggerLevel].push(unit)
        }
        //将这些triggerLevel分组按照triggerLevel的值依次放进stack中
        const levelArray = Object.keys(triggerLevelMap)
            .map(Number)
            .sort((a, b) => b - a);
        for(let level of levelArray){
            //在这一步顺便整理各个同triggerLevel的unit的优先级顺序
            const eventsArray = triggerLevelMap[level];
            eventsArray.sort((a,b)=>{
                return b.level - a.level
            })
            this.stack.push(eventsArray)
        }
    }
    //执行事件栈
    async doEvents(){
        // 按排序后的键获取事件数组
        for (let triggerArray of this.stack) {
            for( let event of triggerArray){
                await event.actionEvent.excute()
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
