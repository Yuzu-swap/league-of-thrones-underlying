import { GuideStep, ICityState, ResouceInfo } from '../State';
import { CityFacility, ResouceType, StateName } from '../Const';
import { ConfigContainer } from '../../Core/config';
import {
  FacilityGdsRow,
  FacilityFortressGdsRow,
  FacilityMilitaryCenterGdsRow,
  FacilityWallGdsRow,
  FacilityStoreGdsRow,
  FacilityInfantryCampGdsRow,
  FacilityCavalryCampGdsRow,
  FacilityArcherCampGdsRow,
  FacilityTrainingCenterGdsRow,
  FacilityHomeGdsRow,
  CityConfigFromGDS,
  FacilityLimit,
  RechargeConfigs,
  RechargeConfigFromGDS,
  RechargeConfig
} from '../DataConfig';
import { IBoost } from './boost';
import { getTimeStamp } from '../Utils';
import { copyObj } from '../../Core/state';
import { StrategyType } from './strategy';
import { NumericLiteral } from 'typescript';
import { Decimal } from 'decimal.js'


export interface CityConfig {
  facilityConfig: {
    [CityFacility.Fortress]: ConfigContainer<FacilityFortressGdsRow>;
    [CityFacility.MilitaryCenter]: ConfigContainer<FacilityMilitaryCenterGdsRow>;
    [CityFacility.Wall]: ConfigContainer<FacilityWallGdsRow>;
    [CityFacility.Store]: ConfigContainer<FacilityStoreGdsRow>;
    [CityFacility.InfantryCamp]: ConfigContainer<FacilityInfantryCampGdsRow>;
    [CityFacility.CavalryCamp]: ConfigContainer<FacilityCavalryCampGdsRow>;
    [CityFacility.ArcherCamp]: ConfigContainer<FacilityArcherCampGdsRow>;
    [CityFacility.TrainingCenter]: ConfigContainer<FacilityTrainingCenterGdsRow>;
    [CityFacility.Home]: ConfigContainer<FacilityHomeGdsRow>;
  };
  limit: {
    [CityFacility.Fortress]: FacilityLimit;
    [CityFacility.MilitaryCenter]: FacilityLimit;
    [CityFacility.Wall]: FacilityLimit;
    [CityFacility.Store]: FacilityLimit;
    [CityFacility.InfantryCamp]: FacilityLimit;
    [CityFacility.CavalryCamp]: FacilityLimit;
    [CityFacility.ArcherCamp]: FacilityLimit;
    [CityFacility.TrainingCenter]: FacilityLimit;
    [CityFacility.Home]: FacilityLimit;
  };
}

export enum RecruitStatus{
  None = 'none',
  Going = 'going',
  Ready = 'ready'
}

export class City {
  readonly state: ICityState;
  //cache
  cityConfig: CityConfig;
  rechargeConfig: RechargeConfigs 
  boost: IBoost;

  constructor(state: ICityState) {
    this.state = state;
    this.cityConfig = CityConfigFromGDS;
    this.rechargeConfig = RechargeConfigFromGDS;
  }

  loadState(state: {}) {
    this.state.update(state);
  }

  setBoost( boost : IBoost){
    this.boost = boost
  }

  getResource(typ: ResouceType): Decimal{
    const time = getTimeStamp()
    if(typ == ResouceType.Silver){
      if (!this.state.resources[typ]) {
        return new Decimal(0);
      }
      let value = new Decimal(0);
      const info = this.state.resources[typ];
      value = info.decTypeValue;
      if (info.lastUpdate != -1) {
        const hour = new Decimal(time - info.lastUpdate).div(3600);
        value = hour.mul(this.boost.getProduction(typ)).add(info.decTypeValue).minus(hour.mul(this.state.resources[ResouceType.Troop].decTypeValue).mul(3)) ;
      }
      return value < new Decimal(0) ? new Decimal(0) : value;
    }
    else{
      return this.state.resources[ResouceType.Troop].decTypeValue
    }
  }

  updateResource(typ: ResouceType): void {
    const time = getTimeStamp()
    if(typ == ResouceType.Silver){
      this.state.update({
        [`resources.${typ}`]: {
          lastUpdate: time,
          decTypeValue: this.getResource(typ),
        }
      });
    }
    else{
      let recruit = this.state.recruit
      let troop = this.state.resources[ResouceType.Troop]
      let troopAdd = new Decimal(0)
      let productReduce = new Decimal(0)
      let reduceCount = 0
      for(let i = 0; i< recruit.length; i++){
        if(recruit[i].endtime <= time){
          troopAdd = troopAdd.add(recruit[i].decTypeAmount)
          recruit.splice(i - reduceCount, 1)
          reduceCount++
        }
      }
      productReduce = troopAdd.mul(3)
      const nowValue = this.getResource(ResouceType.Silver)
      if(reduceCount != 0){
        this.state.update(
          {
            'recruit': recruit ,
            [`resources.${ResouceType.Silver}`]: {
              lastUpdate: time,
              decTypeValue: nowValue,
            },
            [`resources.${ResouceType.Troop}`]:{
              lastUpdate: time,
              decTypeValue: troop.decTypeValue.add(troopAdd),
            }
          }
        )
      }
    }
  }

  getUpgradeInfo(
    typ: CityFacility,
    targetLevel: number
  ): FacilityGdsRow | undefined {
    const row = this.cityConfig.facilityConfig[typ].get(
      (targetLevel - 2).toString()
    );
    return row;
  }

  getAllUpgradeInfo(type: CityFacility): FacilityGdsRow[] {
    let re: FacilityGdsRow[] = [];
    let i = 1;
    while (true) {
      const row = this.cityConfig.facilityConfig[type].get((i - 1).toString());
      if (row) {
        re.push(row);
      } else {
        break;
      }
      i++;
    }
    return re;
  }

  checkUpgradeFacility(typ: CityFacility, index: number = 0): boolean {
    let levelList = this.state.facilities[typ] ?? [];
    const maxCount = this.cityConfig.limit[typ].max_count;
    if (index >= maxCount) {
      return false;
    }
    let tartgetLevel = 1;
    if (index < levelList.length) {
      tartgetLevel = levelList[index] + 1;
    }
    const row = this.getUpgradeInfo(typ, tartgetLevel);
    const nextRow = this.getUpgradeInfo(typ, tartgetLevel + 1);
    if (row == undefined || nextRow == undefined) {
      return false;
    }
    if (
      this.getResource(ResouceType.Silver) >= new Decimal(row.need_silver)  && this.getResource(ResouceType.Troop)>=  new Decimal(row.need_troop)
    ) {
      return true;
    }
    return false;
  }

  calculatePoduction(typ: ResouceType): Decimal {
    let re = new Decimal(0);
    switch (typ) {
      case ResouceType.Silver:
        if (this.state.facilities[CityFacility.Home]) {
          const list = this.state.facilities[CityFacility.Home];
          for (let i = 0; i < list.length; i++) {
            const level = list[i];
            const production = this.cityConfig.facilityConfig[
              CityFacility.Home
            ].get(level - 1 + '').product_silver;
            re = re.add(production);
          }
        }
        re = re.minus(this.state.resources[ResouceType.Troop].decTypeValue)
        break;
      case ResouceType.Troop:
        if (this.state.facilities[CityFacility.TrainingCenter]) {
          const list = this.state.facilities[CityFacility.TrainingCenter];
          for (let i = 0; i < list.length; i++) {
            const level = list[i];
            const production = this.cityConfig.facilityConfig[
              CityFacility.TrainingCenter
            ].get(level - 1 + '').get_troop;
            re = re.add(production);
          }
        }
        break;
    }
    return re;
  }

  upgradeFacility(typ: CityFacility, index: number = 0) {
    this.updateResource(ResouceType.Silver)
    if (!this.checkUpgradeFacility(typ, index)) {
      return {result:false,"error":"checkUpgradeFacility-error"};
    }
    let levelList = this.state.facilities[typ]?.concat() ?? [];
    const maxCount = this.cityConfig.limit[typ].max_count;
    if (index >= maxCount) {
      return {result:false,"error":"index-over-max"};
    }

    let tartgetLevel = 1;
    if (index == levelList.length) {
      levelList.push(1);
    } else {
      tartgetLevel = levelList[index] + 1;
      levelList[index] = tartgetLevel;
    }
    const row: FacilityGdsRow = this.cityConfig.facilityConfig[typ].get(
      (tartgetLevel - 2).toString()
    );
    const info: ResouceInfo = this.state.resources[ResouceType.Silver];
    let silver = {
      lastUpdate: info.lastUpdate,
      decTypeValue: info.decTypeValue.minus(row.need_silver)
    };
    this.state.update({
      [`facilities.${typ}`]: levelList,
      [`resources.${ResouceType.Silver}`]: silver
    });
    this.useTroop(new Decimal(row.need_troop))
    return {result:true}
  }

  getFacilityOrder(): string[] {
    let re: string[] = new Array(
      Object.keys(this.cityConfig.limit).length
    ).fill('');
    for (let key in this.cityConfig.limit) {
      let index = this.cityConfig.limit[key].order - 1;
      re[index] = key;
    }
    return re;
  }

  getGeneralMaxAble(): number {
    let fortresslevel = this.state.facilities.fortress[0];
    return this.cityConfig.facilityConfig[CityFacility.Fortress].get(
      (fortresslevel - 1).toString()
    ).employ_count;
  }

  useSilver(amount: Decimal): boolean {
    const info: ResouceInfo = this.state.resources[ResouceType.Silver];
    if (amount <= this.getResource(ResouceType.Silver)) {
      this.state.update({
        [`resources.${ResouceType.Silver}.decTypeValue`]: info.decTypeValue.minus(amount)
      });
      return true;
    }
    return false;
  }
  useTroop(amount: Decimal): boolean{
    const info: ResouceInfo = this.state.resources[ResouceType.Troop];
    if( amount <= info.decTypeValue){
      this.state.update(
        {
          [`resources.${ResouceType.Troop}.decTypeValue`]: info.decTypeValue .minus(amount)
        }
      )
      this.updateResource(ResouceType.Silver)
      return true
    }
    return false
  }

  updateBoost(){
    this.boost.setTroop(this.getResource(ResouceType.Troop), this.getMaintainNeedTroop())
    this.boost.setProduction(StateName.City, ResouceType.Silver, this.calculatePoduction(ResouceType.Silver))
    this.boost.setProduction(StateName.City, ResouceType.Troop, this.calculatePoduction(ResouceType.Troop))
  }

  getRecruitNeed(amount: Decimal){
    return amount.mul(100)
  }

  recruit( amount: Decimal ){
    const cost = this.getRecruitNeed(amount)
    if( cost > this.getResource(ResouceType.Silver)){
      return {result: false, error: 'silver-not-enough'}
    }
    let recruit = this.state.recruit
    const product = this.boost.getProduction(ResouceType.Troop)
    const time = getTimeStamp();
    const endtime = Math.floor(amount.div(product).mul(3600).toNumber()) + time
    if(!this.useSilver(cost)){
      return {result: false, error: 'silver-not-enough'}
    }
    recruit.push(
      {
        decTypeAmount: amount,
        endtime: endtime
      }
    )
    this.state.update(
      {
        'recruit': recruit
      }
    )
    return {result: true, endtime: endtime}
  }

  //1= infantry ；2=cavalry ；3=archer
  getBattleStatus(general_type: number){
    let re = {
      attack: 0,
      defense: 0
    }
    switch(general_type){
      case 1:
        const level1 = this.state.facilities[CityFacility.InfantryCamp][0]
        const row1 : FacilityInfantryCampGdsRow = this.cityConfig.facilityConfig[CityFacility.InfantryCamp].get((level1 - 1).toString())
        re.attack = row1.infantry_attack
        re.defense = row1.infantry_defense
        break
      case 2: 
        const level2 = this.state.facilities[CityFacility.CavalryCamp][0]
        const row2 : FacilityCavalryCampGdsRow = this.cityConfig.facilityConfig[CityFacility.CavalryCamp].get((level2 - 1).toString())
        re.attack = row2.cavalry_attack
        re.defense = row2.cavalry_defense
        break
      case 3:
        const level3 = this.state.facilities[CityFacility.ArcherCamp][0]
        const row3 : FacilityArcherCampGdsRow = this.cityConfig.facilityConfig[CityFacility.ArcherCamp].get((level3 - 1).toString())
        re.attack = row3.archer_attack
        re.defense = row3.archer_defense
        break
    }
    return re
  }

  getSaveSilverAmount(): number{
    let saveAmount  = 0;
    for(let i = 0 ; i < this.state.facilities[CityFacility.Store].length; i++){
      let level = this.state.facilities[CityFacility.Store][i]
      saveAmount += this.cityConfig.facilityConfig[CityFacility.Store].get((level -1).toString()).silver_save
    }
    return saveAmount
  }

  robSilver(amount : Decimal): Decimal{
    let re = new Decimal(0)
    let saveAmount  = this.getSaveSilverAmount();
    let ifStore = this.boost.getStrategyStatus(StrategyType.Store)
    if(ifStore){
      saveAmount = saveAmount * 2
    }
    if(this.useSilver( Decimal.min(amount, this.getResource(ResouceType.Silver).minus(saveAmount)))){
      re = Decimal.min(amount, this.getResource(ResouceType.Silver).minus(saveAmount))
    }
    return re
  }

  getMaxDefenseTroop(){
    const wallLevel = this.state.facilities[CityFacility.Wall][0]
    const row = this.cityConfig.facilityConfig[CityFacility.Wall].get((wallLevel -1).toString())
    return row.scale_of_troop_defense
  }
  getMaxAttackTroop(){
    const wallLevel = this.state.facilities[CityFacility.MilitaryCenter][0]
    const row = this.cityConfig.facilityConfig[CityFacility.MilitaryCenter].get((wallLevel -1).toString())
    return row.scale_of_troop_attack
  }

  getMaintainNeedTroop(): Decimal{
    let troop = new Decimal(0)
    for(let key of Object.getOwnPropertyNames(CityFacility))
    {
      let type: CityFacility = CityFacility[key];
      const levelList = this.state.facilities[type]
      for(let level of levelList){
        const row = this.cityConfig.facilityConfig[type].get((level -1).toString())
        troop= troop.add(row.maintain_need_troop)
      }
    } 
    return troop
  }

  getRechargeConfigs(){
    return copyObj(this.rechargeConfig.config)
  }

  recharge(rechargeId: number ,amount: Decimal){
    let tempConfig = undefined
    tempConfig = this.rechargeConfig.get(rechargeId) as RechargeConfig
    if(
      !tempConfig
      ||(tempConfig as RechargeConfig).internal_id != rechargeId
      || new Decimal((tempConfig as RechargeConfig).price) != amount
    ){
      return {
        result: false,
        error: 'recharge-config-error'
      }
    }
    let nowGlod = this.state.decTypeGold
    this.state.update(
      {
        decTypeGold: nowGlod.add((tempConfig as RechargeConfig).gold + (tempConfig as RechargeConfig).extra_gold)
      }
    )
    return{
      result: true
    }
  }

  useGold(amount: Decimal){
    if(amount <= this.state.decTypeGold){
      this.state.update(
        {
          decTypeGold : this.state.decTypeGold.minus(amount)
        }
      )
      return true
    }
    return false
  }

  addTestResource(){
    const coolDown = this.getTestResourceCoolDownTime()
    if(coolDown != 0 ){
      return{
        result: false,
        error: 'cool-down-have-not-end'
      }
    }
    const time = getTimeStamp()
    this.useSilver( new Decimal(-1000000))
    this.useTroop( new Decimal(-1000))
    this.state.update(
      {
        lastAddTestTime : time
      }
    )
    return{
      result: true
    }
  }

  getTestResourceCoolDownTime(){
    const time = getTimeStamp()
    const maxCoolDown = 24 * 3600 ;
    if(time - this.state.lastAddTestTime >= maxCoolDown){
      return 0
    }
    else{
      return maxCoolDown - ( time - this.state.lastAddTestTime)
    }
  }

  getActivityData(activityId: number) : Decimal {
    for(let item of this.state.userActivity){
      if(item.id == activityId){
        return item.decTypeValue
      }
    }
    return new Decimal(-1)
  }

  setActivityData(activityId: number, value: Decimal){
    let haveSet = false
    let list = this.state.userActivity
    for(let i in list){
      if(list[i].id == activityId){
        list[i].decTypeValue = value
        haveSet = true
        break
      }
    }
    if(!haveSet){
      list.push(
        {
          id: activityId,
          decTypeValue: value
        }
      )
    }
    this.state.update(
      {
        userActivity : list
      }
    )
  }

  showAll() {
    //facilities
    console.log('@@@Dump all facilities');
    for (var key in this.state.facilities) {
      console.log('facilitie: ', key, ' ', this.state.facilities[key]);
    }

    console.log('allTroops ', this.state.resources[ResouceType.Troop] ?? 0);
    console.log('allSilver ', this.state.resources[ResouceType.Silver] ?? 0);

    console.log('@@@Dump all facilities end\n');
  }

  getGuideStep( type: string){
    let list = this.state.guideStep
    for( let i in list ){
      if(list[i].type == type){
        return list[i].step
      }
    }
    return 0
  }

  setGuideStep( type: string, step : number ){
    let list = this.state.guideStep
    let haveSet = false
    for( let i in list ){
      if(list[i].type == type){
        list[i].step = step
        haveSet = true
        break
      }
    }
    if(!haveSet){
      let item : GuideStep = {
        type: type,
        step: step
      }
      list.push(item)
    }
    this.state.update(
      {
        guideStep : list
      }
    )
    return {
      result: true
    }
  }

}
