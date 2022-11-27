import { ChatChannel, ChatMessage } from "../Game/Const"
import { MessageType } from "../Game/Controler/Websocket/protocol"
import { IStateIdentity, IState } from "./state"


export interface IContextState<ContextType> extends IState {
	context: ContextType
}

export type StateCallback<ContextType> = (state: IContextState<ContextType>) => void

export interface IStateMediator<TransactionIDType, ContextType> {
	queryState(sid: IStateIdentity, args: {}, callback: (state: IState) => void): Promise<IState> | void
	defaultQuery( type: MessageType, transID: string, args:{}):Promise<any>
	query( typ: string, args:{}):Promise<any>
	chat( data: ChatMessage ): Promise<any>
	chatHistory( data: {} ): Promise<any>
	sendTransaction(tid: TransactionIDType, args: {}, callback: (res: any) => void): ContextType
	onReceiveState(sid: IStateIdentity, callback: StateCallback<ContextType>): void
	onReceiveChat(data:ChatMessage): void
	listenChat( channel: ChatChannel, callback: (data:ChatMessage)=> void ): void
	setWsCloseCallbacl(callback : () => void): void
}


export class BaseMediator<TransactionIDType, ContextType> implements IStateMediator<TransactionIDType, ContextType>{
	listeners: { [key: string]: StateCallback<ContextType>[] }
	chatListener: { [key in ChatChannel] : ((data:ChatMessage)=> void)[] }
	constructor() {
		this.listeners = {}
		this.chatListener = {
			[ChatChannel.ChatChannel_Camp] : [],
			[ChatChannel.ChatChannel_WORLD] : []
		}
	}

	onReceiveState(sid: IStateIdentity, callback: StateCallback<ContextType>): void {
		if (!this.listeners[sid.id]) {
			this.listeners[sid.id] = []
		}
		this.listeners[sid.id].push(callback)
	}

	onReceiveChat(data: ChatMessage): void {
		let callbacklist = this.chatListener[data.channel]
		for( let callback of callbacklist){
			callback(data)
		}
	}

	listenChat(channel: ChatChannel, callback: (data: ChatMessage) => void) {
		this.chatListener[channel].push(callback)
	}


	queryState(sid: IStateIdentity, args: {}, callback: (state: IState) => void): Promise<IState> | void {
		throw "not emplement"
	}
	query( typ: string, args:{}):Promise<any> {
		throw "not emplement"
	}
	defaultQuery(type: MessageType, transID: string, args: {}): Promise<any> {
		throw "not emplement"
	}

	chat(data: ChatMessage): Promise<any> {
		throw "not emplement"
	}

	chatHistory(data: {}): Promise<any> {
		throw "not emplement"
	}

	sendTransaction(tid: TransactionIDType, args: {}, callback: (res: any) => void): ContextType {
		throw "not emplement"
	}

	setWsCloseCallbacl(callback : () => void){

	}

	protected notifyState(sid: IStateIdentity, state: IContextState<ContextType>): void {
		const listeners: StateCallback<ContextType>[] = this.listeners[sid.id]
		for (var index in listeners) {
			listeners[index](state)
		}
	}
}
