import { stat } from 'fs';
import { IStateIdentity, IState, IStateManager } from '../../Core/state';

export type LoadStateFunc = (sid: IStateIdentity) => IState;

export class MemoryStateManager implements IStateManager {
  states: { [key: string]: IState };
  loadStateFunc: LoadStateFunc;
  constructor(
    initStates: { [key: string]: IState },
    loadStateFunc?: LoadStateFunc
  ) {
    this.states = initStates;
    this.loadStateFunc = loadStateFunc;
  }
 

  get(sid: IStateIdentity): IState {
    let state = this.states[sid.id];
    if (!state) {
      if (this.loadStateFunc) {
        state = this.loadStateFunc(sid);
        this.states[sid.id] = state;
      }
    }
    return state;
  }

  save(sid: IStateIdentity, state: IState): void {}
}
