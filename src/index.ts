import {
  City,
} from './Game/Logic/game';
import { CityFacility } from './Game/Const';
import { State, IStateChangeWatcher, IState } from './Core/mediator';
import {ConfigContainer } from './Core/config';
import { ICityState } from './Game/State';
import { FacilityMarketGdsRow, FacilityProductionGdsRow, FacilityHumanGdsRow,FacilityPowerGdsRow,FacilityLogisticsGdsRow} from "./Game/DataConfig"

import marketGDS = require('./league-of-thrones-data-sheets/.jsonoutput/market.json')
import powerGDS = require('./league-of-thrones-data-sheets/.jsonoutput/power.json')
import humanGDS = require('./league-of-thrones-data-sheets/.jsonoutput/human.json')
import logisticsGDS = require('./league-of-thrones-data-sheets/.jsonoutput/logistics.json')
import productionGDS = require('./league-of-thrones-data-sheets/.jsonoutput/production.json')

export const GameName = 'league of thrones';


hookStateChange = function(modify: {}, state: IState){
}



class StateWather implements IStateChangeWatcher{
  onStateChange(modify: {}, state: IState): void {
    console.log("onStateChange ", state.getId(), "moidfy ",modify)
    if (hookStateChange){
      hookStateChange(modify,state)
    }
  }
}

run = function() {

  const watcher = new StateWather()

  const cityState:ICityState= (new State<ICityState>({id:"city-testid",facilities:{
  },resources:{},troops:0},watcher)).unsderlying()



  city = new City((cityState as any as ICityState),{
    facilityConfig: {
      [CityFacility.Market]: new ConfigContainer<FacilityMarketGdsRow>(marketGDS.Config),
      [CityFacility.Production]:new ConfigContainer<FacilityProductionGdsRow>(productionGDS.Config),
      [CityFacility.Human]:new ConfigContainer<FacilityHumanGdsRow>(humanGDS.Config),
      [CityFacility.Logistics]:new ConfigContainer<FacilityLogisticsGdsRow>(logisticsGDS.Config),
      [CityFacility.Power]:new ConfigContainer<FacilityPowerGdsRow>(powerGDS.Config),
    },
  });

  city.upgradeFacility(CityFacility.Market);
  city.upgradeFacility(CityFacility.Market);
  city.upgradeFacility(CityFacility.Production);
  city.upgradeFacility(CityFacility.Human);
  city.upgradeFacility(CityFacility.Logistics);
  city.upgradeFacility(CityFacility.Power);

  city.showAll()
}
run()