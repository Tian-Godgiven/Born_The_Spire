import { Entity } from "../Entity"
import { Modifier } from "./Modifier"

// ContentModifier 不需要泛型约束 id，因为它管理的是 Entity 对象
export class ContentModifier extends Modifier<Entity & {id: string}>{
    public modifierFunc:(target:Entity)=>Entity|void
    public path:string[]
    constructor(_source:any,modifierFunc:()=>Entity|void,path:string[]){
        super()
        this.modifierFunc = modifierFunc
        this.path = path
    }
}




//获取内容修饰器

//移除内容修饰器
export function removeContentModifier(_modifier:ContentModifier){
    //获取其位置
    // TODO: 实现移除逻辑
}