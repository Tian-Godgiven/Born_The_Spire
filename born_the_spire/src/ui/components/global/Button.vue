<template>
    <button
        type="button"
        class="game-btn"
        :class="{ error: error, 'is-disabled': disabled, invert, large }"
        :disabled="disabled"
        :aria-label="label"
        @click="onClick"
    >
        <span class="game-btn-face">
            <slot>{{ label }}</slot>
        </span>
    </button>
</template>

<script setup lang='ts'>
    const props = defineProps<{
        click?: () => void
        label?: string
        disabled?: boolean
        error?: boolean
        /** 黑脸白字，强调成交（现行：黑市购买 / 出售） */
        invert?: boolean
        /** 房间操作钮尺寸，走 `--layout-store-buy-*` */
        large?: boolean
    }>()

    function onClick() {
        if (props.disabled) return
        props.click?.()
    }
</script>

<style scoped lang='scss'>
// 外切 6px、黑边 2px、内切 4px，斜边才和直边一样厚。两层都写 10px 会一边厚一边薄。
$cut: 6px;
$inner-cut: 4px;

@mixin chamfer($cut) {
    clip-path: polygon(
        #{$cut} 0,
        calc(100% - #{$cut}) 0,
        100% #{$cut},
        100% calc(100% - #{$cut}),
        calc(100% - #{$cut}) 100%,
        #{$cut} 100%,
        0 calc(100% - #{$cut}),
        0 #{$cut}
    );
}

.game-btn {
    display: inline-block;
    padding: 2px;
    border: none;
    background: #000;
    color: #000;
    font: inherit;
    font-weight: bold;
    line-height: 1;
    cursor: pointer;
    @include chamfer($cut);

    .game-btn-face {
        display: block;
        background: #e4e4e4;
        border: 1px solid;
        border-color: #f3f3f3 #9a9a9a #9a9a9a #f3f3f3;
        padding: 6px 12px;
        white-space: nowrap;
        @include chamfer($inner-cut);
    }

    &:hover:not(:disabled):not(.error):not(.invert) .game-btn-face {
        background: #d8d8d8;
    }

    &:active:not(:disabled):not(.error):not(.invert) .game-btn-face {
        background: #d0d0d0;
        border-color: #9a9a9a #f3f3f3 #f3f3f3 #9a9a9a;
    }

    &.invert {
        color: #fff;

        .game-btn-face {
            background: #000;
            color: #fff;
            border-color: #333 #000 #000 #333;
        }

        &:hover:not(:disabled):not(.error) .game-btn-face {
            background: #222;
        }

        &:active:not(:disabled):not(.error) .game-btn-face {
            background: #444;
        }
    }

    &.large {
        font-size: var(--layout-store-buy-font);

        .game-btn-face {
            padding: var(--layout-store-buy-pad);
        }
    }

    &.is-disabled,
    &:disabled,
    &.error {
        cursor: not-allowed;

        .game-btn-face {
            background: #fff;
            color: #c00;
            border-color: #000;
        }
    }
}
</style>
