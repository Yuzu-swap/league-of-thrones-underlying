import { w3cwebsocket } from 'websocket';
import { BaseMediator } from '../../Core/mediator';
import {
  IStateChangeWatcher,
  IState,
  IStateIdentity,
  State
} from '../../Core/state';
import { StateTransition } from '../Const';
import { ITransContext, ITransResult } from './mediator';
import { TransitionHandler } from './transition';
import { MessageS2C, MessageType, MessageC2S } from './Websocket/protocol';

export class WebSocketMediator
  extends BaseMediator<StateTransition, ITransContext>
  implements IStateChangeWatcher
{
  private client: any;
  private seqNum: number;
  private respCallbacks: {};
  private stateCaches: { [key: string]: IState } = {};
  private ctx: ITransContext;
  private notifyStateChange: boolean;

  transitionHandler: TransitionHandler;
  constructor(url: string) {
    super();
    this.seqNum = 0;
    this.client = new w3cwebsocket(url);
    this.respCallbacks = {};
    this.stateCaches = {};
    this.notifyStateChange = true;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.client.onopen = () => {
        resolve('');
      };

      this.client.onmessage = (message: any) => {
        const msg: MessageS2C = JSON.parse(message.data) as MessageS2C;
        this.ctx = msg;

        console.log('client receive msg is ', JSON.stringify(msg));
        if (msg.SeqNum != undefined) {
          //context call

          if (this.respCallbacks[msg.SeqNum]) {
            if (msg.Type === MessageType.Transition) {
              this.respCallbacks[msg.SeqNum](msg.Data);
              for (var sid in msg.States) {
                const stateObj = msg.States[sid];
                this._updateState(sid, stateObj, false);
              }
            } else if (msg.Type == MessageType.Query) {
              for (var sid in msg.States) {
                const stateObj = msg.States[sid];
                this._updateState(sid, stateObj, false);
              }
              this.respCallbacks[msg.SeqNum](this._getState(sid));
            }
          }
        } else {
          // state notify
          for (var sid in msg.States) {
            const stateObj = msg.States[sid];
            this._updateState(sid, stateObj, true);
          }
        }
      };

      this.client.onerror = function (err: Error) {
        console.log('Connection Error', err);
      };

      setInterval(() => {
        //ping
        this.client.send('{}')
      }, 10000)
    });
  }

  onStateChange(modify: {}, state: IState): void {
    state &&
      this.notifyStateChange &&
      this.notifyState({ id: state.getId() }, { ...state, context: this.ctx });
  }

  queryState(
    sid: IStateIdentity,
    args: {},
    callback: (state: IState) => void
  ): Promise<IState> | void {
    //state is in memory
    if (this._getState(sid.id)) {
      const state = this._getState(sid.id);
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
    } else {
      //async load state from server
      const seqNum = this.seqNum++;
      var msg: MessageC2S = {
        SeqNum: seqNum,
        Type: MessageType.Query,
        TransID: sid.id,
        Data: {}
      };

      console.log('send msg is ', JSON.stringify(msg));
      this.client.send(JSON.stringify(msg));
      if (callback) {
        this.respCallbacks[seqNum] = callback;
      } else {
        return new Promise((res, rej) => {
          this.respCallbacks[seqNum] = res;
        });
      }
    }
  }

  sendTransaction(
    tid: StateTransition,
    args: {},
    callback: (res: ITransResult) => void
  ): ITransContext {
    const seqNum = this.seqNum++;
    var ctx: ITransContext = {
      SeqNum: seqNum,
      Type: MessageType.Transition,
      TransID: tid.toString()
    };

    var msg: MessageC2S = {
      ...ctx,
      Data: args
    };

    console.log('send msg is ', JSON.stringify(msg));
    this.client.send(JSON.stringify(msg));
    this.respCallbacks[seqNum] = callback;

    return ctx;
  }
  _updateState(sid: string, obj: {}, notify: boolean) {
    console.log('update state', sid, obj, notify);
    if (this.stateCaches[sid]) {
      this.notifyStateChange = notify;
      this.stateCaches[sid].update(obj);
      this.notifyStateChange = true;
    } else {
      this.stateCaches[sid] = new State<any>(obj, this);
    }
  }
  _getState(sid: string): IState {
    return this.stateCaches[sid];
  }
}
