/**
 * 基于种子的随机数生成器
 * 使用 Mulberry32 算法，保证相同种子产生相同的随机序列
 */
export class SeededRandom {
  private seed: number

  constructor(seed: string | number) {
    // 将字符串种子转换为数字
    if (typeof seed === 'string') {
      this.seed = this.hashString(seed)
    } else {
      this.seed = seed
    }
  }

  /**
   * 将字符串转换为数字哈希
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * 生成下一个随机数 [0, 1)
   * 使用 Mulberry32 算法
   */
  next(): number {
    this.seed += 0x6D2B79F5
    let t = this.seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * 生成指定范围内的随机整数 [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /**
   * 生成 [0, 1) 范围的浮点数
   */
  nextFloat(): number {
    return this.next()
  }

  /**
   * 生成 [min, max) 范围的浮点数
   */
  nextFloatRange(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  /**
   * 根据概率返回 true/false
   * @param probability 概率 [0, 1]
   */
  chance(probability: number): boolean {
    return this.next() < probability
  }

  /**
   * 从数组中随机选择一个元素
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot choose from empty array")
    }
    const index = this.nextInt(0, array.length - 1)
    return array[index]
  }

  /**
   * 从数组中随机选择多个元素（不重复）
   * @param array 源数组
   * @param count 选择数量
   */
  choices<T>(array: T[], count: number): T[] {
    if (count > array.length) {
      throw new Error(`Cannot choose ${count} items from array of length ${array.length}`)
    }
    const shuffled = this.shuffle(array)
    return shuffled.slice(0, count)
  }

  /**
   * 从数组中随机选择多个元素（可重复）
   * @param array 源数组
   * @param count 选择数量
   */
  choicesWithReplacement<T>(array: T[], count: number): T[] {
    const result: T[] = []
    for (let i = 0; i < count; i++) {
      result.push(this.choice(array))
    }
    return result
  }

  /**
   * 打乱数组（Fisher-Yates shuffle）
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /**
   * 根据权重随机选择
   * @param items 选项数组
   * @param weights 权重数组（必须与 items 长度相同）
   */
  weightedChoice<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error("Items and weights must have same length")
    }
    if (items.length === 0) {
      throw new Error("Cannot choose from empty array")
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = this.nextFloat() * totalWeight

    for (let i = 0; i < items.length; i++) {
      random -= weights[i]
      if (random < 0) {
        return items[i]
      }
    }

    return items[items.length - 1]
  }

  /**
   * 根据权重随机选择多个元素（不重复）
   * @param items 选项数组
   * @param weights 权重数组
   * @param count 选择数量
   */
  weightedChoices<T>(items: T[], weights: number[], count: number): T[] {
    if (count > items.length) {
      throw new Error(`Cannot choose ${count} items from array of length ${items.length}`)
    }

    const result: T[] = []
    const remainingItems = [...items]
    const remainingWeights = [...weights]

    for (let i = 0; i < count; i++) {
      const chosen = this.weightedChoice(remainingItems, remainingWeights)
      result.push(chosen)

      // 移除已选择的项
      const index = remainingItems.indexOf(chosen)
      remainingItems.splice(index, 1)
      remainingWeights.splice(index, 1)
    }

    return result
  }

  /**
   * 创建一个新的派生种子生成器
   * 用于为不同的子系统创建独立但确定的随机序列
   */
  derive(suffix: string | number): SeededRandom {
    const derivedSeed = this.seed + this.hashString(String(suffix))
    return new SeededRandom(derivedSeed)
  }

  /**
   * 创建一个新的随机数生成器，使用当前状态作为种子
   * 用于创建独立的随机流
   */
  fork(): SeededRandom {
    return new SeededRandom(this.nextInt(0, 2147483647))
  }

  /**
   * 获取当前种子值
   */
  getSeed(): number {
    return this.seed
  }

  /**
   * 设置种子（用于加载存档）
   */
  setSeed(seed: number): void {
    this.seed = seed
  }
}
