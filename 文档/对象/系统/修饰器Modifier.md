# 修饰器

修饰器是管理实体所持有/获得的属性、物品和状态的【更新】的api。

修饰器的主要作用是提供【更简便地处理获取和失去某物的接口】，并这些过程中【及时+正确地更新实体的信息】。

说的更简单一点，在你获得xx时，你往往会为其添加“获得xx时的效果”，但很可能不想/忘记定义一个“失去xx时，失去这些效果”，而修饰器就是用来在自动地处理“失去xx时，失去添加的那些的效果”的内容

eg：对于器官【厚皮】，你定义了：[在获得这个器官时：生命值+10]
    但你不需要定义[在失去这个器官时：生命值-10]
    因为在失去器官时，我们会同步移除该器官添加的修饰器，并用剩下的内容再次计算生命值

ps：这并不代表你不可以获取/定义“失去xx时”的触发，修饰器仅仅是简化了“撤除获得时的效果”的过程

修饰器的原理是：在你获得or失去某物时，更新修饰器栈，然后重新计算一次修饰器栈内存放的对象们的效果。

修饰器的内容的变更只能通过
1.由效果添加或移除
2.在添加修饰器时，返回的移除回调


## 功能

修饰器的主要功能包含如下3点

1.管理当前获取的对象：包括新增，删除和修改，另外还需要提供查询的接口即增删改查
2.刷新当前的状态：用当前已有的对象和规定的计算方法来刷新持有者的状态，不同的修饰器会有不同的刷新时机，有些会在新增或删除时刷新，有些会特定的时刻刷新（例如战斗结束时会清空所有“状态”然后刷新一次）
3.通过刷新来唯一地修改持有者的某些属性，这样做可以让“修改属性”这一重要操作只在修饰器的权限之下进行


## 基类属性

uuId:唯一Id
source:修饰器的来源
modifierFunc:修饰器在计算时会触发的函数，用其返回值修饰目标
ifDisabled:是否可用，禁用修饰器会使得其不再刷新

此外，在创建修饰器的同时，也会返回如下结构
{
    remove:移除修饰器的函数,
    uuId:该修饰器的唯一Id
}
    
通常情况下，修饰器并不会被直接操作，而是通过使用移除函数将修饰器对象从当前位置删除，但你也可以通过uuId来尝试获取修饰器





# 属性修饰器

即属性Status的修饰器，负责更新对象各类属性值，按照属性值的key值分类，存储于_modifier中

eg:

attack:{
    baseValue:xxxx, //攻击力的基础值
    value:xxxx, //攻击力的当前数值
    _modifier:[……] //攻击力的修饰器
}

在对象获取属性的增减时，本质上是在获取/失去该属性的修饰器，并根据现有的修饰器计算当前的属性值

## 修饰器对象的结构

{
    // 基本
    id: string,                  // 唯一标识
    source: any,                 // 来源对象（卡牌/器官/遗物/事件等）
    statusKey: string,           // 作用的属性键
    targetLayer: "base" |
                 "current",      // 作用的分层，base作用于基础层，current作用于当前层
    modifierType: "additive" | 
                  "multiplicative" | 
                  "function",     // 计算类型，分别为加减法、乘除法、修改函数
    applyMode: "absolute" | "snapshot" , // 应用模式，分别为直接修改和快照修改，快照模式会保存
    timeStamp: number,            // 添加的时间戳，表示顺序，快照类型的修饰器会以此排序
    // 快照记录：只存在于snapshot模式下，快照记录用于在重算时加入当时值作为参考
    snapshotValue?: number,     // 添加当下“当前值”快照（current层常用）
    snapshotBaseValue?: number, // 添加当下“基础值”快照（差值计算可用）
    value: number,   //计算值，若为加减法则直接加此值，若为乘除法则乘以此值，若为修改函数，则将此值作为参数传递
}

## 参与的接口

属性修饰器一般都是通过changeStatus方法添加，并获取卸载函数，在需求的时机卸载的。
我们一般不通过手动卸载属性修饰器来减少对象的属性
每当属性修饰器出现变化时，都会重新计算当前的属性值，当前属性值对外是只读的




# 内容修饰器

通常情况下指物品的修饰器，也包括器官的修饰器

内容修饰器的定义与属性修饰器没有太大的区别，只不过内容修饰器还会存储与其相关的对象实例
例如：【恶性肿瘤】：[在获得这个器官时，获得3张【癌细胞】卡牌]，其对应的卡牌修饰器会存储这3张卡牌的实例对象(创建这3张卡牌对象的步骤并不在这里！)

### 独特属性

路径path：你需要为内容修饰器设定存储路径，通常建议放在：对象/内容/_modifier下
例如：[organ]表示在 entity.organ._modifier 下,
    [item,potion]表示在 entiy.item.potion._modifier 下

## 新增修饰器类型

### StateModifier（状态修饰器）

管理 Target 身上的所有状态（State）及其副作用。

**位置**：`src/core/objects/system/modifier/StateModifier.ts`

**主要功能**：
- 添加/移除状态
- 管理状态的触发器
- 处理状态层数变化
- 自动清理状态相关的副作用

**核心方法**：
```typescript
// 添加状态
stateModifier.addState(stateData, stacks, source)

// 移除状态
stateModifier.removeState(stateKey, triggerRemoveEffect)

// 修改状态层数
stateModifier.changeStack(stateKey, stackKey, delta)

// 获取状态
const state = stateModifier.getState(stateKey)
```

**使用示例**：
```typescript
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"

const stateModifier = getStateModifier(player)

// 添加中毒状态，3层
stateModifier.addState(poisonStateData, 3, source)

// 每回合减少1层
stateModifier.changeStack("poison", "default", -1)
```

### ReserveModifier（储备修饰器）

管理玩家的储备资源（金钱、物质等）。

**位置**：`src/core/objects/system/modifier/ReserveModifier.ts`

**主要功能**：
- 获得/消耗储备资源
- 检查储备是否足够
- 响应式更新 UI

**核心方法**：
```typescript
// 获得储备
reserveModifier.gainReserve(reserveKey, amount, source)

// 消耗储备
reserveModifier.spendReserve(reserveKey, amount, source)

// 检查是否足够
const canAfford = reserveModifier.canAfford(reserveKey, amount)

// 获取当前数量
const gold = reserveModifier.getReserve("gold")
```

**使用示例**：
```typescript
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"

const reserveModifier = getReserveModifier(player)

// 获得50金币
reserveModifier.gainReserve("gold", 50, rewardSource)

// 消耗30物质
if (reserveModifier.canAfford("material", 30)) {
    reserveModifier.spendReserve("material", 30, upgradeSource)
}
```

### PotionModifier（药水修饰器）

管理玩家的药水持有和使用。

**位置**：`src/core/objects/system/modifier/PotionModifier.ts`

**主要功能**：
- 添加/移除药水
- 使用药水
- 管理药水槽位
- 响应式更新 UI

**核心方法**：
```typescript
// 添加药水
potionModifier.addPotion(potion)

// 移除药水
potionModifier.removePotion(potion)

// 使用药水
potionModifier.usePotion(potion, target)

// 获取所有药水
const potions = potionModifier.getPotions()
```

**使用示例**：
```typescript
import { getPotionModifier } from "@/core/objects/system/modifier/PotionModifier"

const potionModifier = getPotionModifier(player)

// 获得一瓶治疗药水
const healingPotion = createPotion("healing_potion")
potionModifier.addPotion(healingPotion)

// 使用药水
potionModifier.usePotion(healingPotion, player)
```

### OrganModifier（器官修饰器）

管理玩家的器官持有和升级。

**位置**：`src/core/objects/system/modifier/OrganModifier.ts`

**主要功能**：
- 添加/移除器官
- 升级器官
- 管理器官相关的卡牌和属性修饰器
- 自动清理器官失去时的副作用

**核心方法**：
```typescript
// 添加器官
organModifier.addOrgan(organ)

// 移除器官
organModifier.removeOrgan(organ)

// 升级器官
organModifier.upgradeOrgan(organ)

// 获取所有器官
const organs = organModifier.getOrgans()
```

**使用示例**：
```typescript
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"

const organModifier = getOrganModifier(player)

// 获得一个器官
const heartOrgan = createOrgan("heart")
organModifier.addOrgan(heartOrgan)

// 升级器官
organModifier.upgradeOrgan(heartOrgan)
```

### CardModifier（卡牌修饰器）

管理玩家的卡组。

**位置**：`src/core/objects/system/modifier/CardModifier.ts`

**主要功能**：
- 添加/移除卡牌
- 获取所有卡牌
- 管理卡牌来源追踪

**核心方法**：
```typescript
// 添加卡牌
cardModifier.addCard(card, source)

// 移除卡牌
cardModifier.removeCard(card)

// 获取所有卡牌
const allCards = cardModifier.getAllCards()
```

## 修饰器与 Vue 响应式系统

### 自动清理机制

修饰器的核心优势是**自动清理**。当你失去某个物品/器官时，不需要手动撤销它添加的所有效果：

```typescript
// 获得器官时
organ.onAcquire = () => {
    // 添加属性修饰器
    changeStatusValue(player, "max-health", organ, { value: 10 })

    // 添加卡牌
    cardModifier.addCard(newCard, organ)

    // 添加触发器
    player.appendTrigger({ ... })
}

// 失去器官时 - 不需要手动清理！
// 修饰器系统会自动：
// 1. 移除所有来源为该器官的属性修饰器
// 2. 移除所有来源为该器官的卡牌
// 3. 移除所有来源为该器官的触发器
// 4. 重新计算属性值
```

### markRaw 的使用

当修饰器管理的对象包含内部 ref/reactive 结构时，需要使用 `markRaw()` 保护：

```typescript
// ✅ 正确 - 保护 Status 对象
entity.status[key] = markRaw(status)

// ✅ 正确 - 保护包含 ref 的对象
const modifier = new StatusModifier(...)
entity.statusModifiers.push(markRaw(modifier))

// ❌ 错误 - 直接添加会被 reactive 破坏
entity.status[key] = status  // Status 内部的 ref 会被解包
```

**为什么需要 markRaw**：
- Entity 对象被 `reactive()` 包装
- Vue 会递归转换所有嵌套对象
- Status/Modifier 等对象内部有 `ref()` 字段
- 如果被 reactive 处理，ref 会被"解包"成普通值
- 使用 `markRaw()` 告诉 Vue 跳过这些对象

### 响应式更新

修饰器的变化会自动触发 UI 更新：

```typescript
// 储备修饰器使用 ref 存储数据
class ReserveModifier {
    public reserves = ref<Record<string, number>>({})

    gainReserve(key: string, amount: number) {
        this.reserves.value[key] += amount
        // UI 自动更新
    }
}

// 在 Vue 组件中
const reserveModifier = getReserveModifier(player)
const gold = computed(() => reserveModifier.reserves.value.gold)
// gold 会自动响应变化
```

## 实际使用示例

### 完整的器官获得流程

```typescript
// 1. 创建器官
const organ = new Organ(organData)

// 2. 通过 OrganModifier 添加
const organModifier = getOrganModifier(player)
organModifier.addOrgan(organ)

// 3. OrganModifier 自动处理：
//    - 添加器官到 player.organs
//    - 应用器官的 possess 交互
//    - 添加器官提供的卡牌
//    - 添加器官的属性修饰器
//    - 添加器官的触发器

// 4. 失去器官时
organModifier.removeOrgan(organ)

// 5. OrganModifier 自动清理：
//    - 移除器官
//    - 移除所有相关的卡牌
//    - 移除所有相关的属性修饰器
//    - 移除所有相关的触发器
//    - 重新计算属性值
```

### 水池房间的物质获得

```typescript
// 在水池房间的汲取行为中
private async onAbsorb(): Promise<void> {
    const amount = this.absorbAmount  // 50 + layer * 10

    // 通过 ReserveModifier 添加物质
    const reserveModifier = getReserveModifier(nowPlayer)
    reserveModifier.gainReserve("material", amount, this)

    // UI 自动更新显示新的物质数量
}
```






