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
  private respContext: {};
  private stateCaches: { [key: string]: IState } = {};
  private ctx: ITransContext;
  private notifyStateChange: boolean;
  private closeCallback : ()=>void
  private hasCallClose : number

  transitionHandler: TransitionHandler;
  constructor(url: string) {
    super();
    this.seqNum = 1;
    this.client = new w3cwebsocket(url);
    this.respCallbacks = {};
    this.respContext ={}
    this.stateCaches = {};
    this.notifyStateChange = true;
    this.hasCallClose = 0
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.client.onopen = () => {
        resolve('');
      };

      this.hasCallClose = 0

      this.client.onmessage = (message: any) => {
        const msg: MessageS2C = JSON.parse(message.data) as MessageS2C;
        this.ctx = msg;

        console.log('client receive msg is ', JSON.stringify(msg));
        if (msg.SeqNum ) {
          //context call
          if (this.respCallbacks[msg.SeqNum]) {
            if (msg.Type === MessageType.Transition) {
              this.respCallbacks[msg.SeqNum]( {...this.respContext[msg.SeqNum],result:msg.Data} );
              for (var sid in msg.States) {
                const stateObj = msg.States[sid];
                this._updateState(sid, stateObj, false);
              }
            } else if (msg.Type == MessageType.StateQuery) {
              for (var sid in msg.States) {
                const stateObj = msg.States[sid];
                this._updateState(sid, stateObj, false);
              }
              this.respCallbacks[msg.SeqNum](this._getState(sid));
            } else if (msg.Type == MessageType.Query) {
              this.respCallbacks[msg.SeqNum](msg.Data);
            }
            delete this.respCallbacks[msg.SeqNum];
            delete this.respContext[msg.SeqNum];
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
        if(this.closeCallback != undefined){
          this.closeCallback()
        }
        console.log('Connection Error', err);
      };

      setInterval(() => {
        //ping
        this.client.send('{}')
        if(this.closeCallback != undefined && this.client.readyState == w3cwebsocket.CLOSED && this.hasCallClose == 0){
          this.closeCallback()
          this.hasCallClose = 1
        }
      }, 10000)
    });
  }

  onStateChange(modify: {}, state: IState): void {
    state &&
      this.notifyStateChange &&
      this.notifyState({ id: state.getId() }, { ...state, context: this.ctx });
  }


  query(
    typ: string,
    args:{}
  ):Promise<any> {
    const seqNum = this.seqNum++;
    var msg: MessageC2S = {
      SeqNum: seqNum,
      Type: MessageType.Query,
      TransID: typ,
      Data: args,
    };

    console.log('send msg is ', JSON.stringify(msg));
    this.client.send(JSON.stringify(msg));
    return new Promise((res, rej) => {
      this.respCallbacks[seqNum] = res;
    });
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
        Type: MessageType.StateQuery,
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
      Data: {...args,ts:new Date().getTime()},
    };

    console.log('send msg is ', JSON.stringify(msg));
    this.client.send(JSON.stringify(msg));
    this.respContext[seqNum] = ctx;
    this.respCallbacks[seqNum] = callback;

    return ctx;
  }

  setWsCloseCallbacl(callback: () => void): void {
    this.closeCallback = callback
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
