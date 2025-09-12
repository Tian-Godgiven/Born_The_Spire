import { isNumber, isString } from "lodash";
import { ref } from "vue";

export const logList = ref<string[]>([])

type LogUnit = {
    text:string,//直接在日志栏中输出的内容
    detail:string,//在日志栏中作为上述内容的折叠内容，点一下才会显示(再点一下收起)
}

//在日志栏打印内容
export function newLog(logData:any[]){
    const logUnit = {
        text:"",
        detail:""
    }
    let logString = ""
    for(let i of logData){
        logUnit.text = handleLogData(i)
        if(i.detail){
            logUnit.detail = handleLogData(i.detail)
        }
    }
    logList.value.push(logString)
}

//处理得到的日志数据，返回赋给日志单元的值
function handleLogData(logData:any){
    if(logData==null){
        return "<未定义对象>"
    }
    else if(logData?.label || logData?.key){
        return logData?.label ?? logData.key
    }
    else if(isString(logData)||isNumber(logData)){
        return logData
    }
    else{
        return "<无法识别对象>"
        // logString += JSON.stringify(i)
    }
}