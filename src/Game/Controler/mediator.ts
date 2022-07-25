import { StateName, StateTransition, TestWallet } from '../Const';
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
import { w3cwebsocket } from 'websocket';

const cityStateId = `${StateName.City}:${TestWallet}`;
const generalStateId = `${StateName.General}:${TestWallet}`;

function getInitState(wather: IStateChangeWatcher): {
  [key: string]: IState;
} {
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
  constructor() {
    super();
    this.transitionHandler = new TransitionHandler(
      this,
      GenerateMemoryLoadStateFunction(getInitState(this))
    );
    this.seqNum = 0;
  }

  onStateChange(modify: {}, state: IState): void {
    state &&
      this.notifyState({ id: state.getId() }, { ...state, context: this.ctx });
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
