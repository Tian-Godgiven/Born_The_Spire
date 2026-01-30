# 过程事件 ActionEvent

过程事件是游戏进程中发生了某一件事，以及这件事产生了某些效果的过程
过程事件是一个带有记录性质的对象，其本身并不直接影响游戏进程（造成影响的始终是效果）

作用：
  统一管理事件的触发与日志
  用于触发对象的触发器，并且是【唯一一个】调用触发器的接口
  通过队列机制管理事件的执行顺序

## 结构

```typescript
{
    key: string                    // 事件key
    uuId: string                   // 唯一识别码
    source: EventParticipant       // 执行该事件的来源
    medium: EventParticipant       // 参与事件的媒介
    target: EventParticipant|EventParticipant[]  // 接受该事件的目标
    info: Record<string,any>       // 该事件执行全程的信息
    effects: Effect[]              // 该事件将会产生的效果
    phase: EventPhase[]            // 事件的多个阶段
    transaction?: Transaction      // 所属事务
    simulate: boolean              // 是否为模拟事件（不实际执行效果）
    onExecute?: (event) => void    // 事件执行时的回调
    onComplete?: (event) => void   // 事件执行完成后的回调
}
```

## 流程

过程事件采用队列机制，完整流程如下：

创建 (doEvent)
  创建 ActionEvent 实例
  存储事件相关的各种信息（source, medium, target, effects, phase）

收集到队列
  根据上下文决定收集方式：
    在 before/after 触发器中：添加到 eventCollector（立即递归执行）
    在效果函数中：插入到当前事务的指定位置（top/bottom/index）
    没有当前事务：创建新事务并加入事务队列

事务处理 (Transaction.process)
  按顺序从队列中取出事件
  依次执行每个事件

执行单个事件 (Transaction.executeEvent)
  Event before 触发器
    收集触发器产生的新事件到 eventCollector
    递归执行这些新事件
  执行每个 Effect
    Effect before 触发器 → 递归执行新事件
    Effect.apply() 应用效果
    Effect after 触发器 → 递归执行新事件
  Event after 触发器
    收集触发器产生的新事件到 eventCollector
    递归执行这些新事件
  执行 Phase 阶段（如果有）
    按顺序执行每个阶段
    每个阶段包含：条件判断 → 效果执行（before → apply → after）

## 过程事件与触发器

过程事件在执行时会触发参与实体的触发器，触发时机分为：
  Event before：事件执行前触发
  Effect before：每个效果执行前触发
  Effect after：每个效果执行后触发
  Event after：事件执行后触发

触发器产生的新事件会根据上下文处理：
  在 before/after 触发器中：新事件立即递归执行（通过 eventCollector）
  在效果函数中：新事件插入到当前事务队列（可指定位置）

这是触发触发器的唯一方法，请始终通过过程事件与实体的触发器交互

## 事件阶段 Phase

一个过程事件可以存在多个不同的阶段，阶段是线性的，严格按照顺序执行
后续阶段可以使用前面阶段的结果

使用场景示例：
  使用卡牌事件包含2个阶段：
    阶段1：消耗卡牌对应的能量
    阶段2：消耗成功时，执行卡牌的效果

阶段结构：

```typescript
{
    effectUnits: EffectUnit[]      // 该阶段中将会启用的效果单元
    condition?: (event) => boolean | "break"  // 阶段执行前的判断
    onFalse?: () => void           // 条件不满足时的回调
    entityMap?: {                  // 效果对象映射
        target?: "source" | "medium"  // 将该阶段的目标映射到事件的 source 或 medium
    }
}
```

condition 返回值：
  true：执行该阶段
  false：跳过该阶段，继续下一阶段
  "break"：跳过该阶段，并提前结束整个事件

执行顺序：
  先执行 effects 中的效果
  再按顺序执行 phase 中的各个阶段
  每个阶段的效果都会触发 before/after 触发器



## 核心方法

### trigger(when, triggerLevel)

触发该事件的触发器

参数：
  when: "before" | "after"  // 触发时机
  triggerLevel: number      // 触发等级

行为：
  调用 source.makeEvent(when, key, event, null, triggerLevel)
  调用 medium.viaEvent(when, key, event, null, triggerLevel)
  调用 target.takeEvent(when, key, event, null, triggerLevel)

### excute()

执行该事件（由 Transaction 调用）

执行顺序：
  调用 onExecute 回调
  执行 effects 中的所有效果
  依次执行 phase 中的各个阶段
  调用 onComplete 回调

### spawnEvent(event)

标记另一个事件为该事件的子事件

行为：
  设置父子关系（用于日志嵌套）
  继承 simulate 标记
  共享事务收集器

## 核心函数

### doEvent(config, options?)

创建并发生一个过程事件，这是创建事件的主要方式

```typescript
doEvent({
    key: string                    // 事件key
    source: EventParticipant       // 事件来源
    medium: EventParticipant       // 事件媒介
    target: EventParticipant | EventParticipant[]  // 事件目标
    info?: Record<string,any>      // 事件信息
    effectUnits?: EffectUnit[]     // 效果单元数组
    phase?: EventPhase[]           // 事件阶段数组
    doWhat?: () => void            // 事件执行时的回调
    onComplete?: (event) => void   // 事件完成后的回调
}, {
    position?: number | "top" | "bottom"  // 插入位置（仅在效果函数中有效）
})
```

收集行为：
  在 before/after 触发器中：添加到 eventCollector（立即递归执行）
  在效果函数中：插入到当前事务的指定位置
    "top"：队首（默认，优先执行）
    "bottom"：队尾（最后执行）
    数字：指定索引位置
  没有当前事务：创建新事务并加入事务队列

返回值：
  返回创建的 ActionEvent 对象

## 模拟模式

模拟事件用于预测效果，不会实际修改游戏状态

特性：
  simulate 标记会自动继承给子事件
  模拟事件不会收集到事务队列
  触发器仍然会被触发（用于预测）
  效果函数中应检查 simulate 标记，避免实际修改状态

使用场景：
  预测伤害/治疗量
  检查条件是否满足
  AI 决策模拟

## 事件收集器 EventCollector

事件收集器用于在触发器中收集新事件，并立即递归执行

工作流程：
  Transaction.executeEvent 执行事件时：
    设置 eventCollector 为空数组
    触发 before/after 触发器
    触发器中调用 doEvent 会将新事件添加到 eventCollector
    清除 eventCollector
    递归执行收集到的所有新事件

相关函数：
  setEventCollector(collector)：设置当前收集器
  getEventCollector()：获取当前收集器
  clearEventCollector()：清除当前收集器

## 注意事项

事件执行是异步的
  所有事件执行方法都是 async
  需要使用 await 等待事件完成

触发器中的事件立即执行
  before/after 触发器中创建的事件会立即递归执行
  这保证了触发器的响应是同步的

效果函数中的事件插入队列
  效果函数中创建的事件会插入到当前事务队列
  可以通过 position 参数控制插入位置
  默认插入队首（优先执行）

避免无限递归
  触发器中创建的事件可能再次触发同一触发器
  需要在触发器中添加条件判断，避免无限循环

模拟模式的限制
  模拟事件不会实际修改状态
  效果函数需要检查 event.simulate 标记
  模拟事件不会收集到事务队列