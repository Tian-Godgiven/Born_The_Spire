import { toString } from "lodash";
import { newError } from "../global/alert";

//对象的描述，存储为数据，使用时翻译为对应的字符串
export type Describe = (
    string //字符串
|{
    key:string[] //需要访问的对象属性的key，如果获取的对象是数组则会在其中寻找key属性为对应值的对象
})[]

//将描述对象翻译为文本
export function getDescribe(describe:Describe|undefined,target:Object){
    let text = "";
    console.log(target)
    if(!describe)return text
    describe.forEach(value=>{
        //纯字符串直接添加
        if(typeof value == "string"){
            text += value
        }
        //是一个对象
        else if(value instanceof Object){
            //这是一个数组，并且会尝试访问target的key属性
            if("key" in value){
                const statusValue = getStatusDescribe(value.key,target)
                //将其添加到text中
                text += statusValue
            }
        }
    })

    return text

}

//处理对象的，关于属性的描述文本：提取对应的属性值字符串，提取失败的话会报错
function getStatusDescribe(statusKeys:string[],target:Record<string,any>){
    let item = target
    //最后找到的属性字符串
    let result:string = ""
    for(let key of statusKeys){
        //如果Item是数组,则会在item中寻找key与目标相同的对象，并设为item
        if(Array.isArray(item)){
            const tmp = item.find(tmp=>tmp?.key == key)
            if(tmp){
                item = tmp
            }
        }
        //否则认为item是普通的对象，尝试访问其的key属性值，并将其设为item
        else{
            //成功访问到了其中的key属性值
            if(item.hasOwnProperty(key)){
                const value = item[key]
                if(typeof value == "object"){
                    item = value
                }
                else{
                    result = toString(value)
                }
            }
            //没能在其中找到key属性值，这属于是路径有误，进行报错
            else{
                newError(["没有在target中找到需要的属性",
                    "总目标：",target,
                    "尝试寻找的key路径",statusKeys,
                    "按路径最后找到的对象\
                        （即在这个对象里没有找到需要的属性）及属性key",
                    item,key])
            }
            
        }
    }
    //遍历完了，但尝试访问的属性值可能是带有value的对象，此时result应该为空
    if(result == "" && "value" in item){
        //此时我们认为这个item.value是我们需要返回的值(参见Status对象)
        result = item.value
    }
    return result
}