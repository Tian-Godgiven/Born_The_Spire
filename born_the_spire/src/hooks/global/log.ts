import { isString } from "lodash";
import { ref } from "vue";

export const logList = ref<string[]>([])

export function newLog(logData:any[]){
    let logString = ""
    for(let i of logData){
        if(i.label || i.key){
            logString += i?.label ?? i.key
        }
        else if(isString(i)){
            logString += i
        }
        else{
            logString += JSON.stringify(i)
        }
        
    }
    logList.value.push(logString)
}