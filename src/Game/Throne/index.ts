import { General , GeneralAbility} from '../Logic/general'
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
   * get able status
   * @returns able_count: number, max_able_count: number
  */
  getAbleStatus():{}

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

  /**
   * get the qualification value of the general 
   * @param id the id of the general 
   * @param level the level of the general
  */
  getGeneralQuaValue(id : number, level : number): {}
  /**
   * get the silver that general skill upgrade need
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
   * @param level the level of the skill
  */
  getSkillUpgradeNeed( generalId : number, skillIndex : number, level: number): number
  /**
   * check if general skill can upgrade 
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
  */
  checkGeneralSkillUpgrade(generalId : number, skillIndex : number):boolean

  /**
   * get general skill list 
   * @param generalId the id of the general 
   * @returns skill_id: number[],  skill_level : number[],  upgrade_need: number[] , value_type: number[], buff_value: number[], check_upgrade: boolean[]
  */
  getGeneralSkillList(generalId : number):{}

  /**
   * upgrade skill of general
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
  */
  upgradeGeneralSkill(generalId : number, skillIndex : number,  callback: (result: any)=>void):void
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

  getAbleStatus(): {} {
    let re = {
      able_count: 0,
      max_able_count : 0
    }
    re.max_able_count = this.general.city.getGeneralMaxAble()
    re.able_count = this.general.getAbleCount()
    return re
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
      temp.skilllevel = this.general.state.skill_levels[i].concat()
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

  getGeneralQuaValue(id: number, level: number): {} {
    let re = {}
    re['attack'] = this.general.getGeneralAbility(id, level, GeneralAbility.Attack)
    re['defense'] = this.general.getGeneralAbility(id, level, GeneralAbility.Defense)
    re['load'] = this.general.getGeneralAbility(id, level, GeneralAbility.Load)
    re['silver_product'] = this.general.getGeneralAbility(id, level, GeneralAbility.Silver)
    re['troop_product'] = this.general.getGeneralAbility(id, level, GeneralAbility.Troop)
    return re
  }

  getSkillUpgradeNeed(generalId: number, skillIndex: number, level: number): number {
    return this.general.getSkillUpdateNeed(generalId, skillIndex, level)
  }

  checkGeneralSkillUpgrade(generalId: number, skillIndex: number): boolean {
    return this.general.checkGeneralSkillUpgrade(generalId, skillIndex)
  }

  getGeneralSkillList(generalId: number): {} {
    //skill_id: number[],  skill_level : number[],  upgrade_need: number[] , value_type: number[], buff_value: number[], check_upgrade: boolean[]
    let re ={
      skill_id : [],
      skill_level : [],
      upgrade_need : [],
      value_type: [],
      value: [],
      check_upgrade:[]
    }
    let qualification =JSON.parse(JSON.stringify(this.getGeneralQualification(generalId)))
    re.skill_id = qualification.general_skill.concat()
    re.skill_level = this.general.state.skill_levels[generalId - 1].concat()
    let upgrade_need = new Array(re.skill_id.length).fill(0)
    let value_type = new Array(re.skill_id.length).fill(0)
    let value = new Array(re.skill_id.length).fill(0)
    let check_upgrade = new Array(re.skill_id.length).fill(false)
    for(let i = 0; i < re.skill_id.length; i++){
      upgrade_need[i] = this.general.getSkillUpdateNeed(generalId, i, re.skill_level[i])
      let temp = this.general.getSkillValue(generalId, i, re.skill_level[i])
      value_type[i] = temp['value_type']
      value[i] = temp['value']
      check_upgrade[i] = this.general.checkGeneralSkillUpgrade(generalId, i)
    }
    re.upgrade_need = upgrade_need
    re.value_type = value_type
    re.value = value
    re.check_upgrade = check_upgrade
    return re
  }

  upgradeGeneralSkill(generalId: number, skillIndex: number, callback: (result: any) => void): void {
    callback(this.general.upgradeGeneralSkill(generalId, skillIndex))
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
