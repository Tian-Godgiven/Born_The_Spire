export type Describe = (
    string //字符串
|{
    key:string[] //需要访问的对象属性的key，如果获取的对象是数组则会在其中寻找key属性为对应值的对象
})[]
//处理对象的描述文本
export function getDescribe(describe:Describe|undefined,target:{[key: string]: any}){
    let text = "";
    if(!describe)return text
    describe.forEach(value=>{
        if(typeof value == "string"){
            text += value
        }
        else if(value instanceof Object){
            if("key" in value){
                let item = target
                for(let key of value.key){
                    //如果Item是数组
                    if(Array.isArray(item)){
                        const tmp = item.find(tmp=>tmp?.key == key)
                        if(tmp){
                            item = tmp
                        }
                    }
                    else{
                        if(key in item){
                            item = item[key]
                            continue
                        }
                        console.log(describe,target,key,item)
                        throw new Error("没有找到对应的属性")
                    }
                }
                //遍历完了后，item即为想要的值
                if(item !== null && item !== undefined){
                    text+=item
                }
                else{
                    console.log("未能获取指定值")
                }
            }
        }
    })

    return text

}