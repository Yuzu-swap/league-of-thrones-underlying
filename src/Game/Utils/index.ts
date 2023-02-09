import { StateName } from "../Const";
import { GloryInfo } from "../State";
import { Decimal } from "decimal.js"

export function parseStateId(stateId :string): { type : StateName , username : string }{
    let re = {
        type : StateName.City,
        username: ''
    }
    let list = stateId.split(':')
    if(list.length == 2){
        re.type = list[0] as StateName
        re.username = list[1]
    }
    else{
        re.type = list[0] as StateName
    }
    return re
}

export function transDateToTimeStamp( date: string ){
    //new Date('2019-05-28T09:00:20.000Z')
    //"2022_8_14_22"
    let list = date.split('_')
    if(list.length != 4){
        return 0
    }
    for(let index in list){
        if(list[index].length == 1){
            list[index] = '0' + list[index]
        }
    }
    let dataString = list[0] + '-' + list[1] + '-' + list[2] + 'T' + list[3] + ':00:00.000Z'
    return parseInt((new Date(dataString)).valueOf() / 1000 + '')
}

var timeOffset = 0

export function setTimeOffset(offset : number ){
    timeOffset = offset
}

export function getTimeStamp( offset : number = timeOffset) :number{
    const ctx = global && global.ctx
    console.log("getTimeStamp ctx is ",ctx)
    let time
    if (ctx){
        time = ctx.now()  // + offset
    }else{
        time = parseInt(new Date().getTime() / 1000 + '')
    }
    return time //+ offset
}

function indexOfGloryList(list: GloryInfo[], username : string, glory: number){
    let beginIndex = 0 , endIndex = list.length - 1
    let mid = 0
    let exist = false
    let equal = false
    let index = 0
    if(list.length == 0){
        return  {exist, index}
    }
    while(beginIndex <= endIndex){
        mid = Math.floor((beginIndex + endIndex) /2)
        if( list[mid].glory > glory ){
            beginIndex = mid + 1
            index = mid + 1
        }
        else if(list[mid].glory < glory ){
            endIndex = mid - 1
            index = mid
        }
        else{
            equal = true
            index = mid
            break
        }
    }
    if(equal){
        //to 0
        do{
            for(let i = mid; i >=0; i--){
                if(list[i].glory == glory){
                    if(list[i].username == username){
                        index = i
                        exist = true
                        break
                    }
                }
                else{
                    break
                }
            }
            if(exist){
                break
            }
            for(let i = mid; i < list.length; i++){
                if(list[i].glory == glory){
                    if(list[i].username == username){
                        index = i
                        exist = true
                        break
                    }
                }
                else{
                    break
                }
            }
        }while(false)
    }
    return {exist, index}
}


export function indexOfSortedList(list: any[], username : string, value: Decimal, valueKey: string){
    let beginIndex = 0 , endIndex = list.length - 1
    let mid = 0
    let exist = false
    let equal = false
    let index = 0
    if(list.length == 0){
        return  {exist, index}
    }
    while(beginIndex <= endIndex){
        mid = Math.floor((beginIndex + endIndex) /2)
        if( list[mid][valueKey] > value ){
            beginIndex = mid + 1
            index = mid + 1
        }
        else if(list[mid][valueKey] < value ){
            endIndex = mid - 1
            index = mid
        }
        else{
            equal = true
            index = mid
            break
        }
    }
    if(equal){
        //to 0
        do{
            for(let i = mid; i >=0; i--){
                if(list[i][valueKey] == value){
                    if(list[i]['username'] == username){
                        index = i
                        exist = true
                        break
                    }
                }
                else{
                    break
                }
            }
            if(exist){
                break
            }
            for(let i = mid; i < list.length; i++){
                if(list[i][valueKey] == value){
                    if(list[i]['username'] == username){
                        index = i
                        exist = true
                        break
                    }
                }
                else{
                    break
                }
            }
        }while(false)
    }
    return {exist, index}
}


export function addToSortList( list: GloryInfo[], username : string, originGlory: number, newGlory: number, unionId : number){
    let insert : GloryInfo = {
        username: username,
        glory: newGlory,
        unionId: unionId
    }
    console.log("before add sort list, length:" + list.length + " list:"+ JSON.stringify(list))
    if(list.length == 0){
        list.push(
            insert
        )
        console.log("add new item to list", JSON.stringify(list))
        return
    }
    let origin = indexOfGloryList(list, username, originGlory)
    if(origin.exist){
        list.splice(origin.index, 1)
    }
    let newInfo = indexOfGloryList(list, username, newGlory)
    list.splice(newInfo.index, 0, insert)
}

export function addToNormalSortedList( list: any[], username : string, originValue: Decimal, newValue: Decimal, valueKey: string){
    let insert  = {
        username: username,
    }
    insert[valueKey] = newValue
    if(list.length == 0){
        list.push(
            insert
        )
        return
    }
    let origin = indexOfSortedList(list, username, originValue, valueKey)
    if(origin.exist){
        list.splice(origin.index, 1)
    }
    let newInfo = indexOfSortedList(list, username, newValue, valueKey)
    list.splice(newInfo.index, 0, insert)
}

export function getRandom():number{
    const ctx = global && global.ctx
    console.log("getRandom ctx is ",ctx)
    if (ctx){
        return ctx.random()
    }else{
        return Math.random()
    }
}

export function encodeChatProfile( id: string, ts: number){
    return id+ ":" + ts;
}

export function decodeChatProfile( data: string ){
    let list = data.split(':')
    if(list.length != 2 ){
        throw "chat profile error"
    } 
    return {
        id: list[0],
        ts: parseInt(list[1])
    }
}

export function exportDecimal(aObject) {
    // Prevent undefined objects
    // if (!aObject) return aObject;
    if(aObject instanceof Decimal){
      return genDecimalString(aObject)
    }
  
    let bObject = Array.isArray(aObject) ? [] : {};
  
    let value;
    for (const key in aObject) {
  
      // Prevent self-references to parent object
      // if (Object.is(aObject[key], aObject)) continue;
      
      value = aObject[key];
  
      if(value instanceof Decimal){
        bObject[key] = genDecimalString(value)
      }
      else{
        bObject[key] = (typeof value === "object") ? exportDecimal(value) : value;
      }
    }
  
    return bObject;
}

export function importDecimal(aObject) {
    // Prevent undefined objects
    // if (!aObject) return aObject;
    let bObject = Array.isArray(aObject) ? [] : {};
  
    let value;
    for (const key in aObject) {
  
      // Prevent self-references to parent object
      // if (Object.is(aObject[key], aObject)) continue;
      
      value = aObject[key];
  
      if( key.indexOf(decimalSign) != -1){
        bObject[key] = getDecimalFromStr(value)
      }
      else{
        bObject[key] = (typeof value === "object") ? importDecimal(value) : value;
      }
    }
    return bObject;
}

export const decimalSign = 'decType'

export function genDecimalString( value: Decimal ) {
    return value.toString()
}

export function getDecimalFromStr(value: string | string[]) {
    if(Array.isArray(value))
    {
        let re = []
        for(let item of value)
        {
            re.push(new Decimal(item))
        }
        return re
    }
    else{
        return new Decimal(value)
    }

}