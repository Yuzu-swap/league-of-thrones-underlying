import { ICityState } from "../State";
import { CityFacility } from "../Const";
import { ConfigContainer } from "../../Core/config";
import { FacilityGdsRow,FacilityMarketGdsRow, FacilityProductionGdsRow, FacilityHumanGdsRow,FacilityPowerGdsRow,FacilityLogisticsGdsRow} from "../DataConfig"



export interface CityConfig {
  facilityConfig:  {
    [CityFacility.Market]:  ConfigContainer<FacilityMarketGdsRow>,
    [CityFacility.Production]:ConfigContainer<FacilityProductionGdsRow>,
    [CityFacility.Human]:ConfigContainer<FacilityHumanGdsRow>,
    [CityFacility.Logistics]:ConfigContainer<FacilityLogisticsGdsRow>,
    [CityFacility.Power]:ConfigContainer<FacilityPowerGdsRow>,
  }
}

export class City {
  state : ICityState
  //cache
  cityConfig: CityConfig;

  constructor(state: ICityState,cityconf: CityConfig) {
    this.state = state
    this.cityConfig = cityconf;
  }

  upgradeFacility(typ: CityFacility) {
    const level = this.state.facilities[typ] || 0;
    const row :FacilityGdsRow = this.cityConfig.facilityConfig[typ].get(level.toString())
    console.log("upgradeFacility ",typ, " level ", level, " need gold ", row.need_gold)
    this.state.update( { [`facilities.${typ}`] : level + 1 });
  }

  showAll() {
    //facilities
    for (var key in this.state.facilities) {
      console.log('facilitie: ', key, ' ', this.state.facilities[key]);
    }
  }
}
