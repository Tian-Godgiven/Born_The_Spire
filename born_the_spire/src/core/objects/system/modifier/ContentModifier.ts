import { Entity } from "../Entity"
import { Modifier } from "./Modifier"

export class ContentModifier extends Modifier{
    public modifierFunc:(target:Entity)=>Entity|void
    public path:string[]
    constructor(source:any,modifierFunc:()=>Entity|void,path:string[]){
        super(source)
        this.modifierFunc = modifierFunc
        this.path = path
    }
}




//获取内容修饰器

//移除内容修饰器
export function removeStatusModifier(modifier:ContentModifier){
    //获取其位置
}