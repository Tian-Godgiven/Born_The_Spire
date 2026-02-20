import { shallowRef } from 'vue'
import { showPopUp } from './popUp'
import EnemySelectMap from '@/ui/page/Scene/test/EnemySelectMap.vue'

/**
 * 显示敌人选择地图弹窗
 */
export function showEnemySelectMap() {
    showPopUp({
        vue: shallowRef(EnemySelectMap),
        mask: true,
        props: {}
    })
}
