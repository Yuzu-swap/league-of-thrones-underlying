import { ICityState, ResouceInfo } from '../State';
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
  CityConfigFromGDS
} from '../DataConfig';
import { IBoost } from './boost';
export class FacilityLimit {
  max_count: number;
  building_name: string;
  order: number;

  constructor(obj: {}) {
    this.max_count = obj['max_count'] ? obj['max_count'] : 1;
    this.building_name = obj['building_name'] ? obj['building_name'] : 'error';
    this.order = obj['order'] ? obj['order'] : 1;
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
  boost: IBoost;

  constructor(state: ICityState) {
    this.state = state;
    this.cityConfig = CityConfigFromGDS;
  }

  loadState(state: {}) {
    this.state.update(state);
  }

  setBoost( boost : IBoost){
    this.boost = boost
  }

  getResource(typ: ResouceType): number {
    const time = parseInt(new Date().getTime() / 1000 + '');
    if(typ == ResouceType.Silver){
      if (!this.state.resources[typ]) {
        return 0;
      }
      let value = 0;
      const info = this.state.resources[typ];
      value = info.value;
      if (info.lastUpdate != -1) {
        const hour = (time - info.lastUpdate) / 3600;
        value = hour * info.production + info.value;
      }
      let obj = {
        lastUpdate: time,
        value: value,
        production: this.boost.getProduction(typ)
      };
      this.state.update({
        [`resources.${typ}`]: obj
      });
      return value;
    }
    else{
      let recruit = this.state.recruit
      for(let i in recruit){
        if(recruit[i].endtime <= time){
          
        }
      }
      return 0
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
    if (row == undefined) {
      return false;
    }
    if (
      this.getResource(ResouceType.Silver) >=
      row.need_silver /* && this.getResource(ResouceType.Troop)>= row.need_troop*/
    ) {
      return true;
    }
    return false;
  }

  calculatePoduction(typ: ResouceType): number {
    let re = 0;
    switch (typ) {
      case ResouceType.Silver:
        if (this.state.facilities[CityFacility.Home]) {
          const list = this.state.facilities[CityFacility.Home];
          for (let i = 0; i < list.length; i++) {
            const level = list[i];
            const production = this.cityConfig.facilityConfig[
              CityFacility.Home
            ].get(level - 1 + '').product_silver;
            re += production;
          }
        }
        break;
      case ResouceType.Troop:
        if (this.state.facilities[CityFacility.TrainingCenter]) {
          const list = this.state.facilities[CityFacility.TrainingCenter];
          for (let i = 0; i < list.length; i++) {
            const level = list[i];
            const production = this.cityConfig.facilityConfig[
              CityFacility.TrainingCenter
            ].get(level - 1 + '').get_troop;
            re += production;
          }
        }
        break;
    }
    return re;
  }

  upgradeFacility(typ: CityFacility, index: number = 0) {
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
      value: info.value - row.need_silver,
      production: info.production
    };
    this.state.update({
      [`facilities.${typ}`]: levelList,
      [`resources.${ResouceType.Silver}`]: silver
      /*[`resources.${ResouceType.Troop}`]: {
        lastUpdate: info.lastUpdate,
        value: info.value - row.need_troop,
        production: info.production
      }*/
    });
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

  useSilver(amount: number): boolean {
    const info: ResouceInfo = this.state.resources[ResouceType.Silver];
    if (amount < this.state.resources.silver.value) {
      this.state.update({
        [`resources.${ResouceType.Silver}.value`]: info.value - amount
      });
      return true;
    }
    return false;
  }

  updateBoost(){
    this.boost.setProduction(StateName.City, ResouceType.Silver, this.calculatePoduction(ResouceType.Silver))
    this.boost.setProduction(StateName.City, ResouceType.Troop, this.calculatePoduction(ResouceType.Troop))
  }

  recruit( amount: number ){
    const cost = 100 * amount
    if( amount > this.getResource(ResouceType.Silver)){
      return false
    }
    let recruit = this.state.recruit
    const product = this.calculatePoduction(ResouceType.Troop)
    const time = parseInt(new Date().getTime() / 1000 + '');
    const endtime = Math.floor(amount/product * 3600) + time
    this.useSilver(cost)
    recruit.push(
      {
        amount: amount,
        endtime: endtime
      }
    )
    this.state.update(
      {
        'recruit': recruit
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
}
