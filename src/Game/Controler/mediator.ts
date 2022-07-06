import { StateName, StateTransition, TestWallet } from '../Const';
import { BaseMediator } from '../../Core/mediator';
import { IStateIdentity, IState, IStateChangeWatcher, State } from '../../Core/state';
import { TransitionHandler } from './transition';
import { ICityState } from '../State';



const cityStateId = `${StateName.City}:${TestWallet}`;





let _initState = {}
function initState(wather: IStateChangeWatcher) :void{
  _initState = {
    [cityStateId]: new State<ICityState>(
      {
        id: cityStateId,
        facilities: {},
        resources: {},
        troops: 0
      },wather
    ).unsderlying()
  }
}
function loadInitState(sid: IStateIdentity) :IState{
  return _initState[sid.id]
}


export class LocalMediator
  extends BaseMediator<StateTransition>
  implements IStateChangeWatcher
{
  transitionHandler: TransitionHandler;
  constructor() {
    super();
    initState(this)
    this.transitionHandler = new TransitionHandler(this,loadInitState);
  }
  onStateChange(modify: {}, state: IState): void {
    state && this.notifyState({ id: state.getId() }, state);
  }

  queryState(sid: IStateIdentity): void {
    const state = this.transitionHandler.stateManger.get(sid);
    state && this.notifyState(sid, state);
  }

  sendTransaction(tid: StateTransition, args: {}): void {
    this.transitionHandler.onTransition(tid, args);
  }
}
