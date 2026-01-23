import { createApp } from "vue";
import App from "./App.vue";
import router from "@/ui/router";
import { registerComponent } from "@/core/hooks/componentManager";
import OrganUpgradeChoice from "@/ui/components/interaction/OrganUpgradeChoice.vue";
import { preloadAllLazyModules } from "@/core/utils/lazyLoader";
import { initBlackStoreItemPools } from "@/static/list/room/blackStore/blackStoreItemPool";
import { initDefaultGameObjects } from "@/core/objects/game/run";

// 注册自定义组件
registerComponent("OrganUpgradeChoice", OrganUpgradeChoice);

// 预加载所有数据层模块（避免循环依赖）
preloadAllLazyModules().then(() => {
    console.log('[Main] 数据预加载完成')

    // 初始化依赖懒加载数据的对象
    console.log('[Main] 初始化黑市物品池...')
    initBlackStoreItemPools()

    console.log('[Main] 初始化默认游戏对象...')
    initDefaultGameObjects()

    // 注册所有房间类型（需要在懒加载完成后）
    console.log('[Main] 注册房间类型...')
    import('@/static/registry/roomRegistry').then(({ initAllRooms }) => {
        initAllRooms().then(() => {
            console.log('[Main] 房间注册完成')
        })
    })

    console.log('[Main] 启动 Vue 应用...')
    createApp(App)
        .use(router)
        .mount("#app");

    console.log('[Main] 应用启动完成')
}).catch(error => {
    console.error('[Main] 数据预加载失败:', error)
});
