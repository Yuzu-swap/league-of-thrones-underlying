import { IStateIdentity, IState, IStateManager } from "../../Core/state";



export class MemoryStateManager implements IStateManager {
	states: { [key: string]: IState }
	constructor(initStates: { [key: string]: IState }) {
		this.states = initStates
	}

	load(sid: IStateIdentity): IState {
		return this.states[sid.id]
	}

	save(sid: IStateIdentity, state: IState): void {
	}
}