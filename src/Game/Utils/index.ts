import { StateName } from "../Const";

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
    let time = parseInt(new Date().getTime() / 1000 + '')
    return time + offset
}