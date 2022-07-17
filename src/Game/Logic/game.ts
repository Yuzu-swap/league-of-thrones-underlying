import { ICityState , ResouceInfo} from '../State';
import { CityFacility, ResouceType } from '../Const';
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
  FacilityHomeGdsRow
} from '../DataConfig';
import { TransitionId, TransitionCall, TransitionHandler, TransitionResponseArgs } from '../..';

export class FacilityLimit {
  max_count: number;
  building_name: string;
  order: number

  constructor(obj: {}) {
    this.max_count = obj['max_count'] ? obj['max_count'] : 1;
    this.building_name = obj['building_name'] ? obj['building_name'] : 'error';
    this.order = obj['order']? obj['order']: 1
  }
}

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

export class City {
  readonly state: ICityState;
  //cache
  cityConfig: CityConfig;


  constructor(state: ICityState, cityconf: CityConfig ) {
    this.state = state;
    this.cityConfig = cityconf;
  }

  loadState(state: {}) {
    this.state.update(state);
  }

  getResource(typ : ResouceType): number{
    const time = parseInt(new Date().getTime()/1000 + "")
    if(!this.state.resources[typ]){
      return 0
    }
    let value = 0
    const info = this.state.resources[typ]
    value = info.value
    if(info.lastUpdate != -1){
      const hour = (time - info.lastUpdate)/ 3600
      value = hour * info.production + info.value
    }
    let obj ={
      lastUpdate: time,
      value: value,
      production: this.calculatePoduction(typ)
    }
    this.state.update({
      [`resources.${typ}`]: obj
      })
    return value
  }

  getUpgradeInfo(typ: CityFacility, targetLevel: number ) :FacilityGdsRow | undefined{
    const row = this.cityConfig.facilityConfig[typ].get(
      (targetLevel - 2).toString()
    );
    return row
  }

  getAllUpgradeInfo(type : CityFacility):FacilityGdsRow[]{
    let re: FacilityGdsRow[] = []
    let i = 1
    while(true){
      const row = this.cityConfig.facilityConfig[type].get(
        (i - 1).toString()
      );
      if(row){
        re.push(row)
      }else{
        break
      }
      i++
    }
    return re
  }

  checkUpgradeFacility(typ: CityFacility, index: number = 0) : boolean{
    let levelList = this.state.facilities[typ] ?? [];
    const maxCount = this.cityConfig.limit[typ].max_count;
    if (index >= maxCount) {
      return false
    }
    let tartgetLevel = 1;
    if (index < levelList.length) {
      tartgetLevel = levelList[index] + 1;
    }
    const row = this.getUpgradeInfo(typ, tartgetLevel)
    if(row == undefined){
      return false
    }
    if(this.getResource(ResouceType.Silver)>= row.need_silver /* && this.getResource(ResouceType.Troop)>= row.need_troop*/){
      return true
    }
    return false
  }

  calculatePoduction(typ: ResouceType): number{
    let re = 0;
    switch(typ)
    {
      case ResouceType.Silver :
        if(this.state.facilities[CityFacility.Home]){
          const list = this.state.facilities[CityFacility.Home]
          for(let i = 0; i< list.length; i ++){
            const level = list[i]
            const production = this.cityConfig.facilityConfig[CityFacility.Home].get(level - 1 + '').product_silver
            re += production
          }
        }
      break;
    }
    return re
  }

  upgradeFacility(typ: CityFacility, index: number = 0, args: TransitionCall) {
    if(!this.checkUpgradeFacility(typ, index)){
      let re: TransitionResponseArgs = {
        transitionId : args.transitionId,
        context: null,
        result: false
      }
      args.handler.notifyTransitonResponse(this.state, re)
      return
    }
    let levelList = this.state.facilities[typ]?.concat() ?? []
    const maxCount = this.cityConfig.limit[typ].max_count;
    if (index >= maxCount) {
      return;
    }

    let tartgetLevel = 1;
    if (index == levelList.length) {
      levelList.push(1);
    } else {
      tartgetLevel = levelList[index] + 1;
      levelList[index] = tartgetLevel;
    }
    const row: FacilityGdsRow = this.cityConfig.facilityConfig[typ].get(
      (tartgetLevel -2).toString()
    );
    const info : ResouceInfo = this.state.resources[ResouceType.Silver]
    let sliver = {
      lastUpdate: info.lastUpdate,
      value: info.value - row.need_silver,
      production: info.production
    }
    this.state.update({ 
      [`facilities.${typ}`]: levelList,
      [`resources.${ResouceType.Silver}`]: sliver,
      /*[`resources.${ResouceType.Troop}`]: {
        lastUpdate: info.lastUpdate,
        value: info.value - row.need_troop,
        production: info.production
      }*/
    });
    let re: TransitionResponseArgs = {
      transitionId : args.transitionId,
      context: null,
      result: true
    }
    args.handler.notifyTransitonResponse(this.state, re)
  }

  getFacilityOrder():string[]{
    let re: string[] = new Array(Object.keys(this.cityConfig.limit).length).fill('')
    for( let key in this.cityConfig.limit){
      let index = this.cityConfig.limit[key].order -1
      re[index] = key
    }
    return re
  }

  getGeneralMaxAble():number{
    let fortresslevel = this.state.facilities.fortress[0]
    return this.cityConfig.facilityConfig[CityFacility.Fortress].get((fortresslevel-1).toString()).employ_count
  }

  useSilver(amount: number): boolean{
    const info : ResouceInfo = this.state.resources[ResouceType.Silver]
    if(amount < this.state.resources.silver.value){
      this.state.update(
        {
          [`resources.${ResouceType.Silver}.value`]: info.value - amount
        }
      )
      return true
    }
    return false
  }

  showAll() {
    //facilities
    console.log('@@@Dump all facilities');
    for (var key in this.state.facilities) {
      console.log('facilitie: ', key, ' ', this.state.facilities[key]);
    }

    console.log('allTroops ', this.state.resources[ResouceType.Troop]?? 0);
    console.log('allSilver ', this.state.resources[ResouceType.Silver]?? 0);

    console.log('@@@Dump all facilities end\n');
  }
}
