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
   * 创建一个新的派生种子生成器
   * 用于为不同的子系统创建独立但确定的随机序列
   */
  derive(suffix: string | number): SeededRandom {
    const derivedSeed = this.seed + this.hashString(String(suffix))
    return new SeededRandom(derivedSeed)
  }

  /**
   * 获取当前种子值
   */
  getSeed(): number {
    return this.seed
  }
}
