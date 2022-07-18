import { City, FacilityLimit } from './Game/Logic/game';
import {
  CityFacility,
  TestWallet,
  StateName,
  StateTransition
} from './Game/Const';
import { ConfigContainer } from './Core/config';
import { ICityState } from './Game/State';
import {
  FacilityFortressGdsRow,
  FacilityMilitaryCenterGdsRow,
  FacilityWallGdsRow,
  FacilityStoreGdsRow,
  FacilityInfantryCampGdsRow,
  FacilityCavalryCampGdsRow,
  FacilityArcherCampGdsRow,
  FacilityTrainingCenterGdsRow,
  FacilityHomeGdsRow
} from './Game/DataConfig';

import fortressGDS = require('./league-of-thrones-data-sheets/.jsonoutput/fortress.json');
import militaryCenterGDS = require('./league-of-thrones-data-sheets/.jsonoutput/militarycenter.json');
import wallGDS = require('./league-of-thrones-data-sheets/.jsonoutput/wall.json');
import storeGDS = require('./league-of-thrones-data-sheets/.jsonoutput/store.json');
import infantryCampGDS = require('./league-of-thrones-data-sheets/.jsonoutput/infantrycamp.json');
import cavalryCampGDS = require('./league-of-thrones-data-sheets/.jsonoutput/cavalrycamp.json');
import archerCampGDS = require('./league-of-thrones-data-sheets/.jsonoutput/archercamp.json');
import trainingCenterGDS = require('./league-of-thrones-data-sheets/.jsonoutput/trainingcenter.json');
import homeGDS = require('./league-of-thrones-data-sheets/.jsonoutput/home.json');
import buildingCount = require('./league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import { LocalMediator } from './Game/Controler/mediator';
import { IState, State } from './Core/state';
import {Throne, ICityComponent, IGeneralComponent, GeneralComponent , ComponentType, CityComponent} from './Game/Throne';
import { CityConfigFromGDS } from './Game/Controler/transition';

export const GameName = 'league of thrones';
export * from './Game/Controler/mediator';
export * from './Game/Controler/transition';
export * from './Game/State';
export * from './Core/state';
export * from './Game/Throne';
export * from './Game/Const';


export var run = function () {
  const mediator = new LocalMediator();

  const myCityStateId = `${StateName.City}:${TestWallet}`;

  //async accuire state
  const defaultState = {
    id: myCityStateId,
    facilities: {},
    resources: {}
  };
  const city: City = new City(
    new State<ICityState>(defaultState).unsderlying(),CityConfigFromGDS
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
    typ: CityFacility.Fortress,
    index: 0,
    targetLevel: 1
  });
  mediator.sendTransaction(StateTransition.UpgradeFacility, {
    from: TestWallet,
    typ: CityFacility.Fortress,
    index: 0,
    targetLevel: 2
  });
  // mediator.sendTransaction(StateTransition.UpgradeFacility, { from: TestWallet, typ: CityFacility.Logistics, index: 0, targetLevel: 1 })
};

//run();
function example() {
  Throne.instance().initComponent<CityComponent>(
    ComponentType.City,
    (city: ICityComponent) => {
      console.log('City init');
      // bind button with action
      // button.onClick = () =>{
      //city.doUpgradeFacility()
      console.log('test error',city.getUpgradeInfo(CityFacility.Store, 15))
      // watch action response
      city.onActionResponse((args) => {
        console.log("receive action", args)
      });

      console.log(city.getFacilityOrder())
      // watch state update
      city.onStateUpdate(() => {
        // regenerate  ui state
        const facilities = city.getFacilityList();
        const resource = city.getResource();
        const uiState = { facilities, resource };
        console.log("receive state", uiState)
        // rerender by new state
      });
      city.updateResource();
      (city as CityComponent)?.doUpgradeFacility(CityFacility.Fortress, 0);
      setTimeout(
        ()=>{
          city.doUpgradeFacility(CityFacility.Home, 0)
        },
        3000
      )
      
      //update
    }
  );
  Throne.instance().initComponent(
    ComponentType.General,
    ((general: IGeneralComponent)=>{
      general.onStateUpdate((state)=>{
        console.log("general",state)
      })
      const list = general.getAbleList();
      general.ableGeneral(1, (result)=>{
        console.log("general able ", result)
      })
      general.upgradeGeneral(1,  (result)=>{
        console.log("general up ", result)
      })
      console.log("value", general.getGeneralQuaValue(1, 1))
      console.log("general status ", general.getAbleStatus())
      general.upgradeGeneralSkill(1 , 0, 
        (result)=>{
          console.log("upgrade skill", result)
        }
        )
      console.log("general", general.getGeneralList())
      })
      
  )
}
example()