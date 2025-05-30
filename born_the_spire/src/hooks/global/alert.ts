import { isString } from "lodash";

//报错
export function newError(info:(string|Object|undefined)[]){
    console.group("报错：");
    for(let i of info){
        if(isString(info)){
            console.error("Message:",i);
        }
        else if(!i){
            console.error("undefined")
        }
        else{
            console.table(i)
        }
    }
    console.groupEnd();
    throw new Error("运行过程发生错误")
    
}