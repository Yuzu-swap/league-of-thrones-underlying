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
import { TransitionHandler } from './transition';
import { ICityState, GetInitState, IGeneralState } from '../State';
import { GenerateMemoryLoadStateFunction } from './statemanger';
import {
  BaseMessage,
  MessageC2S,
  MessageS2C,
  MessageType
} from './Websocket/protocol';


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
    this.transitionHandler = new TransitionHandler(
      this,
      GenerateMemoryLoadStateFunction(obj),
      (typ: string, event: any) => {
        console.log("TransitionHandler Save event:", typ, event);
      }
    );
    this.seqNum = 0;
  }

  onStateChange(modify: {}, state: IState): void {
    state &&
      this.notifyState({ id: state.getId() }, { ...state, context: this.ctx });
  }

	query( typ: string, args:{}):Promise<any> {
    //TODO:mock result here
    return new Promise((resolve, reject) => {
      resolve({})
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
}
