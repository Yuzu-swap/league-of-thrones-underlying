import { BattleRecord, BattleResult, BattleType, General, GeneralAbility } from '../Logic/general'
import { City, RecruitStatus } from '../Logic/game'
import { ITransContext, LocalMediator, IStatetWithTransContextCallback, ITransResult } from '../Controler/mediator'
import { StateTransition, CityFacility, ResouceType, StateName } from '../Const'
import { BaseMediator, IStateMediator, StateCallback } from '../../Core/mediator'
import { State, IState, IStateIdentity, copyObj } from '../../Core/state'
import { ConfigContainer } from '../../Core/config'
import { IBlockState, ICityState, IGeneralState, IMapGlobalState, InitState, IRewardGlobalState, ISeasonConfigState, ResouceInfo } from '../State'
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
import mapGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config.json')
import { LogicEssential, createLogicEsential, StateEssential, ConfigEssential } from '../Logic/creator'
import { promises } from 'dns'
import { WebSocketMediator } from '../Controler/websocket'
import { callbackify } from 'util'
import { userInfo } from 'os'
import { MapComponent, IMapComponent } from './map'
import { BattleTransRecord, TransitionEventType } from '../Controler/transition'
import { getTimeStamp, setTimeOffset } from '../Utils'



export interface IComponent {
  //trigger when state update
  onStateUpdate(callback: IStatetWithTransContextCallback): void;
}

export interface ICityComponent extends IComponent {
  //TODO: replace any with inteface
  getFacilityList(): { [key in CityFacility]?: number[] };
  getResource(): { [key : string]: {} };
  /**
   * Returns the info of facility than it upgrades need , when returns undefined means can't upgrade to this level
   * @param typ the type of the facility
  */
  getUpgradeInfo(typ: CityFacility, targetLevel: number): FacilityGdsRow | undefined;
  /**
   * Returns the all info of facility than it upgrades need
   * @param typ the type of the facility
  */
  getAllUpgradeInfo(typ: CityFacility): FacilityGdsRow[];

  /**
   * Returns the order of the facility for show
  */
  getFacilityOrder(): string[];
  updateResource(inter?: number): void;
  checkUpgradeFacility(typ: CityFacility, index: number): boolean;
  getFacilityUpgradeRequirement(typ: CityFacility, targetLevel: number): any;
  doUpgradeFacility(typ: CityFacility, index: number, callback: (res: ITransResult) => void): void;
  /**
   * recruit troop
  */
  doRecruit(amount: number, callback: (res: ITransResult) => void): void;

   /**
   * get Recruit state
  */
  getRecruitState():{}

  /**
   * receive troop
  */
  receiveTroop(callback:(result: any) => void): void

  getRechargeConfigs():[]
  
}

export interface IGeneralComponent extends IComponent {
  /**
   * get const data
  */
  getConstData(): {}
  /**
   * get the qualification of the general 
   * @param id the id of the general
  */
  getGeneralQualification(id: number): GeneralGdsRow | undefined
  /**
   * get able status
   * @returns able_count: number, max_able_count: number
  */
  getAbleStatus(): {}

  /**
   * get all status of general , includes general level , able status and qualification
  */
  getGeneralList(): {}
  /**
   * enable the general
   *  @param id the id of the general
  */
  ableGeneral(id: number, callback: (result: any) => void): void
  /**
   * disable the general
   *  @param id the id of the general
  */
  disableGeneral(id: number, callback: (result: any) => void): void
  /**
   * check if can upgrade general 
   *  @param id the id of the general
  */
  checkUpgradeGeneral(id: number): boolean
  /**
   * upgrade the general
   *  @param id the id of the general
  */
  upgradeGeneral(id: number, callback: (result: any) => void): void
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
  getGeneralQuaValue(id: number, level: number): {}
  /**
   * get the silver that general skill upgrade need
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
   * @param level the level of the skill
  */
  getSkillUpgradeNeed(generalId: number, skillIndex: number, level: number): number
  /**
   * check if general skill can upgrade 
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
  */
  checkGeneralSkillUpgrade(generalId: number, skillIndex: number): boolean

  /**
   * get general skill list 
   * @param generalId the id of the general 
   * @returns skill_id: number[],  skill_level : number[],  upgrade_need: number[] , value_type: number[], buff_value: number[], check_upgrade: boolean[]
  */
  getGeneralSkillList(generalId: number): {}

  /**
   * get skill info 
   * @param skillid the id of the skill 
  */
  getSkillInfo(skillId: number): BuffGdsRow | undefined

  /**
   * upgrade skill of general
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
  */
  upgradeGeneralSkill(generalId: number, skillIndex: number, callback: (result: any) => void): void


  /**
   * set defense general
   * @param generalId the id of the general
  */
  setDefenseGeneral(generalId: number, callback: (result: any) => void): void

  /**
   * get defenseGeneral
  */
  getDefenseGeneralId(): number

  /**
   * get battle info of the general
   * @param generalId the id of the general
  */
  getGeneralBattleInfo(generalId: number): {}

  /**
   * 
  */

  getBattleStatuses(name : string, callback: (result: any) => void ): Promise<void>

  /**
   * battle
   * @param name name of the player to battle
   * @param generalId id of the general
  */
  battle( generalId: number ,name: string , callback: (result: any) => void): void

  getBattleRecords( callback: (result: any) => void ): Promise<void>

  getDefenseBlockGenerals():[]

  getIconId(): number

  setIconId(iconId: number, callback: (result: any) => void): void
}


export class CityComponent implements ICityComponent {
  type: ComponentType;
  city: City;
  mediator: IStateMediator<StateTransition, ITransContext>
  cityStateId: IStateIdentity
  listener: IStatetWithTransContextCallback[]

  constructor(myStateId: string, mediator: IStateMediator<StateTransition, ITransContext>) {
    this.cityStateId = {
      id: myStateId
    }
    this.type = ComponentType.City
    this.mediator = mediator
    this.listener = []
  }

  setCity(city : City){
    this.city = city
    this.mediator.onReceiveState(
      this.cityStateId
      ,
      ()=>{
        this.city.updateBoost()
      }
    )
  }

  getUpgradeInfo(typ: CityFacility, targetLevel: number): FacilityGdsRow {
    return this.city.getUpgradeInfo(typ, targetLevel)
  }

  getAllUpgradeInfo(typ: CityFacility): FacilityGdsRow[] {
    return this.city.getAllUpgradeInfo(typ)
  }

  getFacilityOrder(): string[] {
    return this.city.getFacilityOrder()
  }

  updateResource(inter: number = 5000): void {
    setInterval(
      () => {
        for(let callbak of this.listener){
          callbak({} as any)
        }
      },
      inter
    )
  }

  getFacilityList(): { [key in CityFacility]?: number[] } {
    return copyObj(this.city.state.facilities)
  }
  getResource(): { } {
    let silverStatus = this.city.boost.getProductionStatus(ResouceType.Silver)
    let troopStatus = this.city.boost.getProductionStatus(ResouceType.Troop)
    let re = {
      [ResouceType.Silver]:
      {
          value: this.city.getResource(ResouceType.Silver),
          production: this.city.boost.getProduction(ResouceType.Silver),
          maintain: silverStatus.maintain,
          normal: silverStatus.normalProduction
      },
      [ResouceType.Troop]:
      {
          value: this.city.getResource(ResouceType.Troop),
          production: this.city.boost.getProduction(ResouceType.Troop),
          maintain: troopStatus.maintain,
          normal: troopStatus.normalProduction
      } 
    }
    re['maintainNeedTroop'] = this.city.getMaintainNeedTroop()
    re['protectSilver'] = this.city.getSaveSilverAmount()
    re['troopUseSilver'] = re[ResouceType.Troop].value * 3
    return re
  }
  getFacilityUpgradeRequirement(typ: CityFacility, targetLevel: number): FacilityGdsRow | undefined {
    return this.city.getUpgradeInfo(typ, targetLevel)
  }

  checkUpgradeFacility(typ: CityFacility, index: number): boolean {
    return this.city.checkUpgradeFacility(typ, index)
  }

  doUpgradeFacility(typ: CityFacility, index: number, callback: (res: ITransResult) => void) {
    this.mediator.sendTransaction(StateTransition.UpgradeFacility, {
      from: Throne.instance().username,
      typ: typ,
      index: index,
    }, callback)
  }
  doRecruit(amount: number, callback: (res: ITransResult) => void) {
    this.mediator.sendTransaction(StateTransition.Recruit, {
      from: Throne.instance().username,
      amount: amount
    }, callback)
  }

  getRecruitState(): {} {
    const time = parseInt(new Date().getTime() / 1000 + '');
    let re = {
      status: RecruitStatus.None,
      endtime: 0,
      amount: 0
    }
    if(this.city.state.recruit.length != 0){
      re.endtime = this.city.state.recruit[0].endtime
      re.amount = this.city.state.recruit[0].amount
      if(re.endtime >= time){
        re.status = RecruitStatus.Going
      }
      else{
        re.status = RecruitStatus.Ready
      }
    }
    return re
  }

  receiveTroop(callback: (result: any) => void): void {
    this.mediator.sendTransaction(StateTransition.ReceiveTroop, {
      from: Throne.instance().username
    }, callback)
  }

  onStateUpdate(callback: IStatetWithTransContextCallback): void {
    this.mediator.onReceiveState(
      this.cityStateId
      ,
      callback
    )
    this.listener.push(callback)
  }

  getRechargeConfigs(): [] {
    return this.city.getRechargeConfigs() as []
  }
}

export class GeneralComponent implements IGeneralComponent {
  type: ComponentType;
  general: General;
  mediator: IStateMediator<StateTransition, ITransContext>
  generalStateId: IStateIdentity
  constructor(myStateId: string, mediator: IStateMediator<StateTransition, ITransContext>) {
    this.generalStateId = {
      id: myStateId
    }
    this.type = ComponentType.General
    this.mediator = mediator
  }

  setGeneral(general : General){
    this.general = general
    this.mediator.onReceiveState(
      this.generalStateId
      ,
      ()=>{
        this.general.updateBoost()
      }
    )
  }

  getConstData(): {} {
    let re = {
      general_max_level: this.general.config.parameter.general_max_level,
      skill_max_level: this.general.config.parameter.general_skill_max_level
    }
    return re
  }
  getGeneralQualification(id: number) {
    return this.general.getGeneralQualification(id)
  }

  getAbleStatus(): {} {
    let re = {
      able_count: 0,
      max_able_count: 0
    }
    re.max_able_count = this.general.city.getGeneralMaxAble()
    re.able_count = this.general.getAbleCount()
    return re
  }
  getGeneralList(): {} {
    let re = {}
    for (let idstring in this.general.state.generalList) {
      const generalInfo = this.general.state.generalList[idstring]
      const id = parseInt(idstring)
      let temp = {
        id: id,
        qualification: {},
        level: 0,
        able: false,
        skilllevel: [1, 1, 1],
        stamina: 0
      }
      temp.qualification = JSON.parse(JSON.stringify(this.getGeneralQualification(id)))
      temp.level = generalInfo.level
      temp.able = generalInfo.able
      temp.skilllevel = generalInfo.skill_levels.concat()
      temp.stamina = this.general.getGeneralStamina(id)
      re[idstring] = temp
    }
    return re
  }

  ableGeneral(id: number, callback: (res: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.AbleGeneral, {
      from: Throne.instance().username,
      id: id
    }, callback)
  }

  disableGeneral(id: number, callback: (res: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.DisableGeneral, {
      from: Throne.instance().username,
      id: id
    }, callback)
  }

  upgradeGeneral(id: number, callback: (res: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.UpgradeGeneral, {
      from: Throne.instance().username,
      id: id
    }, callback)
  }

  onStateUpdate(callback: IStatetWithTransContextCallback): void {
    this.mediator.onReceiveState(
      this.generalStateId
      ,
      callback
    )
  }

  getSkillInfo(skillId: number): BuffGdsRow {
    return this.general.getSkillInfo(skillId)
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
    let re = {
      skill_id: [],
      skill_level: [],
      upgrade_need: [],
      value_type: [],
      value: [],
      check_upgrade: []
    }
    const generalInfo = this.general.getGeneralState(generalId)
    let qualification = JSON.parse(JSON.stringify(this.getGeneralQualification(generalId)))
    re.skill_id = qualification.general_skill.concat()
    re.skill_level = generalInfo.skill_levels.concat()
    let upgrade_need = new Array(re.skill_id.length).fill(0)
    let value_type = new Array(re.skill_id.length).fill(0)
    let value = new Array(re.skill_id.length).fill(0)
    let check_upgrade = new Array(re.skill_id.length).fill(false)
    for (let i = 0; i < re.skill_id.length; i++) {
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

  upgradeGeneralSkill(generalId: number, skillIndex: number, callback: (result: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.UpgradeGeneralSkill, {
      from: Throne.instance().username,
      generalId: generalId,
      skillIndex: skillIndex
    }, callback)
  }

  setDefenseGeneral(generalId: number, callback: (result: any) => void): void {
    this.mediator.sendTransaction(StateTransition.SetDefenseGeneral,{
      from: Throne.instance().username,
      generalId: generalId
    }, callback)
  }

  getDefenseGeneralId(): number {
    return this.general.state.defense_general
  }

  getGeneralBattleInfo(generalId: number): {} {
    return this.general.getGeneralBattleStatus(generalId)
  }

  async getAllBattleStatuses( callback: (result: any) => void ) {
    let re = await this.mediator.query( StateName.DefenderInfo, {'$orderBy': '-silver'})
    callback(re ?? [])
  }
  async getBattleStatuses( username: string, callback: (result: any) => void ) {
    let re = []
    if(username == ''){
      re = await this.mediator.query( StateName.DefenderInfo, {'$orderBy': '-silver'})
    }
    else{
      re = await this.mediator.query( StateName.DefenderInfo, {username : username})
    }
    callback(re ?? [])
  }

  battle(generalId: number,name: string, callback: (result: any) => void): void {
    this.mediator.sendTransaction(StateTransition.Battle,{
      from: Throne.instance().username,
      generalId: generalId,
      name: name
    }, callback)
  }

  async getBattleRecords( callback: (result: any) => void ) {
    let re = (await this.mediator.query(TransitionEventType.Battles,
      {
      "$or":[ {"attackInfo.username" : Throne.instance().username},{"defenseInfo.username" : Throne.instance().username} ]
      ,'$orderBy' : '-timestamp'
      })) as BattleTransRecord[]
    let trans = []
    for(let record of re ?? [] ){
      trans.push(this.general.transferTransRecord(record))
    }
    callback(trans)
  }

  getDefenseBlockGenerals(): [] {
    return copyObj(this.general.state.defenseBlockList) as []
  }

  getIconId(): number {
    return this.general.getIconId()
  }

  setIconId(iconId: number, callback: (result: any) => void){
    this.mediator.sendTransaction(StateTransition.SetIconId,{
      from: Throne.instance().username,
      iconId: iconId
    }, callback)
  }

}

export enum ComponentType {
  City = 1,
  General = 2,
  Map = 3
}

export interface IThrone {
  initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T) => void
  ): void;
}

export enum InstanceStatus{
  Null,
  Loading,
  Ready
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
  mediator: IStateMediator<StateTransition, ITransContext>
  inited: boolean
  instanceState: InstanceStatus
  components: { [key in ComponentType]?: IComponent } = {};
  logicEssential: LogicEssential
  username : string
  unionId: number
  wsUrl : string



  constructor() {
    this.inited = false
    this.instanceState = InstanceStatus.Null
  }


  async init( obj : {}, callback: (result: any) => void = ()=>{}) {
    if(this.instanceState == InstanceStatus.Null){
      this.instanceState = InstanceStatus.Loading
    }
    else if(this.instanceState  == InstanceStatus.Loading){
      return {
        result: false,
        error: "throne-have-not-finish-init"
      }
    }
    else{
      return{
        result: true
      }
    }
    const states: StateEssential = {} as StateEssential;
    const statesTest: StateEssential = {} as StateEssential;
    this.username = obj['username'] ? obj['username'] : 'test'
    this.unionId = obj['unionId'] ?  obj['unionId'] : 1
    this.wsUrl = obj["wsurl"] ? obj["wsurl"] : `ws://test.leagueofthrones.com/ws/${this.username}`
    if(this.wsUrl && this.username!='test'){
      const wsmediator = new WebSocketMediator(this.wsUrl)
      if(obj['wsCloseCallback']){
        wsmediator.setWsCloseCallbacl(obj['wsCloseCallback'])
      }
      await wsmediator.init()
      this.mediator = wsmediator
    }else{
      this.mediator = new LocalMediator([this.username, 'test1'])
      if(obj['unionId']){
        InitState[StateName.General].unionId = obj['unionId']
      }
    }
    let serverTimeStamp = ( await this.mediator.query(TransitionEventType.TimeStamp, {})) as number
    setTimeOffset(serverTimeStamp - getTimeStamp(0))
    // init essensial states
    states.city = (await this.mediator.queryState({ id: `${StateName.City}:${this.username}` }, {}, null)) as ICityState
    states.general = (await this.mediator.queryState({ id: `${StateName.General}:${this.username}` }, {}, null)) as IGeneralState
    states.mapGlobal = (await this.mediator.queryState({ id: `${StateName.MapGlobalInfo}` }, {}, null)) as IMapGlobalState
    states.seasonState = (await this.mediator.queryState({ id: `${StateName.SeasonConfig}` }, {}, null)) as ISeasonConfigState
    states.rewardGlobalState = (await this.mediator.queryState({ id: `${StateName.RewardGloablState}` }, {}, null)) as IRewardGlobalState
    states.blocks = []
    // await Promise.all([
    //   async () => {
    //     states.city = (await this.mediator.queryState({ id: `${StateName.City}:${TestWallet}` }, {}, null)) as ICityState
    //   },
    //   async () => {
    //     states.general = (await this.mediator.queryState({ id: `${StateName.General}:${TestWallet}` }, {}, null)) as IGeneralState
    //   },
    // ])
    this.logicEssential = createLogicEsential(states)
    this.inited = true
    this.instanceState = InstanceStatus.Ready
    this.mediator.sendTransaction(StateTransition.SetUnionId,{
      from: this.username,
      unionId: this.unionId
    }, callback)
  }



  async initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T ) => void
  ) {
    let initRe =  await this.init({})
    this.inited = true
    if(!initRe['result'])
    {
      throw initRe['error']
    }
    if (typ == ComponentType.City) {
      this.components[ComponentType.City] = new CityComponent(`${StateName.City}:${this.username}`, this.mediator)
      let cityCom = this.components[ComponentType.City] as CityComponent
      cityCom.setCity(this.logicEssential.city)
      callback(cityCom as any as T)
    } else if (typ == ComponentType.General) {
      this.components[ComponentType.General] = new GeneralComponent(`${StateName.General}:${this.username}`, this.mediator)
      let generalCom = this.components[ComponentType.General] as GeneralComponent
      generalCom.setGeneral(this.logicEssential.general)
      callback(generalCom as any as T)
    } else if(typ == ComponentType.Map){
      this.components[ComponentType.Map] = new MapComponent(this.mediator)
      let mapCom = this.components[ComponentType.Map] as MapComponent
      mapCom.setMap(this.logicEssential.map)
      callback(mapCom as any as T)
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
    ((general: IGeneralComponent) => {
      general.onStateUpdate((state) => {
        console.log("general", state)
      })


    }
    )
  )
  Throne.instance()[ComponentType.City].doUpgradeFacility()
}
