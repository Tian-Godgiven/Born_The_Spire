# TypeScript 编译错误修复清单

总计：87个错误 → 23个错误

已修复：64个错误

最后更新：2026-03-07

## 修复进度

- ✅ 已修复：64/87 (73.6%)
- 🔄 剩余：23/87 (26.4%)
  - 严重错误：11个
  - TS6133 未使用变量警告：12个

---

## ✅ 已修复的错误类别

### 1. Promise/Async 相关错误（15个）✅
- Enemy.ts 中的 getAvailableCards 相关错误
- 所有 await/async 不匹配问题已修复

### 2. 类型定义缺失（8个）✅
- EffectFunc 导出问题
- MechanismUIConfig icon 属性
- RoomType 缺失类型（treasure, floorSelect, eliteBattle）

### 3. 属性访问错误（12个）✅
- Player.cards 改为使用 CardModifier
- organ.rarity 改为 organ.quality
- getCardDataByKey 改为 cardList.find()

### 4. 类型不匹配（15个）✅
- Status.addByJSON 使用修正
- Entity/Chara 类型检查
- discount 类型问题
- RoomTypeWeights 类型兼容性

### 5. 其他修复（14个）✅
- EventRoom sceneData 初始化
- MechanismManager markRaw 包装
- MapView treasure 类型支持
- CustomTriggerConfig Effect | null 支持

---

## 🔄 剩余错误（23个）

### 严重错误（11个）

#### random.ts (1个)
- `random.ts:254` - SeededRandom 类型缺少 seed, hashString 属性

#### CardChoice.vue (1个)
- `CardChoice.vue:135` - mechanisms 属性类型不兼容（可能已通过 markRaw 修复，需验证）

#### OrganChoice.vue (2个)
- `OrganChoice.vue:51` - organOptions 属性不存在
- `OrganChoice.vue:52` - selectCount 属性不存在

#### RewardPage.vue (1个)
- `RewardPage.vue:198` - markAsClaimed 方法不存在

#### chooseTarget.ts (5个)
- `chooseTarget.ts:76` - "opponent" 不能赋值给 "player" | "enemy"
- `chooseTarget.ts:157,166,228,340,348` - Target[] 类型不匹配

#### targetManager.ts (1个)
- `targetManager.ts:145` - Target[] 类型不匹配

### TS6133 未使用变量警告（12个）
- EventRoom.ts:38 - _currentSceneKey
- Current.ts:58 - T
- Entity.ts:82 - T
- MapView.vue:88 - nodeRadius
- TestTool.vue:28 - getPotionModifier
- popUp.ts:11 - cardList
- Potion.ts:10 - discard
- mechanismRegistry.ts:209 - _current
- RewardPage.vue:132 - rewardTitle
- cardChoice.ts:7 - randomChoices
- organChoice.ts:2 - OrganMap

---

## 修复策略

### 下一步优先级
1. 修复 random.ts SeededRandom 类型问题
2. 修复 OrganChoice.vue 配置接口问题
3. 修复 RewardPage.vue markAsClaimed 方法
4. 修复 chooseTarget.ts 类型问题
5. 清理 TS6133 未使用变量警告（低优先级）
// Enemy.ts 的 getAvailableCards 函数体内的 for 循环需要改成 async
// 或者整个函数逻辑需要重构
```

#### enemyTurn.ts - selectAction 调用
- `enemyTurn.ts:51` - Promise<Card[]> 没有 length 属性
- `enemyTurn.ts:56` - Promise<Card[]> 不能赋值给 Card[]
- `enemyTurn.ts:133` - Promise<Card[]> 没有 length 属性
- `enemyTurn.ts:134` - Promise<Card[]> 不能赋值给 Card[]

**修复方案**：
```typescript
// enemyTurn.ts 中调用 selectAction 的地方需要 await
const selectedCards = await selectAction(...)
```

#### cardChoice.ts
- `cardChoice.ts:228` - Promise<Card>[] 不能赋值给 Card[]
- `cardChoice.ts:130` - Promise<Card>[] 不能赋值给 Card[]

**修复方案**：
```typescript
// 使用 Promise.all 等待所有 Promise 完成
const cards = await Promise.all(promises)
```

#### TestCardPanel.vue
- `TestCardPanel.vue:58` - Promise<Card> 没有 owner 属性
- `TestCardPanel.vue:63` - Promise<Card> 不能赋值给 Card

**修复方案**：
```typescript
// 需要 await getCardByKey()
const card = await getCardByKey(...)
```

---

### 2. 类型定义缺失/错误（约10个）

#### gainArmor.ts
- `gainArmor.ts:5` - EffectFunc 未导出
- `gainArmor.ts:14` - 参数隐式 any 类型

**修复方案**：
```typescript
// 在 Effect.ts 中导出 EffectFunc
export type EffectFunc = ...
```

#### cardRemove.ts
- `cardRemove.ts:13,15` - Player 没有 cards 属性

**修复方案**：
```typescript
// Player 应该通过 CardModifier 访问卡牌，不是直接访问 cards 属性
const cardModifier = getCardModifier(player)
const cards = cardModifier.getCards()
```

#### cardUpgrade.ts
- `cardUpgrade.ts:2` - getCardDataByKey 不存在，应该是 getCardByKey

**修复方案**：
```typescript
import { getCardByKey } from "@/static/list/item/cardList"
```

#### MechanismConfig.ts
- `MechanismConfig.ts:9` - 找不到模块 '@/core/objects/system/Effect'

**修复方案**：
```typescript
// 修正导入路径
import type { EffectFunc } from "@/core/objects/system/effect/Effect"
```

#### ChooseSource.vue & chooseTarget.ts
- `ChooseSource.vue:14` - TargetType 未导出
- `chooseTarget.ts:4` - TargetType 未导出

**修复方案**：
```typescript
// 在 chooseTargetType.ts 中导出 TargetType
export type TargetType = ...
```

---

### 3. 属性访问错误（约8个）

#### blackStoreItemPool.ts
- `blackStoreItemPool.ts:138` - OrganMap 没有 rarity 属性（应该用 quality）
- `blackStoreItemPool.ts:146` - RelicMap 没有 rarity 属性
- `blackStoreItemPool.ts:154` - PotionMap 没有 rarity 属性

**修复方案**：
```typescript
// 器官用 quality，遗物和药水暂时没有稀有度系统
rarity: organ.quality  // 或 undefined
```

#### OrganChoice.vue
- `OrganChoice.vue:51` - organOptions 不存在（应该用 organKeys）
- `OrganChoice.vue:52` - selectCount 不存在（应该用 maxSelect）

**修复方案**：
```typescript
// 更新 Vue 组件使用新的接口
config.organKeys
config.maxSelect
```

#### RewardPage.vue
- `RewardPage.vue:198` - markAsClaimed 不存在

**修复方案**：
```typescript
// 检查 Reward 类是否有 markAsClaimed 方法
// 可能需要改成 reward.state = "claimed"
```

---

### 4. 类型不匹配（约10个）

#### BlackStoreRoom.ts
- `BlackStoreRoom.ts:468` - number | undefined 不能赋值给 number
- `BlackStoreRoom.ts:471` - discount 可能是 undefined
- `BlackStoreRoom.ts:487` - number | undefined 不能赋值给 number
- `BlackStoreRoom.ts:490` - number | undefined 不能赋值给 number

**修复方案**：
```typescript
// 添加类型守卫或默认值
const discount = this.organDiscounts.get(organ.key) ?? 0.5
```

#### Room.ts & MapView.vue
- `Room.ts:104,120` - 缺少 floorSelect, eliteBattle, treasure 属性
- `MapView.vue:207,222` - 缺少 treasure 属性

**修复方案**：
```typescript
// 在 RoomType 映射中添加缺失的房间类型
const roomTypeMap: Record<RoomType, string> = {
  // ... 现有类型
  floorSelect: "层级选择",
  eliteBattle: "精英战斗",
  treasure: "宝箱"
}
```

#### gainItem.ts
- `gainItem.ts:39` - Entity 不能赋值给 Chara

**修复方案**：
```typescript
// 添加类型检查
if (target instanceof Chara) {
  // ...
}
```

#### mechanismRegistry.ts
- `mechanismRegistry.ts:233` - number 不能赋值给 string
- `mechanismRegistry.ts:269,276` - effect 可能是 null
- `mechanismRegistry.ts:270` - 类型不匹配
- `mechanismRegistry.ts:418` - icon 不存在于 MechanismUIConfig

**修复方案**：需要逐个检查修复

#### chooseTarget.ts & targetManager.ts
- 多处类型不匹配错误（约5个）

**修复方案**：需要检查 Target 类型定义

---

### 5. 其他严重错误（约7个）

#### addFirstTurnDraw.ts
- `addFirstTurnDraw.ts:15` - 运算符 <= 不能应用于这些类型
- `addFirstTurnDraw.ts:38` - 运算符 + 不能应用于这些类型

**修复方案**：
```typescript
// 添加类型断言或类型守卫
const value = Number(effect.params.value)
```

#### cardUpgrade.ts
- `cardUpgrade.ts:27` - unknown 不能赋值给 number

**修复方案**：
```typescript
// 添加类型断言
const level = Number(organ.level)
```

#### heal.ts
- `heal.ts:41` - 期望2个参数但传了3个

**修复方案**：检查函数签名

#### RoomSelectRoom.ts
- `RoomSelectRoom.ts:35` - choiceGroup 没有初始化
- `RoomSelectRoom.ts:107,143` - choiceGroup 是只读属性

**修复方案**：
```typescript
// 移除 readonly 修饰符或在构造函数中初始化
private choiceGroup!: ChoiceGroup
```

#### MapGenerator.ts
- `MapGenerator.ts:354,364,371,379` - RoomType 不能用于索引 RoomTypeWeights
- `MapGenerator.ts:386,577` - RoomTypeWeights 不能赋值给 Record<string, number>

**修复方案**：
```typescript
// 添加索引签名
interface RoomTypeWeights {
  [key: string]: number
  // ... 其他属性
}
```

---

## 🟡 低优先级警告（不影响运行）

### 未使用变量 (TS6133) - 约20个

这些是未使用的变量警告，不影响运行，但应该清理：

- `cardUpgradeEffect.ts:12` - event
- `EventRoom.ts:38` - currentSceneKey
- `current.ts:58` - T
- `Entity.ts:82` - T
- `MapGenerator.ts:9` - resolveLayerIndex
- `MapGenerator.ts:341` - node
- `MechanismManager.ts:140` - key
- `Enemy.ts:30,36` - i (参数类型)
- `popUp.ts:11` - cardList
- `Potion.ts:10` - discard
- `mechanismRegistry.ts:209` - current
- `mechanismRegistry.ts:399` - event
- `rewardRegistry.ts:6` - RewardConfig
- `RewardPage.vue:132` - rewardTitle
- `cardChoice.ts:7` - randomChoices
- `organChoice.ts:2` - OrganMap
- `MapView.vue:88` - nodeRadius
- `TestTool.vue:28` - getPotionModifier

**修复方案**：
```typescript
// 方案1：删除未使用的变量
// 方案2：如果是参数，用下划线前缀表示故意不使用
function foo(_unusedParam: string) { }
```

---

## 修复优先级建议

1. **第一批**：Promise/Async 相关（影响战斗系统）
   - Enemy.ts getAvailableCards
   - enemyTurn.ts selectAction 调用
   - cardChoice.ts Promise 处理

2. **第二批**：类型定义缺失
   - EffectFunc 导出
   - TargetType 导出
   - 模块路径修正

3. **第三批**：属性访问错误
   - OrganChoice.vue 接口更新
   - blackStoreItemPool.ts rarity 问题
   - Player.cards 访问方式

4. **第四批**：类型不匹配
   - BlackStoreRoom.ts undefined 处理
   - Room.ts 房间类型补全
   - MapGenerator.ts 索引签名

5. **第五批**：清理警告
   - 删除未使用变量
   - 添加类型注解

---

## 修复进度

- [x] Promise/Async 相关（15/15）✅ 已完成
- [x] 类型定义缺失（8/10）✅ 基本完成
- [x] 属性访问错误（8/8）✅ 已完成
- [x] 类型不匹配（10/10）✅ 已完成
- [x] 其他严重错误（7/7）✅ 已完成
- [ ] 未使用变量警告（0/20）

**已修复**：48/87
**剩余**：39/87（主要是未使用变量警告）

---

## 注意事项

1. 修复 Promise 相关错误时，注意函数调用链，可能需要连锁修改多个文件
2. 修复类型定义时，优先检查是否有现成的类型可用
3. 修复属性访问时，注意是否需要更新相关文档
4. 每修复一批错误后，运行 `npm run build` 验证
5. 优先修复影响核心战斗流程的错误

---

## 相关命令

```bash
# 检查所有 TypeScript 错误
npm run build

# 只检查类型，不构建
npx vue-tsc --noEmit

# 统计错误数量
npm run build 2>&1 | grep "error TS" | wc -l

# 查看特定文件的错误
npm run build 2>&1 | grep "Enemy.ts"
```
