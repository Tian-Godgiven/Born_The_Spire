# Mod系统开发指南

Born The Spire 的 Mod 系统允许开发者扩展游戏内容（卡牌、器官、遗物、敌人等）。

## 基本信息

Mod 是游戏内容的扩展包，可以独立于主代码进行开发和维护。

### 必需文件
- `mod.ts` - Mod 元信息
- `index.ts` - Mod 内容注册入口

### 可选目录
- `relics/` - 遗物
- `effects/` - 效果
- `organs/` - 器官
- `enemies/` - 敌人
- `cards/` - 卡牌

## 目录结构

```
src/mods/{mod-id}/
├── mod.ts           # Mod元信息（必需）
├── index.ts         # 注册入口（必需）
├── relics/          # 遗物
├── effects/         # 效果
├── organs/          # 器官
├── enemies/         # 敌人
└── cards/           # 卡牌
```

## Mod 配置

### mod.ts - Mod 元信息

```typescript
import type { ModConfig } from '@/mods/ModLoader'

export const yourModConfig: ModConfig = {
    id: 'your_mod_id',           // 必需：唯一标识符，建议使用小写字母和下划线
    name: 'Your Mod Name',       // 必需：显示名称
    version: '1.0.0',            // 必需：版本号
    author: 'Your Name',         // 可选：作者
    description: 'Mod 描述'       // 可选：描述
}
```

### index.ts - 注册入口

```typescript
import type { Mod } from '@/mods/ModLoader'
import { yourModConfig } from './mod'
import { registerRelic, registerEffect, registerOrgan, registerEnemy } from '@/mods/index'

// 导入内容
import { yourRelic } from './relics/yourRelic'
import { yourEffect } from './effects/yourEffect'
import { yourOrgan } from './organs/yourOrgan'
import { yourEnemy } from './enemies/yourEnemy'

export const yourMod: Mod = {
    config: yourModConfig,

    load: async () => {
        console.log(`[Mod:${yourModConfig.id}] 开始加载...`)

        // 注册内容
        registerEffect(yourEffect)
        registerRelic(yourRelic)
        registerOrgan(yourOrgan)
        registerEnemy(yourEnemy)

        console.log(`[Mod:${yourModConfig.id}] 加载完成`)
    }
}
```

## 命名规范

### Key 格式
所有 Mod 内容的 key 必须使用命名空间前缀：
```
{mod-id}_{type}_{6位数字}
```

### 示例
```
xdnmb_relic_000001      # 遗物
xdnmb_organ_000002      # 器官
xdnmb_enemy_000003      # 敌人
xdnmb_card_000004       # 卡牌
xdnmb_effect_000005     # 效果
```

### 有效 mod-id
- `xdnmb`
- `custom_content`
- `my_extension`

## 内容定义

### 遗物 (Relic)

```typescript
import type { RelicMap } from '@/core/objects/item/Relic'

export const yourRelic: RelicMap = {
    label: '你的遗物',
    key: 'your_mod_relic_000001',
    describe: ['遗物描述'],
    rarity: 'uncommon',
    status: {
        'value': 10
    },
    interaction: {
        possess: {
            target: { key: 'self' },
            effects: [],
            triggers: []
        }
    }
}
```

### 器官 (Organ)

```typescript
import type { OrganMap } from '@/core/objects/target/Organ'
import { OrganRarity, OrganPartEnum } from '@/core/types/OrganTypes'

export const yourOrgan: OrganMap = {
    label: '你的器官',
    key: 'your_mod_organ_000001',
    describe: ['器官描述'],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
    status: {
        'max-mass': 20
    },
    current: ['mass'],
    interaction: {
        possess: {
            target: { key: 'self' },
            effects: []
        }
    }
}
```

### 敌人 (Enemy)

```typescript
import type { EnemyMap } from '@/core/objects/target/Enemy'

export const yourEnemy: EnemyMap = {
    label: '你的敌人',
    key: 'your_mod_enemy_000001',
    status: {
        'max-health': 50
    },
    organ: [
        'your_mod_organ_000001'
    ],
    cards: [
        'enemy_stone_strike'  // 引用原版卡牌
    ],
    behavior: {
        patterns: [],
        fallback: {
            action: {
                selector: { tags: ['attack'] },
                mode: 'random'
            },
            describe: '随机攻击'
        }
    }
}
```

### 效果 (Effect)

```typescript
import type { EffectData } from '@/mods/index'

export const yourEffect: EffectData = {
    label: '你的效果',
    key: 'your_mod_effect_000001',
    effect: (event, effect, context) => {
        // 效果实现
        console.log('效果触发')
        return 0
    },
    preview: (event, effect) => {
        // 预览实现（可选）
        return 0
    }
}
```

## 快速开始模板

### 新建 Mod 包

1. 在 `src/mods/` 下新建目录 `src/mods/{your-mod-id}/`

2. 创建 `mod.ts`:

```typescript
import type { ModConfig } from '@/mods/ModLoader'

export const yourModConfig: ModConfig = {
    id: 'your_mod_id',
    name: '你的 Mod',
    version: '0.1.0',
    author: '作者',
    description: '描述'
}
```

3. 创建 `index.ts`:

```typescript
import type { Mod } from '@/mods/ModLoader'
import { yourModConfig } from './mod'
import { registerRelic } from '@/mods/index'
import { yourRelic } from './relics/yourRelic'

export const yourMod: Mod = {
    config: yourModConfig,

    load: async () => {
        console.log(`[Mod:${yourModConfig.id}] 开始加载...`)
        registerRelic(yourRelic)
        console.log(`[Mod:${yourModConfig.id}] 加载完成`)
    }
}
```

4. 在 `loader.ts` 中注册 Mod:

```typescript
import { modLoader } from './ModLoader'
import { yourMod } from './your_mod_id'

function registerAllMods(): void {
    modLoader.registerMod(yourMod)
}

export async function loadAllMods(): Promise<void> {
    registerAllMods()
    await modLoader.loadAllMods()
}
```

## 最佳实践

### 1. 内容复用
- 优先引用原版内容，避免重复定义
- 示例：敌人使用 `enemy_stone_strike` 而不是新建同名卡牌

### 2. 错误处理
Mod 加载失败不应阻止游戏启动：

```typescript
load: async () => {
    try {
        // 加载逻辑
    } catch (error) {
        console.error(`[Mod] 加载失败:`, error)
    }
}
```

### 3. 文件组织
- 相关内容放在同一目录
- 大量内容可以再细分目录
- 保持 import 路径清晰

### 4. 文档
每个 Mod 应包含：
- README.md 说明如何使用
- 版本更新日志
- 坐标方式（如需要）

## 注意事项

1. Mod 必须在懒加载完成后、容器初始化前加载
2. Mod 内容 key 必须全局唯一
3. 避免循环依赖
4. 使用 `import` 而非 `require()`
5. Mod 加载日志建议使用 `[Mod:{id}]` 前缀

## 相关文件

- `src/mods/ModLoader.ts` - Mod 加载核心
- `src/mods/index.ts` - 注册函数接口
- `src/mods/loader.ts` - Mod 加载入口
- `src/mods/xdnmb/` - 示例 Mod（已实现）
