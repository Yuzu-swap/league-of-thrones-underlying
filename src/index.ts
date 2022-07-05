import { City } from './Game/Logic/game';
import {
  CityFacility,
  TestWallet,
  StateName,
  StateTransition
} from './Game/Const';
import { ConfigContainer } from './Core/config';
import { ICityState } from './Game/State';
import {
  FacilityMarketGdsRow,
  FacilityProductionGdsRow,
  FacilityHumanGdsRow,
  FacilityPowerGdsRow,
  FacilityLogisticsGdsRow
} from './Game/DataConfig';

import marketGDS = require('./league-of-thrones-data-sheets/.jsonoutput/market.json');
import powerGDS = require('./league-of-thrones-data-sheets/.jsonoutput/power.json');
import humanGDS = require('./league-of-thrones-data-sheets/.jsonoutput/human.json');
import logisticsGDS = require('./league-of-thrones-data-sheets/.jsonoutput/logistics.json');
import productionGDS = require('./league-of-thrones-data-sheets/.jsonoutput/production.json');
import { LocalMediator } from './Game/Controler/mediator';
import { IState, State } from './Core/state';

export const GameName = 'league of thrones';
export * from './Game/Controler/mediator';
export * from './Game/Controler/transition';
export * from './Core/state';

export var run = function () {
  const mediator = new LocalMediator();

  const myCityStateId = `${StateName.City}:${TestWallet}`;

  //async accuire state
  const defaultState = {
    id: myCityStateId,
    facilities: {},
    resources: {},
    troops: 0
  };
  const city: City = new City(
    new State<ICityState>(defaultState).unsderlying(),
    {
      facilityConfig: {
        [CityFacility.Market]: new ConfigContainer<FacilityMarketGdsRow>(
          marketGDS.Config
        ),
        [CityFacility.Production]:
          new ConfigContainer<FacilityProductionGdsRow>(productionGDS.Config),
        [CityFacility.Human]: new ConfigContainer<FacilityHumanGdsRow>(
          humanGDS.Config
        ),
        [CityFacility.Logistics]: new ConfigContainer<FacilityLogisticsGdsRow>(
          logisticsGDS.Config
        ),
        [CityFacility.Power]: new ConfigContainer<FacilityPowerGdsRow>(
          powerGDS.Config
        )
      }
    }
  );
  let cityInitd: boolean = false;
  mediator.onReceiveState({ id: myCityStateId }, (state: IState) => {
    //first init
    if (!cityInitd) {
      cityInitd = true;
      console.log('city initd');
      city.loadState(state.stateObj());
      city.showAll();
      //city update
    } else {
      console.log('city updated');
      city.loadState(state.stateObj());
      city.showAll();
    }
  });
  //trigger aysnc query
  mediator.queryState({ id: myCityStateId });

  //trigger upgrade
  mediator.sendTransaction(StateTransition.UpgradeFacility, {
    from: TestWallet,
    typ: CityFacility.Human,
    index: 0,
    targetLevel: 1
  });
  mediator.sendTransaction(StateTransition.UpgradeFacility, {
    from: TestWallet,
    typ: CityFacility.Human,
    index: 0,
    targetLevel: 2
  });
  // mediator.sendTransaction(StateTransition.UpgradeFacility, { from: TestWallet, typ: CityFacility.Logistics, index: 0, targetLevel: 1 })
};

//run()