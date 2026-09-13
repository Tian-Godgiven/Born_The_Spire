/**
 * SlayTheSpire Mod - 事件汇总
 */

import { bigFishEvent } from './bigFish'
import { goldenIdolEvent } from './goldenIdol'
import { faceTraderEvent } from './faceTrader'
// colosseumEvent 先不注册：两场嵌入战斗还没定，数据仍在 colosseum.ts

export const slayTheSpireEvents = [
    bigFishEvent,
    goldenIdolEvent,
    faceTraderEvent
]
