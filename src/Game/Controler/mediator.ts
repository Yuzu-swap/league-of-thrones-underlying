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
import { BattleTransRecord, TransitionEventType, TransitionHandler } from './transition';
import { ICityState, GetInitState, IGeneralState, IMapGlobalState, GetMapState, IBlockState } from '../State';
import { GenerateMemoryLoadStateFunction } from './statemanger';
import {
  BaseMessage,
  MessageC2S,
  MessageS2C,
  MessageType
} from './Websocket/protocol';
import { BattleType } from '../Logic/general';
import { getTimeStamp } from '../Utils';


function getInitState(username:string,wather: IStateChangeWatcher): {
  [key: string]: IState;
} {
  const cityStateId = `${StateName.City}:${username}`;
  const generalStateId = `${StateName.General}:${username}`;
  const InitState = GetInitState();
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
    ).unsderlying()
  };
}

function getGlobleState(wather: IStateChangeWatcher):{
  [key: string]: IState
}{
  let re = {}
  const InitState = GetInitState();
  re = Object.assign(
    re, {
      [StateName.MapGlobalInfo]: new State<IMapGlobalState>(
        {
          id: [StateName.MapGlobalInfo],
          ...InitState[StateName.MapGlobalInfo]
        },
        wather
      ).unsderlying()
    }
  )
  const mapState = GetMapState()
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
  constructor(username: string[]) {
    super();
    let obj = {}
    for(let name of username){
      obj = Object.assign(obj, getInitState(name, this))
    }
    obj = Object.assign(obj, getGlobleState(this))
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
        gloryGet: 100
      },
      defenseInfo:{
        generalId: -1,
        generalLevel: 2,
        generalType: 1,
        username: 'test1',
        troopReduce: 1500,
        silverGet: -100,
        gloryGet: 100
      },
      blockInfo :{
        x_id: 2,
        y_id: 2
      },
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
        gloryGet: 100
      },
      defenseInfo:{
        generalId: 2,
        generalLevel: 2,
        generalType: 2,
        username: 'test1',
        troopReduce: 1000,
        silverGet: 0,
        gloryGet: 100
      },
      blockInfo :{
        x_id: 2,
        y_id: 2
      },
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
        gloryGet: 100
      },
      defenseInfo:{
        generalId: 2,
        generalLevel: 2,
        generalType: 2,
        username: 'test1',
        troopReduce: 1500,
        silverGet: 0,
        gloryGet: 100
      },
      blockInfo :{
        x_id: -1,
        y_id: -1
      },
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
        gloryGet: 100
      },
      defenseInfo:{
        generalId: 2,
        generalLevel: 2,
        generalType: 2,
        username: 'test1',
        troopReduce: 1000,
        silverGet: 100,
        gloryGet: 100
      },
      blockInfo :{
        x_id: -1,
        y_id: -1
      },
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
              glory: 500
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
              glory: 500
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
            glory: 500
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
    this.ctx = null;

    if (callback) {
      callback({ ...ctx, result });
    }

    return ctx;
  }

  getTransaction(){
    return this.transitionHandler
  }
}
