import { IStateChangeWatcher, IStateIdentity,IState, State } from "./Core/state";
import { LoadStateFunc } from "./Game/Controler/statemanger";
import { LogicEssential } from "./Game/Logic/creator";
import request  from  'sync-request';

const TransitionHandler = require("./index").TransitionHandler




class StateChangeWatcher implements IStateChangeWatcher {
    onStateChange(obj: any, state: any) {
        console.log("onStateChange", obj, state)
    }
}

function LoadStateFromRemoteAPI (sid: IStateIdentity) :IState {
    const seasonId = "prod-bsc-2023-12-25-1-2"
    const  stateCheckUrl = "https://app.leagueofthrones.com/web/state/" 
    const options = {
        url: stateCheckUrl + sid.id + "/" + seasonId,
        headers: {
          'User-Agent': 'my-app'
        }
    };
    
    const response = request('GET', options.url, { headers: options.headers });
    const res = JSON.parse(response.getBody('utf8'))

    //console.log("res is ",res)
    return  new State(res)
}





async function debug(){

    const stateWatcher:IStateChangeWatcher = new StateChangeWatcher()
    const loadLoadStateFunc:LoadStateFunc = LoadStateFromRemoteAPI

    //console.log(LoadStateFromRemoteAPI({id:"city:"+"0x07B5E98321bd472735475c12E78086d05Eb38907".toLocaleLowerCase()}))


    const th = new TransitionHandler(stateWatcher,loadLoadStateFunc)

    const logic: LogicEssential = th.genLogic("0x04C535c9F175cB8980B43617fB480412c7E341E4".toLocaleLowerCase())
    const defenderInfo = logic.general.getDefenseInfo()
    console.log("defenderInfo is ", defenderInfo)

}


global.ctx = {
    now:()=>{
        return Math.floor ((new Date().getTime())/1000)
    },
    getTxHash:()=>{
        return "fakeHash"
    },
    random:()=>{
        return Math.random()
    }
}

debug()