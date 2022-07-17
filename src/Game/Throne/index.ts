import { General } from '../Logic/general'
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
import qualificationGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/general.json');
import buffGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/buff_table.json')
import {State, IState, IStateIdentity, copyObj} from '../../Core/state'
import {ConfigContainer} from '../../Core/config'
import {ICityState, IGeneralState, ResouceInfo} from '../State'
import {
  FacilityFortressGdsRow,
  FacilityMilitaryCenterGdsRow,
  FacilityWallGdsRow,
  FacilityStoreGdsRow,
  FacilityInfantryCampGdsRow,
  FacilityCavalryCampGdsRow,
  FacilityArcherCampGdsRow,
  FacilityTrainingCenterGdsRow,
  FacilityHomeGdsRow,
  FacilityGdsRow,
  GeneralGdsRow,
  BuffGdsRow
} from '../DataConfig';
import {
  TransitionResponseArgs, TransitionId, CityConfigFromGDS
} from '../Controler/transition'



interface IComponent {
  //trigger when state update
  onStateUpdate(callback: StateCallback): void;
  //trigger when action is response
  onActionResponse(callback: (args: TransitionResponseArgs) => void): void;
}

export interface ICityComponent extends IComponent {
  //TODO: replace any with inteface
  getFacilityList(): {[key in CityFacility]?: number[] };
  getResource(): {[key in ResouceType]?: ResouceInfo};
  /**
   * Returns the info of facility than it upgrades need , when returns undefined means can't upgrade to this level
   * @param typ the type of the facility
  */
  getUpgradeInfo(typ: CityFacility, targetLevel: number ) :FacilityGdsRow | undefined;
  /**
   * Returns the all info of facility than it upgrades need
   * @param typ the type of the facility
  */
  getAllUpgradeInfo(typ: CityFacility ) :FacilityGdsRow[];

  /**
   * Returns the order of the facility for show
  */
  getFacilityOrder(): string[];
  updateResource(inter ?: number): void;
  checkUpgradeFacility(typ: CityFacility, index: number): boolean;
  getFacilityUpgradeRequirement(typ: CityFacility, targetLevel: number): any;
  doUpgradeFacility(typ: CityFacility, index: number): TransitionId;
}

export interface IGeneralComponent extends IComponent{
  /**
   * get the qualification of the general 
   * @param id the id of the general
  */
  getGeneralQualification(id: number):GeneralGdsRow | undefined
  /**
   * get the able status of the generals
  */
  getAbleList():boolean[]
  /**
   * get all status of general , includes general level , able status and qualification
  */
  getGeneralList():any[]

  /**
   * enable the general
   *  @param id the id of the general
  */
  ableGeneral(id: number, callback: (result: any)=>void):void
  /**
   * disable the general
   *  @param id the id of the general
  */
  disableGeneral(id: number, callback: (result: any)=>void): void
  /**
   * check if can upgrade general 
   *  @param id the id of the general
  */
  checkUpgradeGeneral(id: number):boolean
  /**
   * upgrade the general
   *  @param id the id of the general
  */
  upgradeGeneral(id: number, callback: (result: any)=>void):void
  /**
   * get the silver general upgrade need
   * @param id the id of the general
   * @param level current level
  */
  getUpgradeGeneralNeed(id: number, level: number): number
}


export class CityComponent implements ICityComponent {
  type: ComponentType;
  city: City;
  mediator : LocalMediator
  cityStateId : IStateIdentity 

  constructor( myStateId : string, mediator: LocalMediator ){
    this.cityStateId = {
      id: myStateId
    }
    this.type = ComponentType.City
    this.mediator = mediator
   
    const initCityState = this.mediator.transitionHandler.stateManger.get(this.cityStateId) as ICityState

    this.city  = new City(
      initCityState, CityConfigFromGDS
    );
  }
  InitState():void{
  }

  getUpgradeInfo(typ: CityFacility, targetLevel: number ) :FacilityGdsRow{
    return this.city.getUpgradeInfo(typ, targetLevel)
  }

  getAllUpgradeInfo(typ: CityFacility): FacilityGdsRow[]{
    return this.city.getAllUpgradeInfo(typ)
  }

  getFacilityOrder() : string[]{
    return this.city.getFacilityOrder()
  }

  updateResource(inter : number = 5000): void{
    setInterval(
      ()=>{
        for(let key in this.city.state.resources){
          this.city.getResource(key as any as ResouceType)
        }
      },
      inter
    )
    
  }

  getFacilityList(): {[key in CityFacility]?: number[] }{
    return copyObj(this.city.state.facilities)
  }
  getResource(): {[key in ResouceType]?: ResouceInfo}{
    return copyObj(this.city.state.resources)
  }
  getFacilityUpgradeRequirement(typ: CityFacility, targetLevel: number): FacilityGdsRow | undefined{
    return this.city.getUpgradeInfo(typ, targetLevel)
  }

  checkUpgradeFacility(typ: CityFacility, index: number): boolean{
    return this.city.checkUpgradeFacility(typ, index)
  }

  doUpgradeFacility(typ: CityFacility, index: number): TransitionId{
    return this.mediator.sendTransaction(StateTransition.UpgradeFacility, {
      from: TestWallet,
      typ: typ,
      index: index,
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

export class GeneralComponent implements IGeneralComponent{
  type: ComponentType;
  general: General;
  mediator : LocalMediator
  generalStateId : IStateIdentity 
  constructor( myStateId : string, mediator: LocalMediator , city: CityComponent){
    this.generalStateId = {
      id: myStateId
    }
    const defaultState = {
      id: myStateId,
      levels:[],
      able:[],
      skill_levels:[]
    };
    this.type = ComponentType.General
    this.mediator = mediator
    this.general  = new General(
      new State<IGeneralState>(defaultState).unsderlying(),
      {
        qualification: new ConfigContainer<GeneralGdsRow>(qualificationGDS.Config),
        buff: new ConfigContainer<BuffGdsRow>(buffGDS.Config),
      },
      city.city
    );
  }

  InitState():void{
    this.general.state = this.mediator.transitionHandler.stateManger.get(this.generalStateId) as IGeneralState
    this.general.initState()
  }
  getGeneralQualification(id : number){
    return this.general.getGeneralQualification(id)
  }
  getAbleList(): boolean[] {
    return this.general.getAbleList()
  }
  getGeneralList():any[]{
    let len = this.general.state.able.length
    let re = new Array(len).fill({})
    for( let i = 0; i< len; i++ ){
      let temp = {
        qualification:{},
        level: 0,
        able: false,
        skilllevel:[1, 1, 1]
      }
      temp.qualification =JSON.parse(JSON.stringify(this.getGeneralQualification(i + 1)))
      temp.level = this.general.state.levels[i]
      temp.able = this.general.state.able[i]
      re[i] = temp
    }
    return re
  }

  ableGeneral(id: number, callback: (result: any)=>void): void {
    callback(this.general.ableGeneral(id))
  }

  disableGeneral(id: number, callback: (result: any)=>void): void {
    callback(this.general.disableGeneral(id))
  }

  upgradeGeneral(id: number, callback: (result: any)=>void): void {
    callback(this.general.upgradeGeneral(id))
  }

  onStateUpdate(callback: StateCallback): void{
    this.mediator.onReceiveState(
      this.generalStateId
      ,
      callback
    )
  }

  checkUpgradeGeneral(id: number): boolean {
    return this.general.checkUpgradeGeneral(id)
  }

  getUpgradeGeneralNeed(id: number, level: number): number {
    return this.general.getGeneralUpgradeNeed(id, level)
  }

  //trigger when action is response
  onActionResponse(callback: (args: TransitionResponseArgs) => void): void{
    this.mediator.transitionHandler.onTransitionResponse(
      this.generalStateId
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
  mediator: LocalMediator

  components: { [key in ComponentType]?: IComponent } = {};
  constructor() {
    this.mediator = new LocalMediator()
  }

  initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T) => void
  ) {
    if(typ == ComponentType.City){
      this.components[ComponentType.City] = new CityComponent(`${StateName.City}:${TestWallet}`, this.mediator)
      let cityCom = this.components[ComponentType.City]  as CityComponent
      cityCom.InitState()
      callback(cityCom as any as T)
    }else if(typ == ComponentType.General){
      if(!this.components[ComponentType.City]){
        return false
      }
      this.components[ComponentType.General] = new GeneralComponent(`${StateName.General}:${TestWallet}`, this.mediator, this.components[ComponentType.City] as CityComponent)
      let generalCom = this.components[ComponentType.General] as GeneralComponent
      generalCom.InitState()
      callback(generalCom as any as T)
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

//      console.log(city.getAllUpgradeInfo(CityFacility.Home))

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
  Throne.instance().initComponent(
    ComponentType.General,
    ((general: IGeneralComponent)=>{
      general.onStateUpdate((state)=>{
        console.log("general",state)
      })


      }
    )
  )
  Throne.instance()[ComponentType.City].doUpgradeFacility()
}
