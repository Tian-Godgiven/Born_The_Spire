import { EnemyMap } from "@/static/list/enemyList";
import { Target } from "./Target";

export class Enemy extends Target{
    constructor(
    ){
        super()
    }

    //初始化
    initEnemy(enemyMap:EnemyMap){
        this.initTarget(enemyMap)
    }
}