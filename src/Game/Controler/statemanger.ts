import { IStateIdentity, IState, IStateManager } from '../../Core/state';

export type LoadStateFunc = (sid: IStateIdentity) => IState;

export function GenerateMemoryLoadStateFunction(initStates: {
  [key: string]: IState;
}): LoadStateFunc {
  var states: { [key: string]: IState } = initStates || {};

  return (sid: IStateIdentity) => {
    return states[sid.id];
  };
}

export class BaseStateManager implements IStateManager {
  states: { [key: string]: IState };
  loadStateFunc: LoadStateFunc;
  cache: boolean
  constructor(
    initStates: { [key: string]: IState },
    loadStateFunc?: LoadStateFunc,
    cache?:boolean,
  ) {
    this.states = initStates;
    this.loadStateFunc = loadStateFunc;
    this.cache = cache
  }

  get(sid: IStateIdentity): IState {
    if( this.cache && this.states[sid.id]){
      return this.states[sid.id]
    }
    if(this.loadStateFunc(sid)){
      this.save(sid, this.loadStateFunc(sid))
    }
    return this.states[sid.id]
  }

  save(sid: IStateIdentity, state: IState): void {
    this.states[sid.id] = state
  }
}
