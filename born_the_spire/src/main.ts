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

    // 初始化依赖懒加载数据的对象
    initBlackStoreItemPools()

    initDefaultGameObjects()

    // 注册所有房间类型（需要在懒加载完成后）
    import('@/static/registry/roomRegistry').then(({ initAllRooms }) => {
        initAllRooms()
    })

    // 注册所有印记（需要在懒加载完成后）
    import('@/static/registry/markRegistry').then(({ initAllMarks }) => {
        initAllMarks()
    })

    // 注册所有层级（需要在懒加载完成后）
    import('@/static/registry/floorRegistry').then(({ initAllFloors }) => {
        initAllFloors()
    })

    // 注册所有奖励类型（需要在懒加载完成后）
    import('@/static/registry/initRewardRegistry').then(({ initRewardRegistry }) => {
        initRewardRegistry()
    })

    createApp(App)
        .use(router)
        .mount("#app");

}).catch(error => {
    console.error('[Main] 数据预加载失败:', error)
});
