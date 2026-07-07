# 多幕事件系统使用指南

多幕事件系统允许创建具有多个阶段的复杂事件，每个阶段可以根据玩家的选择动态展示不同的选项。

## 基本概念

单幕事件
  传统的事件，玩家做出选择后事件结束
  使用 `options` 字段配置

多幕事件
  由多个场景（幕）组成的事件
  使用 `scenes` 字段配置
  幕之间可以传递数据
  选项可以根据之前的选择条件显示

## 配置结构

### 单幕事件（现有方式，保持兼容）

```typescript
{
  key: "event_simple",
  title: "简单事件",
  description: "事件描述",
  icon: "🎯",
  options: [
    {
      title: "选项1",
      description: "选项描述",
      effects: [...]
    }
  ]
}
```

### 多幕事件（新增）

```typescript
{
  key: "event_multi_scene",
  title: "多幕事件",
  description: "事件描述",
  icon: "🎭",
  scenes: [
    {
      key: "scene1",
      title: "第一幕标题",
      description: "第一幕描述",
      options: [...]
    },
    {
      key: "scene2",
      title: "第二幕标题",
      description: "第二幕描述",
      options: [...]
    }
  ]
}
```

## 选项配置

### 基础字段

```typescript
{
  key: "option_key",           // 选项唯一标识（可选）
  title: "选项标题",
  description: "选项描述",
  icon: "🎯",                  // 选项图标（可选）
  effects: [...],              // 简单效果列表
  component: MyComponent,      // 自定义交互组件（可选）
}
```

### 多幕事件专用字段

condition 函数
  控制选项是否显示
  接收 sceneData 参数
  返回 true 显示，false 隐藏

```typescript
{
  title: "选项A",
  condition: (sceneData) => sceneData.itemType === 'card',
  // 只有当 itemType 为 'card' 时才显示此选项
}
```

nextScene 字段
  指定选择此选项后跳转到的幕
  值为目标幕的 key

```typescript
{
  title: "继续",
  nextScene: "scene2",  // 跳转到 scene2
}
```

saveData 函数
  保存数据到 sceneData
  在执行效果之前调用
  可以是同步或异步函数

```typescript
{
  title: "选择卡牌",
  saveData: async (data) => {
    data.itemType = 'card'
    data.selectedCard = await openCardSelector()
  },
  nextScene: "scene2"
}
```

customCallback 函数
  自定义回调逻辑
  接收 sceneData 参数
  在执行效果之后调用

```typescript
{
  title: "接受奖励",
  customCallback: async (data) => {
    console.log(`玩家选择了 ${data.itemType}`)
    // 执行复杂逻辑
  }
}
```

## 完整示例：湖面精灵事件

```typescript
{
  key: "event_lake_spirit",
  title: "湖面精灵",
  description: "你来到了一座平静的湖面...",
  icon: "🌊",
  scenes: [
    // 第一幕：选择丢入的物品
    {
      key: "scene1",
      title: "第一幕：平静的湖面",
      description: "一座平静的湖面倒映着天空...",
      options: [
        {
          title: "丢入一张卡牌",
          icon: "🃏",
          nextScene: "scene2",
          saveData: async (data) => {
            data.itemType = 'card'
            data.item = await selectCard()
          }
        },
        {
          title: "丢入一个器官",
          icon: "🫀",
          nextScene: "scene2",
          saveData: async (data) => {
            data.itemType = 'organ'
            data.item = await selectOrgan()
          }
        },
        {
          title: "离开",
          icon: "🚪",
          effects: [{ key: "nothing" }]
        }
      ]
    },

    // 第二幕：诚实或说谎
    {
      key: "scene2",
      title: "第二幕：透明的幻影",
      description: "湖面泛起涟漪，一个透明的幻影浮现...",
      options: [
        {
          title: "是卡牌",
          condition: (data) => data.itemType === 'card',
          nextScene: "scene3_honest",
          saveData: (data) => { data.honest = true }
        },
        {
          title: "是器官",
          condition: (data) => data.itemType === 'card',
          nextScene: "scene3_lie",
          saveData: (data) => { data.honest = false }
        },
        {
          title: "是器官",
          condition: (data) => data.itemType === 'organ',
          nextScene: "scene3_honest",
          saveData: (data) => { data.honest = true }
        },
        {
          title: "是卡牌",
          condition: (data) => data.itemType === 'organ',
          nextScene: "scene3_lie",
          saveData: (data) => { data.honest = false }
        }
      ]
    },

    // 第三幕：诚实的奖励
    {
      key: "scene3_honest",
      title: "第三幕：诚实的奖励",
      description: "精灵微笑着：'你很诚实，这是你的奖励。'",
      options: [
        {
          title: "接受奖励",
          icon: "✨",
          effects: [
            { key: "gainMaterial", params: { amount: 200 } },
            { key: "healHealth", params: { amount: 30 } }
          ]
        }
      ]
    },

    // 第三幕：说谎的惩罚
    {
      key: "scene3_lie",
      title: "第三幕：说谎的惩罚",
      description: "精灵的表情变得严肃：'你说谎了。'",
      options: [
        {
          title: "接受惩罚",
          icon: "💀",
          effects: [
            { key: "loseHealth", params: { amount: 20 } }
          ]
        }
      ]
    }
  ]
}
```

## 执行流程

选项被选择时的执行顺序
  1. saveData 函数（保存数据到 sceneData）
  2. effects 效果（执行游戏效果）
  3. customCallback 函数（自定义逻辑）
  4. component 组件（如果有）
  5. nextScene 跳转（如果指定）

幕切换流程
  1. 清理当前幕的所有选项
  2. 显示新幕的标题和描述
  3. 根据 condition 过滤选项
  4. 创建并显示新幕的选项

事件完成
  单幕事件：选择任意选项后自动完成
  多幕事件：需要在最后一幕的选项中不指定 nextScene，系统会自动添加"离开"选项

## sceneData 数据结构

sceneData 是一个普通对象，用于在幕之间传递数据

```typescript
// 示例 sceneData 结构
{
  itemType: 'card',           // 第一幕保存的物品类型
  item: CardInstance,         // 第一幕保存的物品实例
  honest: true,               // 第二幕保存的诚实标记
  // 可以保存任意数据
}
```

访问 sceneData
  在 condition 函数中：`(data) => data.itemType === 'card'`
  在 saveData 函数中：`(data) => { data.newField = value }`
  在 customCallback 函数中：`(data) => { console.log(data.itemType) }`

## 高级用法

### 条件分支

根据之前的选择显示不同的选项

```typescript
{
  key: "scene2",
  options: [
    {
      title: "选项A",
      condition: (data) => data.choice === 'A',
      // 只有选择了 A 才显示
    },
    {
      title: "选项B",
      condition: (data) => data.choice === 'B',
      // 只有选择了 B 才显示
    }
  ]
}
```

### 复杂数据传递

保存复杂对象到 sceneData

```typescript
{
  title: "选择卡牌",
  saveData: async (data) => {
    const card = await openCardSelector()
    data.selectedCard = {
      id: card.id,
      name: card.name,
      cost: card.cost,
      upgraded: card.upgraded
    }
  }
}
```

### 自定义逻辑

在 customCallback 中执行复杂逻辑

```typescript
{
  title: "接受奖励",
  customCallback: async (data) => {
    // 根据之前的选择计算奖励
    const reward = calculateReward(data)

    // 执行自定义效果
    await giveReward(reward)

    // 显示自定义UI
    showRewardAnimation(reward)
  }
}
```

### 互斥选项（幕级别）

在单个幕中使用互斥组

```typescript
{
  key: "scene1",
  mutuallyExclusiveGroups: [
    ["option_a", "option_b"]  // A 和 B 互斥
  ],
  options: [
    { key: "option_a", title: "选项A" },
    { key: "option_b", title: "选项B" },
    { key: "option_c", title: "选项C" }  // C 不受影响
  ]
}
```

## 注意事项

兼容性
  单幕事件和多幕事件可以共存
  使用 `options` 字段的是单幕事件
  使用 `scenes` 字段的是多幕事件
  不要同时使用 `options` 和 `scenes`

condition 函数
  返回 false 的选项会被完全隐藏
  确保至少有一个选项的 condition 返回 true
  如果所有选项都被隐藏，玩家将无法继续

nextScene 跳转
  确保 nextScene 指定的幕 key 存在
  如果不指定 nextScene，选项选择后不会自动跳转
  最后一幕的选项通常不指定 nextScene

sceneData 生命周期
  sceneData 在事件开始时创建
  在整个事件期间保持存在
  事件结束后销毁
  不同事件实例的 sceneData 是独立的

性能考虑
  condition 函数会在每次创建选项时执行
  避免在 condition 中执行耗时操作
  saveData 和 customCallback 只在选项被选择时执行

## 相关文件

核心实现
  `src/core/objects/room/EventRoom.ts` - 事件房间类
  `src/core/objects/system/Choice.ts` - 选项和选项组

配置文件
  `src/static/list/room/event/eventList.ts` - 事件配置列表
  `src/static/list/room/event/eventEffectMap.ts` - 事件效果映射

注册模块
  `src/static/registry/rooms/initEventRooms.ts` - 事件房间注册
