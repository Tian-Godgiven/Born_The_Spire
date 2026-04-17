import { nanoid } from "nanoid";
import { ActionEvent, doEvent, getCurrentExecutingEvent, setCurrentExecutingEvent } from "../system/ActionEvent";
import { newLog } from "@/ui/hooks/global/log";
import type { LogUnit } from "@/ui/hooks/global/log";
import { resolveTarget } from "@/core/types/TargetSpec";
import { nowBattle } from "../game/battle";

//当前事务
let nowTransaction:null|Transaction = null

//事务：由1次操作引发的一连串的事件都受一个事务管理
export class Transaction{
    public __id:string = nanoid()
    private queue: ActionEvent[] = []
    //触发器回调收集栈：栈顶非空时，新事件进栈顶数组而非主队列；栈是为了支持嵌套触发器
    private collectStack: ActionEvent[][] = []
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
        event._transaction = this
        this.queue.push(event)
    }

    //插入事件到指定位置
    insertAt(event: ActionEvent, position: number | "top" | "bottom") {
        event._transaction = this

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

    /**
     * 入队事件：根据是否在触发器收集阶段自动选择目的地
     *  - 在触发器回调中（collectStack 顶非空）→ 进栈顶数组，由 runWithCollector 收尾时执行
     *  - 否则 → 进事务主队列
     */
    enqueue(event: ActionEvent, position: number | "top" | "bottom" = "top") {
        event._transaction = this
        const top = this.collectStack[this.collectStack.length - 1]
        if (top) {
            top.push(event)
        } else {
            this.insertAt(event, position)
        }
    }

    /**
     * 在触发器回调期间收集子事件，回调结束后立刻按顺序执行它们
     * 用栈结构支持嵌套触发器：内层 push/pop 不影响外层 collector
     */
    async runWithCollector(fn: () => Promise<void>): Promise<void> {
        const collector: ActionEvent[] = []
        this.collectStack.push(collector)
        try {
            await fn()
        } finally {
            this.collectStack.pop()
        }
        for (const e of collector) {
            await this.executeEvent(e)
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
        // 确保事件知道自己所属的事务（通过收集器执行的事件可能没有设置）
        event._transaction = this

        // 把 currentExecutingEvent 设为当前事件，覆盖整个执行期
        // 这样效果函数内部 / targetSpec 分支里的 doEvent 能通过它拿到 _transaction
        const prevExecuting = getCurrentExecutingEvent()
        setCurrentExecutingEvent(event)
        try {
            return await this._executeEventInner(event)
        } finally {
            setCurrentExecutingEvent(prevExecuting)
        }
    }

    private async _executeEventInner(event: ActionEvent) {
        // 1. Event before 触发器
        await event.trigger("before", 0)

        // 1.5. 执行 onExecute 回调（如果有）
        if (event.onExecute) {
            await event.onExecute(event)
        }

        // 2. 执行每个效果
        for (let effect of event.effects) {
            // 如果效果有独立目标，作为子事件执行
            if (effect.targetSpec) {
                const target = resolveTarget(effect.targetSpec, {
                    source: event.source as any,
                    target: event.target as any,
                    event,
                    battle: nowBattle.value ?? undefined
                })
                doEvent({
                    key: event.key,
                    source: event.source,
                    medium: event.medium,
                    target,
                    effectUnits: [{
                        key: effect.key,
                        params: { ...effect.params }
                    }]
                })
                continue
            }

            // Effect before 触发器
            await effect.trigger("before", 0)

            // 执行效果
            await effect.apply()

            // Effect after 触发器
            await effect.trigger("after", 0)
        }

        // 3. Event after 触发器
        await event.trigger("after", 0)

        // 5. 调用 onComplete 回调（如果有）
        if (event.onComplete) {
            event.onComplete(event)
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
}