import { nanoid } from "nanoid"

//修饰器对象，是修饰器内存储的功能单元
export class ModifierObj{
    public id:string
    public source:any//修饰器的来源，可以通过来源来卸载复数的修饰器
    public ifDisabled:boolean = false//禁用修饰器时,其不再自动刷新
    constructor(source:any){
        this.id = nanoid()
        this.source = source
    }
    //状态管理
    disable(){
        this.ifDisabled = true
    }
    able(){
        this.ifDisabled = false
    }

}

//修饰器管理器
export class Modifier<T extends {id:string}>{
    protected store:T[] = []//修饰器的存储空间
    constructor(){
        
    }
    //新增
    add(t:T){
        this.store.push(t)
        this.refresh()
        //返回移除该修饰器的函数
        return ()=>this.delete(t.id)
    }
    //删除
    delete(id:string){
        const index = this.store.findIndex(i=>i.id == id)
        if(index >= 0){
            this.store.splice(index,1)
            this.refresh()
            return true
        }
        return false
    }
    //修改
    edit(id:string,newT:T){
        const index = this.store.findIndex(i=>i.id == id);
        if(index > 0){
            Object.assign(this.store[index],newT)
            this.refresh()
            return this.store[index]
        }
        return false
    }
    //查询
    seach(id:string){
        const tmp = this.store.find(i=>i.id == id)
        if(tmp){
            return tmp
        }
        return false
    }
    //刷新
    refresh(){

    }
}



