export { animationManager } from "./AnimationManager"
export { useAnimation } from "./useAnimation"
export { registerPresetAnimations } from "./presets"
export {
    registerDescribeFx,
    registerPresetDescribeFx,
    getDescribeFx,
} from "./describeFx"
export type { DescribeFxDefinition, DescribeFxKind } from "./describeFx"
export {
    registerAnimationCategory,
    registerAnimationCategories,
    getAnimationCategories,
    isAnimationCategoryEnabled,
    setAnimationCategoryEnabled,
} from "./categories"
export type { AnimationCategory } from "./categories"
export type {
    AnimationDefinition,
    AnimationMode,
    AnimationHandle,
    AnimationPlayOptions,
    AnimationCallback,
    AnimationShorthand,
    RepeatStrategy,
} from "./types"
