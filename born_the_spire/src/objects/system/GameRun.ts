import { nanoid } from "nanoid"

//每一局游戏
export class GameRun{
    public towerLevel:number = 0 //当前层数
    public towerStage:string = "bottom"//当前阶层
    public towerFire:number = 0//当前进阶
    public __key:string = nanoid()
    constructor(

    ){}
}

