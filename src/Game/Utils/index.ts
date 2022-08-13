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