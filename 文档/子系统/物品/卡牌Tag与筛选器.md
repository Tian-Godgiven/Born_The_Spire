# 卡牌 Tag 与筛选器

Tag（标签）是卡牌的分类标识，不影响卡牌行为；影响行为的是词条 Entry。CardSelector 是通用筛选器，用于敌人 AI、玩家效果选牌、遗物触发条件等所有需要按条件筛卡的场景。

源文件：
    标签注册表：`src/static/list/system/cardTagMap.ts`
    筛选器：`src/core/objects/system/CardSelector.ts`
    卡牌类：`src/core/objects/item/Subclass/Card.ts`
    敌人 AI 用例：`src/core/objects/system/EnemyBehavior.ts`

## Tag vs Entry

```
Tag       只用于分类/筛选/条件判断     无副作用          示例：attack / basic
Entry     实际改变卡牌行为             会挂 trigger/modifier   示例：exhaust / void
```

同一张卡两者可并存：

```typescript
{
    key:   "card_001",
    label: "打击",
    tags:  ["attack", "basic"],    // 只分类
    entry: ["exhaust"],             // 行为：消耗
}
```

## 标签注册表 cardTagMap

`cardTagMap: Record<string, CardTagInfo>` 定义所有标签：

```typescript
type CardTagInfo = {
    label:    string
    describe: string
    category: "type" | "feature" | "custom"
}
```

三大类别：

```
type     类型标签，互斥；每张卡只能有一个（约定，代码不强制）
feature  特性标签，可叠加
custom   Mod 追加的标签
```

### 已注册标签

```
attack   type     造成伤害的卡牌
skill    type     提供格挡、抽牌等效果的卡牌
power    type     提供持续效果的卡牌

basic    feature  初始卡组中的卡牌
curse    feature  负面效果的卡牌
status   feature  临时添加的卡牌
```

### 注册与验证 API

```typescript
registerCardTag(key, info)                       // Mod 追加自定义标签
validateCardTag(tagKey)              → boolean   // 是否已注册
validateCardTags(tags)               → { valid, invalid }   // 批量验证
getCardTagInfo(tagKey)               → CardTagInfo | undefined
```

**约束**：代码不强制 `type` 标签互斥、也不阻止未注册标签落在卡上（如实际卡牌里出现的 `defence` `multiHit` 都不在注册表里）。规范靠数据审查，不靠运行时校验。

## CardSelector 结构

```typescript
type CardSelector = {
    key?:       string             // 精确匹配卡牌 key
    tags?:      string[]           // 命中任一 tag 即可（OR）
    organ?:    string              // 来源器官 key
    effect?:   string              // use interaction 里含此 effect key
    costRange?: [number, number]   // 费用区间 [min, max]（含端点）
    count?:    number              // 保留数量（默认全部）
    random?:   boolean             // 是否洗牌后再取（默认 false）
}
```

**多条件是 AND 关系**：所有字段同时满足。`tags` 内部是 OR，字段之间是 AND。

```typescript
{
    tags: ["attack", "skill"],   // 攻击 OR 技能
    costRange: [0, 2]            // AND 费用 0-2
}
```

## 筛选顺序

`selectCards(availableCards, selector)`：

```
1. key      → 精确匹配（若指定）
2. tags     → 命中任一 tag
3. organ    → 通过 card.source.__key 匹配来源器官
4. effect   → 在 use interaction 的 effects[] 里找到匹配 key
5. costRange → 读 card.status["cost"] 判断
6. random   → Fisher-Yates 洗牌
7. count    → 取前 N 张（在 random 之后，所以是随机选 N 张）
```

**关键实现细节**：`organ` 字段通过 `'__key' in card.source && (card.source as any).__key === organKey` 判断，用 `__key` 属性代替 `instanceof Organ` 避免循环依赖。

## 使用示例

### 敌人 AI 行动选牌

```typescript
// 玩家 HP < 50% 时用攻击
behavior: [{
    condition: { playerHealth: { below: 50 } },
    action: {
        selector: { tags: ["attack"], count: 1, random: true }
    }
}]
```

### 玩家效果按条件选手牌

```typescript
{
    key: "chooseHandCard",
    params: {
        selector: { tags: ["attack"], costRange: [0, 2] },
        min: 1,
        max: 3
    }
}
```

### 遗物触发条件

```typescript
{
    action: "damage",
    triggerTarget: { faction: "enemy" },
    checkSelector: { organ: "original_organ_00002" }   // 仅当卡来自该器官
}
```

### 空对象 = 不筛选

```typescript
selector: {}    // 返回全部
```

## 验证 API

```typescript
validateCardSelector(selector) → boolean
    检查 costRange 端点合法（min ≥ 0, max ≥ min）
    检查 count ≥ 0
    空对象合法
```

## 相关

    [[卡牌系统]] — Card 类与生命周期
    [[敌人AI系统]] — behavior/pattern 中 selector 用法
    [[词条系统]] — Entry 与 Tag 的差别
