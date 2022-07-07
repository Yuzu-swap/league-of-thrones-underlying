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

export class FacilityLimit {
  max_count: number;
  building_name: string;

  constructor(obj: {}) {
    this.max_count = obj['max_count'] ? obj['max_count'] : 1;
    this.building_name = obj['building_name'] ? obj['building_name'] : 'error';
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
  state: ICityState;
  //cache
  cityConfig: CityConfig;

  constructor(state: ICityState, cityconf: CityConfig) {
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
    const info = this.state.resources[typ]
    const hour = (time - info.lastUpdate)/ 3600
    const value = hour * info.production + info.value
    this.state.update({
      [`resources.${typ}`]: {
          lastUpdate: time,
          value: value,
          production: info.production
        }
      })
    return value
  }

  getUpgradeInfo(typ: CityFacility, targetLevel: number ) :FacilityGdsRow{
    const row: FacilityGdsRow = this.cityConfig.facilityConfig[typ].get(
      (targetLevel -1).toString()
    );
    return row
  }

  checkUpgradeFacility(typ: CityFacility, index: number = 0) : boolean{
    let levelList = this.state.facilities[typ] || [];
    const maxCount = this.cityConfig.limit[typ].max_count;
    if (index >= maxCount) {
      return false
    }
    let tartgetLevel = 1;
    if (index < levelList.length) {
      tartgetLevel = levelList[index] + 1;
    }
    const row: FacilityGdsRow = this.cityConfig.facilityConfig[typ].get(
      (tartgetLevel -1).toString()
    );
    if(this.getResource(ResouceType.Silver)>= row.need_silver && this.getResource(ResouceType.Troop)>= row.need_troop){
      return true
    }
    return false
  }

  upgradeFacility(typ: CityFacility, index: number = 0) {
    if(!this.checkUpgradeFacility(typ, index)){
      return
    }
    let levelList = this.state.facilities[typ] || [];
    const maxCount = this.cityConfig.limit[typ].max_count;
    if (index >= maxCount) {
      return;
    }
    let tartgetLevel = 1;
    if (index >= levelList.length) {
      levelList.push[1];
    } else {
      tartgetLevel = levelList[index] + 1;
      levelList[index] = tartgetLevel;
    }
    const row: FacilityGdsRow = this.cityConfig.facilityConfig[typ].get(
      (tartgetLevel -1).toString()
    );
    const info : ResouceInfo = this.state.resources[typ]
    
    console.log(
      'upgradeFacility ',
      typ,
      ' level ',
      tartgetLevel,
      'need troop',
      row.need_troop
    );
    this.state.update({ 
      [`facilities.${typ}`]: levelList,
      [`resources.${ResouceType.Silver}`]: {
        lastUpdate: info.lastUpdate,
        value: info.value - row.need_silver,
        production: info.production
      },
      [`resources.${ResouceType.Troop}`]: {
        lastUpdate: info.lastUpdate,
        value: info.value - row.need_troop,
        production: info.production
      }
    });
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
