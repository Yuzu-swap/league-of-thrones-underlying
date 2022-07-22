import {
  IStateIdentity,
  IState,
  IStateManager,
  IStateChangeWatcher,
  State
} from '../../Core/state';


import {
  CityFacility,
  StateTransition,
  UpgradeFacilityArgs,
  StateName,
  TestWallet
} from '../Const';

import { City, CityConfig, FacilityLimit } from '../Logic/game';
import { ICityState } from '../State';
import { BaseStateManager, LoadStateFunc } from './statemanger';

const log = globalThis.log || function(){}



export class TransitionHandler {
  stateManger: IStateManager;
  dataConfigs: CityConfig;

  constructor(
    stateWatcher: IStateChangeWatcher,
    loadLoadStateFunc?: LoadStateFunc
  ) {
    //init state
    const cityStateId = `${StateName.City}:${TestWallet}`;
    this.stateManger = new BaseStateManager({}, loadLoadStateFunc);
  }

  onTransition(sid: StateTransition, arg: {}) : {}{
    switch (sid) {
      case StateTransition.UpgradeFacility:
        return this.onUpdateFacility(arg as UpgradeFacilityArgs);
    }
  }


  onUpdateFacility(args: UpgradeFacilityArgs) : {}{
    const stateId = { id: `${StateName.City}:${args.from}` };
    const cityState = this.stateManger.get(stateId);

    log("onUpdateFacility args ",args, " cityState ",cityState)

    const city = new City(cityState as any as ICityState);

    //Do Logic  here
    //Valdiate resource requirement first
    return city.upgradeFacility(args.typ, args.index)
  }
}
