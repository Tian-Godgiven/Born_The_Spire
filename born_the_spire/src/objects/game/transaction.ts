import { ActionEvent } from "../system/ActionEvent";
import { EventStack } from "./eventStack";

//当前事务
let nowTransaction:null|Transaction = null

//事务：由1次行为引发的一连串的事件即为一个事务
export class Transaction{
    //事件栈
    public eventStack:EventStack = new EventStack()
    //最大事件栈长度，默认为10000
    public maxLength:number
    //刚刚创建/收集中/整理中/执行中
    public state:"created"|"gathering"|"organizing"|"doing"
    constructor(maxLength:number=10000){
        this.maxLength = maxLength
        this.state = "created"
    }
    //开始一个事务
    async start(forceStop:boolean=false){
        //先强制停止之前的事务
        if(nowTransaction&&forceStop){
            await nowTransaction.shutDown(this)
        }
        //再开始该事务,开始收集事件
        nowTransaction = this;
        this.state = "gathering"
    }
    //整理事务
    organize(){
        this.state = "organizing"
        this.eventStack.organizeEvents()
        //整理完成后执行事件栈
        this.do()
    }
    //执行事件栈
    do(){
        this.eventStack.doEvents()
    }
    //中断一个事务
    async shutDown(source:Transaction){
        //事务被强制中断了,记录到日志中：未完成
        nowTransaction = null
    }
    //结束一个事务
    async stop(source:Transaction|"self"){
        //自动结束
        if(source == this){
            //记录到日志中：未完成
        }
        nowTransaction = null
    }
    
}

//当一个事件被执行时，其并不会直接执行，而是被收集到当前事务中
export async function gatherToTransaction(aE:ActionEvent,triggerLevel?:number){
    if(!nowTransaction){
        //不存在事务时，会自动创建一个事务
        const ts = createTransaction()
        nowTransaction = ts
    }
    const list = await nowTransaction.eventStack.gatherEvents(aE,triggerLevel)
    //如果返回的记录列表为空，则认为所有事件都已收集完毕
    if(list && list.length == 0){
        //开始整理
        nowTransaction.organize()
    }
}

//创建一个新事物
export function createTransaction(maxLength?:number){
    return new Transaction(maxLength)
}
//设定当前事务
export function setNowTransaction(ts:Transaction){
    nowTransaction = ts
}