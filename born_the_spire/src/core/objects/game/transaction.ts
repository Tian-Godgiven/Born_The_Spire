import { nanoid } from "nanoid";
import { ActionEvent } from "../system/ActionEvent";
import { EventStack } from "./eventStack";

//当前事务
let nowTransaction:null|Transaction = null

//事务：由1次操作引发的一连串的事件都受一个事务管理
export class Transaction{
    public __id:string = nanoid()
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
    gather(e:ActionEvent,triggerLevel?:number){
        //添加事务收集器
        const collector = (e:ActionEvent,triggerLevel?:number)=>{
            this.eventStack.gatherEvents(e,triggerLevel);
        }
        e.setTransactionCollector(collector)
        this.eventStack.gatherEvents(e,triggerLevel)
    }
    //整理事务
    async organize(){
        this.state = "organizing"
        this.eventStack.organizeEvents()
        //整理完成后执行事件栈
        await this.do()
    }
    //执行事件栈
    async do(){
        this.state = "doing"
        await this.eventStack.doEvents()
        //执行完成后结束该事务
        await this.stop("self")
    }
    //中断一个事务
    async shutDown(_source:Transaction){
        //事务被强制中断了,记录到日志中：未完成
        nowTransaction = null
    }
    //结束一个事务
    async stop(source:Transaction|"self"){
        console.log("这个事务结束了",this)
        //自动结束
        if(source == this){
            //记录到日志中：未完成
        }
        nowTransaction = null
    }
}
// 事务队列：存储并发的多个事件，这些事件会按顺序执行
class TransactionQueue {
    private queue:{source:{actionEvent:ActionEvent,triggerLevel?:number},resolve:(value:any)=>void,reject:(e:any)=>void}[] = []
    public processing:boolean = false
    constructor() {
        this.queue = [];
        this.processing = false;
    }
    
    async add(actionEvent:ActionEvent,triggerLevel?:number) {
        return new Promise((resolve, reject) => {
            const source = {actionEvent,triggerLevel}
            this.queue.push({ source , resolve, reject });
            if (!this.processing) this.process();
        });
    }
    //执行队列
    async process() {
        this.processing = true;
        //顺序执行事务
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if(!task)return;
            try {
                //创建一个事务
                const transaction = createTransaction()
                //收集初创事件
                const {actionEvent,triggerLevel} = task.source
                transaction.gather(actionEvent,triggerLevel)
                //收集完毕开始整理
                await transaction.organize()
                task.resolve(true);
            } catch (error) {
                task.reject(error);
            }
        }
        this.processing = false;
    }
}

const queue = new TransactionQueue()

export const transactionQueue = new TransactionQueue();

//当一个事件被执行时，其并不会直接执行，而是被收集到事务队列中
export async function gatherToTransaction(aE:ActionEvent,triggerLevel?:number){
    queue.add(aE,triggerLevel)
}

//创建一个新事务
export function createTransaction(maxLength?:number){
    return new Transaction(maxLength)
}
//设定当前事务
export function setNowTransaction(ts:Transaction){
    nowTransaction = ts
}
//打印当前事务
export function printNowTransaction(){
    console.log(nowTransaction)
}