import { Enemy } from "@/objects/Enemy"

export type EnemyMap = {
    label:string,
    key:string
    status:Record<string,number|boolean>,
    organ:string[]
}

export const enemyList:EnemyMap[] = [
    {
        label:"小石怪",
        key:"original_enemy_00001",
        status:{
            "original_status_00001":5
        },
        organ:["original_organ_00002","original_organ_00003"]
    }
]

export function getEnemyByKey(key:string){
    const data = enemyList.find(value=>value.key == key)
    if(!data)throw new Error("没有指定的敌人存在")
    const enemy = new Enemy()
    enemy.initEnemy(data)
    return enemy
}