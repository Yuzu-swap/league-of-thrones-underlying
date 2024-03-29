import { w3cwebsocket } from 'websocket';
import { BaseMediator } from '../../Core/mediator';
import {
  IStateChangeWatcher,
  IState,
  IStateIdentity,
  State
} from '../../Core/state';
import { ChatMessage, ChatTransId, ProfileTransId, StateTransition } from '../Const';
import { ITransContext, ITransResult } from './mediator';
import { TransitionHandler } from './transition';
import { MessageS2C, MessageType, MessageC2S } from './Websocket/protocol';

export class WebSocketMediator
  extends BaseMediator<StateTransition, ITransContext>
  implements IStateChangeWatcher{
  private client: any;
  private seqNum: number;
  private respCallbacks: {};
  private respContext: {};
  private stateCaches: { [key: string]: IState } = {};
  private ctx: ITransContext;
  private notifyStateChange: boolean;
  private closeCallback : (err: any)=>void
  private hasCallClose : number
  private seasonId : string
  private chainBlockCallback: (msg: MessageS2C) => void

  transitionHandler: TransitionHandler;
  constructor(url: string, data: any) {
    super();
    this.seqNum = 1;
    this.client = new w3cwebsocket(url);
    this.respCallbacks = {};
    this.respContext ={};
    this.stateCaches = {};
    this.notifyStateChange = true;
    this.hasCallClose = 0;
    this.seasonId = data.seasonId;
  }

  async init() {
    return new Promise((resolve, reject) => {
      var _this = this;
      this.client.onopen = () => {
        resolve('');
      };

      this.hasCallClose = 0

      this.client.onmessage = (message: any) => {
        const msg: MessageS2C = JSON.parse(message.data) as MessageS2C;
        this.ctx = msg;
        
        if((msg.Type == MessageType.Transition || msg.Type == MessageType.SyncBlockchain) && this.chainBlockCallback){
          this.chainBlockCallback(msg)
        }
        console.log('client receive msg is ', JSON.stringify(msg));
        if(msg.TransID === 'kickout'){
          this.hasCallClose = 1
          if(_this.closeCallback != undefined){
            _this.closeCallback(msg)
          }
        }
        if (msg.SeqNum ) {
          //context call
          if (this.respCallbacks[msg.SeqNum]) {
            if (msg.Type === MessageType.Transition) {
              this.respCallbacks[msg.SeqNum]( {...this.respContext[msg.SeqNum],result:msg.Data} );
              for (var sid in msg.States) {
                const stateObj = msg.States[sid];
                this._updateState(sid, stateObj, true);
              }
            } else if (msg.Type == MessageType.StateQuery) {
              for (var sid in msg.States) {
                const stateObj = msg.States[sid];
                this._updateState(sid, stateObj, false);
              }
              this.respCallbacks[msg.SeqNum](this._getState(sid));
            } else if (msg.Type == MessageType.Query || msg.Type == MessageType.Chat || msg.Type == MessageType.QueryCount || msg.Type == MessageType.Profile) {
              this.respCallbacks[msg.SeqNum](msg.Data);
            } 
            delete this.respCallbacks[msg.SeqNum];
            delete this.respContext[msg.SeqNum];
          }
        } else {
          if (msg.Type === MessageType.Transition) {
            // state notify
            for (var sid in msg.States) {
              const stateObj = msg.States[sid];
              this._updateState(sid, stateObj, true);
            }
          } else if (msg.Type === MessageType.Chat)  {
            var msgList: ChatMessage[] = msg.Data as ChatMessage[]
            for (var chatMsg of msgList){
              //TODO:handle chant msg
              this.onReceiveChat(chatMsg)
            }
          }
        }
      };

      this.client.onerror = function (err: Error) {
        if(_this.closeCallback != undefined && this.hasCallClose === 0){
          _this.closeCallback(err)
        }
        this.hasCallClose = 1
        console.log('onerror', err);
      };

      // this.client.onclose = function (err: Error) {
      //   if(_this.closeCallback != undefined){
      //     _this.closeCallback(err)
      //   }
      //   this.hasCallClose = 1
      //   console.log('onclose', err);
      // };

      setInterval(() => {
        //ping
        this.client.send('{}')
        if(this.closeCallback != undefined && this.client.readyState == w3cwebsocket.CLOSED && this.hasCallClose == 0){
          this.closeCallback({setInterval:1, hasCallClose: this.hasCallClose})
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


  query(typ: string, args: {seasonId: string} ): Promise<any> {
    const seqNum = this.seqNum++;
    args.seasonId = this.seasonId;
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

  defaultQuery(type: MessageType, transID: string, args: { seasonId: string }): Promise<any> {
    const seqNum = this.seqNum++;
    args.seasonId = this.seasonId;
    var msg: MessageC2S = {
      SeqNum: seqNum,
      Type: type,
      TransID: transID,
      Data: args,
    };
    console.log('send msg is ', JSON.stringify(msg));
    this.client.send(JSON.stringify(msg));
    return new Promise((res, rej) => {
      this.respCallbacks[seqNum] = res;
    });
  }

  chat(data: ChatMessage): Promise<any> {
    const seqNum = this.seqNum++;
    data.seasonId = this.seasonId;
    var msg: MessageC2S = {
      SeqNum: seqNum,
      Type: MessageType.Chat,
      TransID: ChatTransId.SendChat,
      Data: data,
    };

    console.log('chat msg is ', JSON.stringify(msg));
    this.client.send(JSON.stringify(msg));
    return new Promise((res, rej) => {
      this.respCallbacks[seqNum] = res;
    });
  }

  chatHistory(data: { seasonId: string }): Promise<any> {
    const seqNum = this.seqNum++;
    data.seasonId = this.seasonId;
    var msg: MessageC2S = {
      SeqNum: seqNum,
      Type: MessageType.Chat,
      TransID: ChatTransId.HistoryData,
      Data: data,
    };

    this.client.send(JSON.stringify(msg));
    return new Promise((res, rej) => {
      this.respCallbacks[seqNum] = res;
    });
  }

  profileQuery(key: string): Promise<any> {
    const seqNum = this.seqNum++;
    const seasonId = this.seasonId;
    var msg: MessageC2S = {
      SeqNum: seqNum,
      Type: MessageType.Profile,
      TransID: ProfileTransId.Query,
      Data: {
        seasonId: seasonId,
        key : key
      },
    };
    this.client.send(JSON.stringify(msg));
    return new Promise((res, rej) => {
      this.respCallbacks[seqNum] = res;
    })
  }

  profileSave(key: string, value: string): Promise<any> {
    const seqNum = this.seqNum++;
    const seasonId = this.seasonId;
    var msg: MessageC2S = {
      SeqNum: seqNum,
      Type: MessageType.Profile,
      TransID: ProfileTransId.Save,
      Data: {
        seasonId: seasonId,
        key : key,
        value : value 
      },
    };
    this.client.send(JSON.stringify(msg));
    return new Promise((res, rej) => {
      this.respCallbacks[seqNum] = res;
    })
  }


  queryState(
    sid: IStateIdentity,
    args: { seasonId: string },
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
      const seasonId = this.seasonId;
      var msg: MessageC2S = {
        SeqNum: seqNum,
        Type: MessageType.StateQuery,
        TransID: sid.id,
        Data: {
          seasonId: seasonId
        }
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
    args: any,
    callback: (res: ITransResult) => void
  ): ITransContext {
    const seqNum = this.seqNum++;
    args.seasonId = this.seasonId;
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

  setWsCloseCallback(callback: () => void): void {
    this.closeCallback = callback
  }
  setChainBlockCallback(callback: ( msg: MessageS2C ) => void){
		this.chainBlockCallback = callback
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
