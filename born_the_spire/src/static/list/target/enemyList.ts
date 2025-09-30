import { Enemy } from "@/objects/target/Enemy"
import { CharaMap } from "@/objects/target/Target"

export type EnemyMap = CharaMap & {
    key:string
    status:Record<string,number|boolean>,
}

export const enemyList:EnemyMap[] = [
    {
        label:"小石怪",
        key:"original_enemy_00001",
        status:{
            "health":5
        },
        organ:[
            "original_organ_00002",
            "original_organ_00003"
        ]
    }
]

export function getEnemyByKey(key:string){
    const data = enemyList.find(value=>value.key == key)
    if(!data)throw new Error("没有指定的敌人存在")
    const enemy = new Enemy(data)
    return enemy
}