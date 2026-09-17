/**
 * 无常之神：文案与回合规则。
 * 数值抽取、庄家权重在 eventEffectMap 的 godOfChance_* 里。
 */

export const GOD_OF_CHANCE_URGENCY = ["可以", "或许应该", "理应", "必须", "定将", "不得不"]

export const GOD_OF_CHANCE_MAX_ROUND = 6

/** 赢只走中/大。按把：95/5、85/15、80/20、50/50、20/80、5/95 */
export const GOD_OF_CHANCE_WIN_SIZE_WEIGHTS: ReadonlyArray<readonly [number, number]> = [
    [95, 5],
    [85, 15],
    [80, 20],
    [50, 50],
    [20, 80],
    [5, 95],
]

export function godOfChanceIsHouseFirst(round: number): boolean {
    return round <= 3
}

export function godOfChanceUrgency(round: number): string {
    return GOD_OF_CHANCE_URGENCY[Math.max(0, Math.min(round, GOD_OF_CHANCE_MAX_ROUND) - 1)]
        ?? GOD_OF_CHANCE_URGENCY[5]
}

export function godOfChanceResultLine(data: any): string {
    if (data.lastPlayerFace == null || data.lastHouseFace == null || !data.lastTell) return ""
    if (data.lastTie) {
        return `你掷出 ${data.lastPlayerFace} 点，与对面持平。相同也算你输。${data.lastTell}。`
    }
    if (data.lastWon) {
        return `你掷出 ${data.lastPlayerFace} 点，压过对面的 ${data.lastHouseFace} 点。${data.lastTell}。`
    }
    return `你掷出 ${data.lastPlayerFace} 点，没能压过对面的 ${data.lastHouseFace} 点。${data.lastTell}。`
}

export function godOfChanceStartLine(round: number, data: any): string {
    if (godOfChanceIsHouseFirst(round)) {
        if (round === 1) {
            if (!data.houseRevealed || data.houseFace == null) {
                return "随着你接近，一枚骰子停在了……"
            }
            return `随着你接近，一枚骰子停在了${data.houseFace}点。`
        }
        if (!data.houseRevealed || data.houseFace == null) {
            return "紧接着，那枚骰子又旋转起来……"
        }
        return `紧接着，那枚骰子又旋转起来……最终停在了${data.houseFace}点。`
    }
    const word = godOfChanceUrgency(round)
    return `这一次，要你先伸手。停下之后，对面才会亮出点数。你【${word}】出手。`
}

export function godOfChancePromptLine(data: any): string {
    if (data.resolved) return ""
    const round = data.round ?? 1
    if (!godOfChanceIsHouseFirst(round)) return ""
    if (!data.houseRevealed || data.houseFace == null) return ""
    return `而另一枚，你【${godOfChanceUrgency(round)}】让它停下`
}

export function godOfChanceTableText(data: any): string {
    const round = data.round ?? 1
    const result = godOfChanceResultLine(data)
    if (data.resolved) {
        if (round >= GOD_OF_CHANCE_MAX_ROUND) {
            return "骰子继续旋转，但你已经无法让它停下了。"
        }
        return result
    }
    const start = godOfChanceStartLine(round, data)
    return result ? `${result}/br/${start}` : start
}
