// ==================== 主应用入口 ====================
// 注意：此文件由 bootstrap.ts 加载，核心类已在 preload.ts 中预加载

// 使用动态导入确保在 preload 之后加载
Promise.all([
    import("vue"),
    import("./App.vue"),
    import("@/ui/router"),
    import("@/core/hooks/componentManager"),
    import("@/core/utils/lazyLoader"),
    import("@/static/list/room/blackStore/blackStoreItemPool"),
    import("@/core/objects/game/run"),
    import("@/core/container")
]).then(([
    { createApp },
    { default: App },
    { default: router },
    { registerComponent },
    { preloadAllLazyModules },
    { initBlackStoreItemPools },
    { initDefaultGameObjects },
    { initContainer }
]) => {
    // 动态注册组件
    import("@/ui/components/interaction/OrganUpgradeChoice.vue").then((module) => {
        registerComponent("OrganUpgradeChoice", module.default);
    });

    // 预加载所有数据层模块（避免循环依赖）
    preloadAllLazyModules().then(async () => {

        // 加载所有 mod（在懒加载完成后，容器初始化前）
        const { loadAllMods } = await import('@/mods/loader')
        await loadAllMods()

        // 初始化依赖注入容器
        initContainer()

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

        // 初始化器官奖励动作系统（需要在懒加载完成后）
        import('@/static/registry/initOrganRewardActions').then(({ initAllOrganRewardActions }) => {
            initAllOrganRewardActions()
        })

        // 初始化水池行动系统（需要在懒加载完成后）
        import('@/static/registry/initPoolActions').then(({ initAllPoolActions }) => {
            initAllPoolActions()
        })

        createApp(App)
            .use(router)
            .mount("#app");

    }).catch(error => {
        console.error('[Main] 数据预加载失败:', error)
    });
}).catch(error => {
    console.error('[Main] 模块加载失败:', error)
});
