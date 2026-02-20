import { nanoid } from "nanoid";
import { ActionEvent } from "../system/ActionEvent";
import { newLog, LogUnit } from "@/ui/hooks/global/log";

//当前事务
let nowTransaction:null|Transaction = null

//当前事件收集器（用于 before/after 触发器）
let currentEventCollector: ActionEvent[] | null = null

export function setEventCollector(collector: ActionEvent[] | null) {
    currentEventCollector = collector
}

export function clearEventCollector() {
    currentEventCollector = null
}

export function getEventCollector() {
    return currentEventCollector
}

//事务：由1次操作引发的一连串的事件都受一个事务管理
export class Transaction{
    public __id:string = nanoid()
    private queue: ActionEvent[] = []
    public logUnit?: LogUnit
    //是否为模拟事务（模拟事务不会实际执行效果，只触发触发器）
    public simulate:boolean = false

    constructor(){
        this.logUnit = newLog({
            main: ["事务开始"],
            detail: []
        })
    }

    //添加事件到队列
    add(event: ActionEvent) {
        event.transaction = this
        this.queue.push(event)
    }

    //插入事件到指定位置
    insertAt(event: ActionEvent, position: number | "top" | "bottom") {
        event.transaction = this

        if (position === "top") {
            this.queue.unshift(event)
        } else if (position === "bottom") {
            this.queue.push(event)
        } else {
            // 相对位置：0 = 队首，1 = 第二个，-1 = 倒数第二个
            const index = position >= 0
                ? Math.min(position, this.queue.length)
                : Math.max(0, this.queue.length + position + 1)
            this.queue.splice(index, 0, event)
        }
    }

    //处理队列
    async process() {
        while (this.queue.length > 0) {
            const event = this.queue.shift()!
            await this.executeEvent(event)
        }
    }

    //执行单个事件
    async executeEvent(event: ActionEvent) {
        // 1. Event before 触发器
        const eventBeforeEvents: ActionEvent[] = []
        setEventCollector(eventBeforeEvents)
        event.trigger("before", 0)
        clearEventCollector()  // 立即清除，避免影响子事件
        for (const e of eventBeforeEvents) {
            await this.executeEvent(e)
        }

        // 1.5. 执行 onExecute 回调（如果有）
        if (event.onExecute) {
            await event.onExecute(event)
        }

        // 2. 执行每个效果
        for (let effect of event.effects) {
            // Effect before 触发器
            const effectBeforeEvents: ActionEvent[] = []
            setEventCollector(effectBeforeEvents)
            effect.trigger("before", 0)
            clearEventCollector()  // 立即清除
            for (const e of effectBeforeEvents) {
                await this.executeEvent(e)
            }

            // 执行效果
            await effect.apply()

            // Effect after 触发器
            const effectAfterEvents: ActionEvent[] = []
            setEventCollector(effectAfterEvents)
            effect.trigger("after", 0)
            clearEventCollector()  // 立即清除
            for (const e of effectAfterEvents) {
                await this.executeEvent(e)
            }
        }

        // 3. Event after 触发器
        const eventAfterEvents: ActionEvent[] = []
        setEventCollector(eventAfterEvents)
        event.trigger("after", 0)
        clearEventCollector()  // 立即清除
        for (const e of eventAfterEvents) {
            await this.executeEvent(e)
        }

        // 4. 处理 phase
        for (let phase of event.phase) {
            const conditionMet = phase.condition ? phase.condition(event) : true
            if (conditionMet === true) {
                // 执行该阶段的效果
                for (let effect of phase.effects) {
                    // Effect before 触发器
                    const effectBeforeEvents: ActionEvent[] = []
                    setEventCollector(effectBeforeEvents)
                    effect.trigger("before", 0)
                    clearEventCollector()
                    for (const e of effectBeforeEvents) {
                        await this.executeEvent(e)
                    }

                    // 执行效果（支持 entityMap 重新映射目标）
                    let override_event: Partial<any> = {}
                    const entityMap = phase.entityMap
                    if (entityMap) {
                        if (entityMap.target) {
                            if (entityMap.target === "medium") {
                                override_event.target = event.medium
                            } else if (entityMap.target === "source") {
                                override_event.target = event.source
                            }
                        }
                    }
                    await effect.apply(override_event)

                    // Effect after 触发器
                    const effectAfterEvents: ActionEvent[] = []
                    setEventCollector(effectAfterEvents)
                    effect.trigger("after", 0)
                    clearEventCollector()
                    for (const e of effectAfterEvents) {
                        await this.executeEvent(e)
                    }
                }
            } else {
                // 失败时调用 onFalse
                if (phase.onFalse) {
                    phase.onFalse()
                }
                // 提前中断
                if (conditionMet === "break") {
                    break
                }
            }
        }
    }
}
// 事务队列：存储并发的多个事务，这些事务会按顺序执行
class TransactionQueue {
    private queue: Array<{transaction: Transaction, resolve: () => void, reject: (error: any) => void}> = []
    public processing: boolean = false

    constructor() {
        this.queue = [];
        this.processing = false;
    }

    async add(transaction: Transaction): Promise<void> {
        return new Promise((resolve, reject) => {
            this.queue.push({transaction, resolve, reject});
            if (!this.processing) this.process();
        });
    }

    //执行队列
    async process() {
        this.processing = true;
        //顺序执行事务
        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if(!item) return;
            try {
                await item.transaction.process()
                item.resolve()
            } catch (error) {
                console.error("Transaction error:", error)
                item.reject(error)
            }
        }
        this.processing = false;
    }
}

const queue = new TransactionQueue()

export const transactionQueue = new TransactionQueue();

//创建一个新事务
export function createTransaction(){
    return new Transaction()
}

//开始新事务
export function beginTransaction(): Transaction {
    const tx = new Transaction()
    nowTransaction = tx
    return tx
}

//结束当前事务
export function endTransaction(): Promise<void> {
    if (nowTransaction) {
        const promise = queue.add(nowTransaction)
        nowTransaction = null
        return promise
    }
    return Promise.resolve()
}

//获取当前事务
export function getCurrentTransaction() {
    return nowTransaction
}

//设定当前事务
export function setNowTransaction(ts:Transaction){
    nowTransaction = ts
}

//打印当前事务
export function printNowTransaction(){
    console.log(nowTransaction)
}