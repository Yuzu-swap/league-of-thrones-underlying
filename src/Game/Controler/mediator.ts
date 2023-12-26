import { StateName, StateTransition  } from '../Const';
import {
  BaseMediator,
  IContextState,
  StateCallback
} from '../../Core/mediator';
import {
  IStateIdentity,
  IState,
  IStateChangeWatcher,
  State
} from '../../Core/state';
import { BattleRecordType, BattleTransRecord, TransitionEventType, TransitionHandler } from './transition';
import { ICityState, GetInitState, IGeneralState, IMapGlobalState, GetMapState, IBlockState, ISeasonConfigState, IStrategyState, IActivityState } from '../State';
import { GenerateMemoryLoadStateFunction } from './statemanger';
import {
  BaseMessage,
  MessageC2S,
  MessageS2C,
  MessageType
} from './Websocket/protocol';
import { BattleType } from '../Logic/general';
import { getTimeStamp, getTxHash } from '../Utils';


function getInitState(username:string, mapId:number, wather: IStateChangeWatcher): {
  [key: string]: IState;
} {
  const cityStateId = `${StateName.City}:${username}`;
  const generalStateId = `${StateName.General}:${username}`;
  const strategyStateId = `${StateName.Strategy}:${username}`;
  const InitState = GetInitState('mediator.getInitState');
  return {
    [cityStateId]: new State<ICityState>(
      {
        id: cityStateId,
        ...InitState[StateName.City]
      },
      wather
    ).unsderlying(),
    [generalStateId]: new State<IGeneralState>(
      {
        id: generalStateId,
        ...InitState[StateName.General]
      },
      wather
    ).unsderlying(),
    [strategyStateId]: new State<IStrategyState>(
      {
        id: strategyStateId,
        ...InitState[StateName.Strategy]
      },
      wather
    ).unsderlying()
  };
}

function getGlobleState(mapId: number, wather: IStateChangeWatcher):{
  [key: string]: IState
}{
  let re = {}
  const InitState = GetInitState('mediator.getGlobleState');
  re = Object.assign(
    re, {
      [StateName.MapGlobalInfo]: new State<IMapGlobalState>(
        {
          id: [StateName.MapGlobalInfo],
          ...InitState[StateName.MapGlobalInfo]
        },
        wather
      ).unsderlying(),
      [StateName.SeasonConfig]: new State<ISeasonConfigState>(
        {
          id: [StateName.SeasonConfig],
          ...InitState[StateName.SeasonConfig]
        },
        wather
      ).unsderlying(),
      [StateName.RewardGloablState] : new State<ISeasonConfigState>(
        {
          id: [StateName.RewardGloablState],
          ...InitState[StateName.RewardGloablState]
        },
        wather
      ).unsderlying(),
      [StateName.Activity] : new State<IActivityState>(
        {
          id: [StateName.Activity],
          ...InitState[StateName.Activity]
        },
        wather
      ).unsderlying()
    }
  )
  const mapState = GetMapState(mapId)
  for(let id in mapState){
    re[id] = new State<IBlockState>(
      mapState[id],
      wather
    ).unsderlying()
     
  }
  return re
}

export interface ITransContext extends BaseMessage {}
export type IStatetWithTransContextCallback = (
  ctx: IContextState<ITransContext>
) => void;
export interface ITransResult extends ITransContext {
  result: any;
}

export class LocalMediator
  extends BaseMediator<StateTransition, ITransContext>
  implements IStateChangeWatcher
{
  private transitionHandler: TransitionHandler;
  private ctx: ITransContext;
  private seqNum: number;
  private username:string
  private chainBlockCallback: (msg: MessageS2C) => void
  constructor(username: string[], mapId: number) {
    super();
    let obj = {}
    for(let name of username){
      obj = Object.assign(obj, getInitState(name, mapId, this))
    }
    obj = Object.assign(obj, getGlobleState(mapId, this))
    this.transitionHandler = new TransitionHandler(
      this,
      GenerateMemoryLoadStateFunction(obj)
    );
    this.seqNum = 0;
  }

  onStateChange(modify: {}, state: IState): void {
    state &&
      this.notifyState({ id: state.getId() }, { ...state, context: this.ctx });
  }

	query( typ: string, args:{}):Promise<any> {
    let re = []
    let record1:BattleTransRecord = {
      attackInfo:{
        generalId: 1,
        generalLevel: 2,
        generalType: 1,
        username: 'test',
        troopReduce: 1000,
        silverGet: 100,
        gloryGet: 100,
        unionId: 1,
        iconId: -1
      },
      defenseInfo:{
        generalId: -1,
        generalLevel: 2,
        generalType: 1,
        username: 'test1',
        troopReduce: 1500,
        silverGet: -100,
        gloryGet: 100,
        unionId: 1,
        iconId: -1
      },
      leader: '',
      recordType: BattleRecordType.City, 
      blockInfo :{
        x_id: 2,
        y_id: 2,
        durabilityReduce: 0
      },
      timestamp: 0,
      txHash: getTxHash(),
      result: true,
    }
    let record2: BattleTransRecord = {
      attackInfo:{
        generalId: 1,
        generalLevel: 2,
        generalType: 1,
        username: 'test',
        troopReduce: 1500,
        silverGet: 0,
        gloryGet: 100,
        unionId: 1,
        iconId: -1
      },
      defenseInfo:{
        generalId: 2,
        generalLevel: 2,
        generalType: 2,
        username: 'test1',
        troopReduce: 1000,
        silverGet: 0,
        gloryGet: 100,
        unionId: 1,
       iconId: -1
      },
      leader: '',
      recordType: BattleRecordType.City, 
      blockInfo :{
        x_id: 2,
        y_id: 2,
        durabilityReduce: 0
      },
      timestamp : 1,
      txHash: getTxHash(),
      result: false,
    }
    let record3: BattleTransRecord = {
      attackInfo: {
        generalId: 1,
        generalLevel: 2,
        generalType: 1,
        username: 'test',
        troopReduce: 1000,
        silverGet: 0,
        gloryGet: 100,
        unionId: 1,
        iconId: -1
      },
      leader: '',
      recordType: BattleRecordType.City, 
      defenseInfo:{
        generalId: 2,
        generalLevel: 2,
        generalType: 2,
        username: 'test1',
        troopReduce: 1500,
        silverGet: 0,
        gloryGet: 100,
        unionId: 1,
        iconId: -1
      },
      blockInfo :{
        x_id: -1,
        y_id: -1,
        durabilityReduce: 0
      },
      timestamp: 2,
      txHash: getTxHash(),
      result: true,
    }
    let record4: BattleTransRecord = {
      attackInfo:{
        generalId: 1,
        generalLevel: 2,
        generalType: 1,
        username: 'test',
        troopReduce: 1500,
        silverGet: -100,
        gloryGet: 100,
        unionId: 1,
        iconId: -1
      },
      leader: '',
      defenseInfo:{
        generalId: 2,
        generalLevel: 2,
        generalType: 2,
        username: 'test1',
        troopReduce: 1000,
        silverGet: 100,
        gloryGet: 100,
        unionId: 1,
        iconId: -1
      },
      recordType: BattleRecordType.City, 
      timestamp: 3,
      blockInfo :{
        x_id: -1,
        y_id: -1,
        durabilityReduce: 0
      },
      txHash: getTxHash(),
      result: false,
    }
    if(typ == StateName.DefenderInfo){
       if(args['username'] == undefined){
          re = [
            {
              username: 'test',
              generalId: 1,
              generalLevel: 2,
              generalType: 3,
              attack: 1000,
              defense: 200,
              silver: 100000,
              troop: 10000,
              unionId : 1,
              glory: 500,
              defenseMaxTroop: 100,
              fortressLevel: 1 
            },
            {
              username: 'test1',
              generalId: -1,
              generalLevel: 1,
              generalType: 1,
              attack: 1000,
              defense: 200,
              silver: 9899,
              troop: 10000,
              unionId : 1,
              glory: 500,
              defenseMaxTroop: 100,
              fortressLevel: 1
            }
          ]
       }
       else{
        re = [
          {
            username: 'test1',
            generalId: -1,
            generalLevel: 1,
            generalType: 1,
            attack: 1000,
            defense: 200,
            silver: 9899,
            troop: 10000,
            unionId : 1,
            glory: 500,
            defenseMaxTroop: 100,
            fortressLevel: 1
          }
        ]
       }
    }
    else if(typ == TransitionEventType.Battles){
      re = [record1, record2, record3, record4]
    }
    else if(typ == StateName.BlockInfo){
      let blocks = args['id']['$in']
      for(let key of blocks){
        let sid = {
          id : key
        }
        let blockstate = this.transitionHandler.stateManger.get(sid)
        if(blockstate){
          re.push( blockstate )
        }
        
      }
    }
    else if(typ == TransitionEventType.TimeStamp ){
      return new Promise((resolve, reject) => {
        resolve(getTimeStamp(3))
      })
    }
    //TODO:mock result here
    return new Promise((resolve, reject) => {
      resolve(re)
    })
  }

  queryState(
    sid: IStateIdentity,
    args: {},
    callback: (state: IState) => void
  ): Promise<IState> | void {
    const state = this.transitionHandler.stateManger.get(sid);
    if (callback) {
      callback(state);
    } else {
      return new Promise((resolve, reject) => {
        if (state) {
          resolve(state);
        } else {
          reject({});
        }
      });
    }
  }

  sendTransaction(
    tid: StateTransition,
    args: {},
    callback: (res: ITransResult) => void
  ): ITransContext {
    //set context
    const ctx = {
      SeqNum: this.seqNum++,
      Type: MessageType.Transition,
      TransID: tid.toString()
    };
    //record ctx
    this.ctx = ctx;
    const result = this.transitionHandler.onTransition(tid, args);
    //clean ctx
    console.log('sendTransaction', {tid, args, result, ctx});
    console.log('sendTransaction StateTransition', StateTransition);
    this.ctx = null;

    if(this.chainBlockCallback)
    {
      let msg : MessageS2C = {
        SeqNum: ctx.SeqNum,
        Type: MessageType.Transition,
        TransID: ctx.TransID,
        States: {},
        Data: result
      }
      this.chainBlockCallback(
        msg
      )
    }

    if (callback) {
      callback({ ...ctx, result });
    }

    return ctx;
  }

  getTransaction(){
    return this.transitionHandler
  }

  profileQuery(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({})
    });
  }

  profileSave(key: string, value: string): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({})
    });
  }
  
  defaultQuery(type: MessageType, transID: string, args: {}): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({})
    });
  }

  chatHistory(data: {}): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve([])
    });
  }

  setChainBlockCallback(callback: (msg: MessageS2C) => void): void {
    this.chainBlockCallback = callback
  }

}


export function GetTestBattleTransRecord(): BattleTransRecord[]{
  let re = []
  let record1:BattleTransRecord = {
    attackInfo:{
      generalId: 1,
      generalLevel: 2,
      generalType: 1,
      username: 'test',
      troopReduce: 1000,
      silverGet: 100,
      gloryGet: 100,
      unionId: 1,
      iconId: -1
    },
    defenseInfo:{
      generalId: -1,
      generalLevel: 2,
      generalType: 1,
      username: 'test1',
      troopReduce: 1500,
      silverGet: -100,
      gloryGet: 100,
      unionId: 1,
      iconId: -1
    },
    leader: '',
    recordType: BattleRecordType.Block, 
    blockInfo :{
      x_id: 2,
      y_id: 2,
      durabilityReduce: 0
    },
    timestamp: getTimeStamp(),
    txHash: getTxHash(),
    result: true,
  }
  re.push(record1)
  let record2: BattleTransRecord = {
    attackInfo:{
      generalId: 1,
      generalLevel: 2,
      generalType: 1,
      username: 'test',
      troopReduce: 1500,
      silverGet: 0,
      gloryGet: 100,
      unionId: 1,
      iconId: -1
    },
    defenseInfo:{
      generalId: 2,
      generalLevel: 2,
      generalType: 2,
      username: 'test1',
      troopReduce: 1000,
      silverGet: 0,
      gloryGet: 100,
      unionId: 1,
      iconId: -1
    },
    leader: '',
    recordType: BattleRecordType.Block, 
    blockInfo :{
      x_id: 2,
      y_id: 2,
      durabilityReduce: 0
    },
    timestamp : getTimeStamp(),
    txHash: getTxHash(),
    result: false,
  }
  re.push(record2)
  let record3: BattleTransRecord = {
    attackInfo: {
      generalId: 1,
      generalLevel: 2,
      generalType: 1,
      username: 'test',
      troopReduce: 1000,
      silverGet: 0,
      gloryGet: 100,
      unionId: 1,
      iconId: -1
    },
    leader: '',
    recordType: BattleRecordType.City, 
    defenseInfo:{
      generalId: 2,
      generalLevel: 2,
      generalType: 2,
      username: 'test1',
      troopReduce: 1500,
      silverGet: 0,
      gloryGet: 100,
      unionId: 1,
      iconId: -1
    },
    blockInfo :{
      x_id: -1,
      y_id: -1,
      durabilityReduce: 0
    },
    timestamp: getTimeStamp(),
    txHash: getTxHash(),
    result: true,
  }
  re.push(record3)
  let record4: BattleTransRecord = {
    attackInfo:{
      generalId: 1,
      generalLevel: 2,
      generalType: 1,
      username: 'test',
      troopReduce: 1500,
      silverGet: -100,
      gloryGet: 100,
      unionId: 1,
      iconId: -1
    },
    defenseInfo:{
      generalId: 2,
      generalLevel: 2,
      generalType: 2,
      username: 'test1',
      troopReduce: 1000,
      silverGet: 100,
      gloryGet: 100,
      unionId: 1,
      iconId: -1
    },
    leader: '',
    recordType: BattleRecordType.City, 
    timestamp: getTimeStamp(),
    blockInfo :{
      x_id: -1,
      y_id: -1,
      durabilityReduce: 0
    },
    txHash: getTxHash(),
    result: false,
  }
  re.push(record4)
  return re
}