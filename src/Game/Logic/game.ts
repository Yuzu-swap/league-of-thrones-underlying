import { ICityState } from "../State";
import { CityFacility } from "../Const";
import { ConfigContainer , FacilityLimit} from "../../Core/config";
import { FacilityGdsRow, FacilityFortressGdsRow, FacilityMilitaryCenterGdsRow, FacilityWallGdsRow,  FacilityStoreGdsRow, FacilityInfantryCampGdsRow, FacilityCavalryCampGdsRow, FacilityArcherCampGdsRow, FacilityTrainingCenterGdsRow, FacilityHomeGdsRow } from "../DataConfig"



export interface CityConfig {
  facilityConfig: {
    [CityFacility.Fortress]: ConfigContainer<FacilityFortressGdsRow>,
    [CityFacility.MilitaryCenter]: ConfigContainer<FacilityMilitaryCenterGdsRow>,
    [CityFacility.Wall]: ConfigContainer<FacilityWallGdsRow>,
    [CityFacility.Store]: ConfigContainer<FacilityStoreGdsRow>,
    [CityFacility.InfantryCamp]: ConfigContainer<FacilityInfantryCampGdsRow>,
    [CityFacility.CavalryCamp]: ConfigContainer<FacilityCavalryCampGdsRow>,
    [CityFacility.ArcherCamp]: ConfigContainer<FacilityArcherCampGdsRow>,
    [CityFacility.TrainingCenter]: ConfigContainer<FacilityTrainingCenterGdsRow>,
    [CityFacility.Home]: ConfigContainer<FacilityHomeGdsRow>
  },
  limit:{
    [CityFacility.Fortress]: FacilityLimit,
    [CityFacility.MilitaryCenter]: FacilityLimit,
    [CityFacility.Wall]: FacilityLimit,
    [CityFacility.Store]: FacilityLimit,
    [CityFacility.InfantryCamp]: FacilityLimit,
    [CityFacility.CavalryCamp]: FacilityLimit,
    [CityFacility.ArcherCamp]: FacilityLimit,
    [CityFacility.TrainingCenter]: FacilityLimit,
    [CityFacility.Home]: FacilityLimit
  }
}

export class City {
  state: ICityState
  //cache
  cityConfig: CityConfig;

  constructor(state: ICityState, cityconf: CityConfig) {
    this.state = state
    this.cityConfig = cityconf;
  }

  loadState(state: {}) {
    console.log("load ", state)
    this.state.update(state)
  }

  upgradeFacility(typ: CityFacility, index: number = 0) {
    let levelList = this.state.facilities[typ] || [];
    const maxCount = this.cityConfig.limit[typ].max_count;
    if(index >= maxCount -1){
      return
    }
    let tartgetLevel = 1
    if(index >= levelList.length){
      levelList.push[1]
    }else{
      tartgetLevel = levelList[index] + 1
      levelList[index] = tartgetLevel
    }
    const row: FacilityGdsRow = this.cityConfig.facilityConfig[typ].get(tartgetLevel.toString())
    console.log("upgradeFacility ", typ, " level ", tartgetLevel, "need troop", row.need_troop)
    this.state.update({ [`facilities.${typ}`]: levelList });
  }

  showAll() {
    //facilities
    console.log("@@@Dump all facilities")
    for (var key in this.state.facilities) {
      console.log('facilitie: ', key, ' ', this.state.facilities[key]);
    }
    console.log("@@@Dump all facilities end\n")
  }
}
