import { StateTransition } from "../Const";
import { BaseMediator } from "../../Core/mediator";
import { IStateIdentity, IState, IStateChangeWatcher } from "../../Core/state";
import { TransitionHandler } from "./transition";


export class LocalMediator extends BaseMediator<StateTransition> implements IStateChangeWatcher {
	transitionHandler: TransitionHandler
	constructor() {
		super()
		this.transitionHandler = new TransitionHandler(this)
	}
	onStateChange(modify: {}, state: IState): void {
		state && this.notifyState({ id: state.getId() }, state)
	}

	queryState(sid: IStateIdentity): void {
		const state = this.transitionHandler.stateManger.load(sid)
		state && this.notifyState(sid, state)
	}

	sendTransaction(tid: StateTransition, args: {}): void {
		this.transitionHandler.onTransition(tid, args)
	}

}