import {City, FacilityLimit} from '../Logic/game'
import {LocalMediator} from '../Controler/mediator'
import {StateTransition, CityFacility, ResouceType, StateName, TestWallet} from '../Const'
import {BaseMediator , StateCallback}  from '../../Core/mediator'
import fortressGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/fortress.json');
import militaryCenterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/militarycenter.json');
import wallGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/wall.json');
import storeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/store.json');
import infantryCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/infantrycamp.json');
import cavalryCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/cavalrycamp.json');
import archerCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/archercamp.json');
import trainingCenterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/trainingcenter.json');
import homeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/home.json');
import buildingCount = require('../../league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import {State, IState, IStateIdentity} from '../../Core/state'
import {ConfigContainer} from '../../Core/config'
import {ICityState, ResouceInfo} from '../State'
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
} from '../DataConfig';
import {
  TransitionResponseArgs, TransitionId
} from '../Controler/transition'



interface IComponent {
  //trigger when state update
  onStateUpdate(callback: StateCallback): void;
  //trigger when action is response
  onActionResponse(callback: (args: TransitionResponseArgs) => void): void;
}

export interface ICityComponent extends IComponent {
  //TODO: replace any with inteface
  getFacilityList(): any;
  getResource(): any;
  getFacilityUpgradeRequirement(): any;
  doUpgradeFacility(): TransitionId;
}


export class CityComponent implements ICityComponent {
  type: ComponentType;
  city: City;
  mediator : LocalMediator
  cityStateId : IStateIdentity 

  constructor( myStateId : string ){
    this.cityStateId = {
      id: myStateId
    }
    const defaultState = {
      id: myStateId,
      facilities: {},
      resources: {}
    };
    this.type = ComponentType.City
    this.mediator = new LocalMediator()
    this.city  = new City(
      new State<ICityState>(defaultState).unsderlying(),
      {
        facilityConfig: {
          [CityFacility.Fortress]: new ConfigContainer<FacilityFortressGdsRow>(
            fortressGDS.Config
          ),
          [CityFacility.MilitaryCenter]:
            new ConfigContainer<FacilityMilitaryCenterGdsRow>(
              militaryCenterGDS.Config
            ),
          [CityFacility.Wall]: new ConfigContainer<FacilityWallGdsRow>(
            wallGDS.Config
          ),
          [CityFacility.Store]: new ConfigContainer<FacilityStoreGdsRow>(
            storeGDS.Config
          ),
          [CityFacility.InfantryCamp]:
            new ConfigContainer<FacilityInfantryCampGdsRow>(
              infantryCampGDS.Config
            ),
          [CityFacility.CavalryCamp]:
            new ConfigContainer<FacilityCavalryCampGdsRow>(cavalryCampGDS.Config),
          [CityFacility.ArcherCamp]:
            new ConfigContainer<FacilityArcherCampGdsRow>(archerCampGDS.Config),
          [CityFacility.TrainingCenter]:
            new ConfigContainer<FacilityTrainingCenterGdsRow>(
              trainingCenterGDS.Config
            ),
          [CityFacility.Home]: new ConfigContainer<FacilityHomeGdsRow>(
            homeGDS.Config
          )
        },
        limit: {
          [CityFacility.Fortress]: new FacilityLimit(buildingCount.fortress),
          [CityFacility.MilitaryCenter]: new FacilityLimit(
            buildingCount.militarycenter
          ),
          [CityFacility.Wall]: new FacilityLimit(buildingCount.wall),
          [CityFacility.Store]: new FacilityLimit(buildingCount.store),
          [CityFacility.InfantryCamp]: new FacilityLimit(
            buildingCount.infantrycamp
          ),
          [CityFacility.CavalryCamp]: new FacilityLimit(
            buildingCount.cavalrycamp
          ),
          [CityFacility.ArcherCamp]: new FacilityLimit(buildingCount.archercamp),
          [CityFacility.TrainingCenter]: new FacilityLimit(
            buildingCount.trainingcenter
          ),
          [CityFacility.Home]: new FacilityLimit(buildingCount.home)
        }
      }
    );
  }
  InitState():void{
  }
  getFacilityList(): any{}
  getResource(): any{}
  getFacilityUpgradeRequirement(): any{}

  doUpgradeFacility(): TransitionId{
    return this.mediator.sendTransaction(StateTransition.UpgradeFacility, {
      from: TestWallet,
      typ: CityFacility.Fortress,
      index: 0,
    })
  }
  onStateUpdate(callback: StateCallback): void{
    this.mediator.onReceiveState(
      this.cityStateId
      ,
      callback
    )
  }
  //trigger when action is response
  onActionResponse(callback: (args: TransitionResponseArgs) => void): void{
    this.mediator.transitionHandler.onTransitionResponse(
      this.cityStateId
      ,
      callback
    )
  }
}

export enum ComponentType {
  City = 1,
  General = 2
}

export interface IThrone {
  initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T) => void
  ): void;
}

export class Throne implements IThrone {
  //singleton
  static throne: Throne;
  static instance() {
    if (!Throne.throne) {
      Throne.throne = new Throne();
    }
    return this.throne;
  }

  components: { [key in ComponentType]?: IComponent } = {};
  constructor() {}

  initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T) => void
  ) {
    if(typ = ComponentType.City){
      this.components[ComponentType.City] = new CityComponent(`${StateName.City}:${TestWallet}`)
      let cityCom = this.components[ComponentType.City]  as CityComponent
      cityCom.InitState()
      console.log(cityCom)
      callback(cityCom as any as T)
    }
  }
}

function example() {
  Throne.instance().initComponent(
    ComponentType.City,
    (city: ICityComponent) => {
      console.log('City init');

      // bind button with action
      // button.onClick = () =>{
      //city.doUpgradeFacility()

      // watch action response
      city.onActionResponse((args) => {
        console.log("receive action", args)
      });

      // watch state update
      city.onStateUpdate((state) => {
        // regenerate  ui state
        const facilities = city.getFacilityList();
        const resource = city.getResource();
        const uiState = { facilities, resource };
        console.log("receive state", uiState)
        // rerender by new state
      });
      //update
    }
  );
  Throne.instance()[ComponentType.City].doUpgradeFacility()
}
