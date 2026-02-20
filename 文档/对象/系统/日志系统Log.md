# 日志系统 Log

日志系统用于记录游戏中发生的事件和操作，并在 UI 中以可读的方式呈现给玩家和开发者。

日志的主要作用：
1. 记录游戏过程，便于玩家回顾战斗流程
2. 调试开发时快速定位问题
3. 通过嵌套结构展示事件的层级关系

## 核心概念

### LogUnit 日志单元

日志单元是日志系统的基本组成单位，每一条日志都是一个 LogUnit 对象。

```typescript
{
    text: string,         // 主内容，显示在日志栏中
    detail: string,       // 详情内容，点击展开后显示
    time: number,         // 时间戳
    children?: LogUnit[], // 子日志列表（嵌套日志）
    level?: number        // 嵌套层级（0为顶层）
}
```

### 嵌套日志

日志可以包含子日志，形成树状结构。这样可以将相关的日志组织在一起。

eg：
```
📋 Player 失去了器官 石肤 [▶ 点击展开]
  ├─ 移除触发器: damage
  ├─ 移除修饰器: 防御+2
  └─ 移除卡牌: 石化
```

子日志默认折叠，点击父日志的箭头（▶/▼）可以展开/收起。

## 使用方式

### 基础用法：创建日志

```typescript
import { newLog } from "@/ui/hooks/global/log"

// 简单日志
newLog(["玩家", player, "受到了", damage, "点伤害"])

// 带详情的日志
newLog({
    main: ["玩家抽牌", card],
    detail: ["从抽牌堆", "数量:3"]
})
```

### 创建嵌套日志

```typescript
// 1. 创建父日志并保存引用
const parentLog = newLog(["失去器官", organ])

// 2. 添加子日志（传入父日志作为第二个参数）
newLog(["移除触发器: damage"], parentLog)
newLog(["移除修饰器: 防御+2"], parentLog)
newLog(["移除卡牌: 石化"], parentLog)
```

子日志会自动：
- 添加到父日志的 `children` 数组中
- 设置 `level` 为父日志的层级+1
- 在 UI 中缩进显示

### 在事件中使用日志

ActionEvent 已经集成了日志收集功能：

```typescript
// ActionEvent 在 happen() 时会自动创建日志
event.happen(doWhat)  // 自动创建日志并保存到 event.logUnit

// 在事件执行过程中添加子日志
event.addChildLog(["执行效果", effectName])
```

### 在副作用清理时使用日志

ItemModifier 的 cleanup 方法支持传入父日志：

```typescript
// 在 OrganModifier.loseOrgan 中
const parentLog = newLog([this.owner, "失去了器官", organ])

// 清理副作用时，传入父日志
this.removeByItem(organ, parentLog)

// 所有的副作用清理日志（移除触发器、修饰器等）
// 都会作为子日志嵌套在 parentLog 下
```

## 日志展示

### UI 显示

日志显示在右侧的 LogPane 面板中，可以通过左箭头展开/收起。

面板功能：
- 显示时间：勾选"时间"复选框可显示每条日志的时间戳
- 清空日志：点击"清空"按钮清除所有日志
- 展开/收起：
  - 点击 ▶/▼ 展开/收起子日志
  - 点击 △/▽ 展开/收起详情内容

### 日志格式化

`newLog()` 会自动格式化传入的数据：

- Entity 对象：显示 `label` 或 `key`
- 数字/字符串：直接显示
- 布尔值：显示"成功(true)"或"失败(false)"
- null/undefined：显示"无(null)"或"未定义(undefined)"
- 其他对象：显示"<无法识别对象>"

## 系统自动日志

系统已经在关键位置自动添加了日志，你**无需**在自定义效果中手动添加日志。

### 自动日志的位置

**事件系统：**
- `ActionEvent.happen()` - 发生事件时自动记录："发生了事件 [eventKey]"
- `applyEffect()` - 执行效果时自动记录：
  - "造成了效果 [effect]"
  - "执行效果 [effect]"（带返回结果）

**器官系统：**
- `acquireOrgan()` - "获得了器官 [organ]"
- `loseOrgan()` - "失去了器官 [organ]"（嵌套显示副作用清理）
- `useOrgan()` - "使用了器官 [organ]" / 错误提示
- `breakOrgan()` - "[organ] 已损坏"
- `repairOrgan()` - "[organ] 已修复"

**副作用清理：**
- `ItemModifierUnit.cleanup()` - 自动记录所有移除的触发器、修饰器

### Mod 制作指南

**你只需要使用系统提供的接口，日志会自动产生。**

正确示例：

```typescript
// 自定义效果函数
export const myCustomEffect: EffectFunc = (event, effect) => {
    // 不需要手动添加日志！
    // 系统会自动在 applyEffect() 中记录

    // 直接执行你的效果逻辑
    const target = event.target
    target.current.health.value += 10
}

// 自定义器官交互
const myOrgan: OrganMap = {
    label: "特殊器官",
    key: "custom_organ_001",
    interaction: {
        get: {
            target: {key: "self"},
            effects: [{
                key: "addStatusBase",  // 使用已有的效果
                params: {value: 5, statusKey: "attack"}
            }]
        }
    }
}

// 使用器官时，日志会自动产生
getOrgan(player, source, myOrgan)
// 自动记录：
// "Player 获得了器官 特殊器官" [▶]
//   └─ "执行效果 addStatusBase"
```

### 特殊情况：手动添加日志

只有在以下情况下才需要手动添加日志：

1. **自定义的非系统操作**（不通过 doEvent 或修饰器）
2. **调试自定义逻辑**
3. **添加额外的说明性日志**

```typescript
// 特殊情况示例：自定义的复杂操作
function customComplexOperation() {
    const parentLog = newLog(["执行自定义操作"])

    // 手动操作1
    doSomething1()
    newLog(["步骤1完成"], parentLog)

    // 手动操作2
    doSomething2()
    newLog(["步骤2完成"], parentLog)
}
```

### 注意事项

1. **优先使用系统接口**：使用 `doEvent()`、`getOrgan()` 等，而不是直接操作对象
2. **避免重复日志**：不要在已有日志的操作中再次添加日志
3. **保持日志简洁**：如果必须手动添加，主内容应简短明了
4. **嵌套不要太深**：一般 2-3 层即可，过深影响可读性

## 调试技巧

### 查看日志层级

在开发者工具中查看 logList：

```javascript
// 在浏览器控制台
logList.value.forEach(log => {
    console.log(`${log.text} (level: ${log.level}, children: ${log.children?.length || 0})`)
})
```

### 追踪事件链

通过事件的嵌套日志，可以追踪一个操作触发了哪些子事件：

```
发生了事件 getOrgan [▶]
  ├─ 发生了事件 possessOrgan [▶]
  │   ├─ 添加触发器: damage
  │   └─ 添加修饰器: 防御+2
  └─ 发生了事件 getOrgan效果 [▶]
      └─ 获得3点最大生命
```

这个层级结构清晰地展示了：获得器官 → 持有器官效果 + 获得器官效果

## 实现原理

日志系统基于 Vue 的响应式系统：

1. `logList` 是一个全局的 `ref<LogUnit[]>`
2. LogPane 组件通过 `v-for` 渲染 logList
3. LogUnit 组件递归渲染子日志（children）
4. 嵌套通过 `marginLeft` 和 `level` 实现缩进显示

当调用 `newLog()` 时：
- 如果没有父日志，添加到 `logList`（顶层日志）
- 如果有父日志，添加到父日志的 `children`（子日志）

UI 会自动更新并显示新日志。
