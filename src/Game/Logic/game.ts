import { ICityState } from "../State";
import { CityFacility } from "../Const";

export interface FacilityGdsRow {
  id: number;
  lvl: number;
  need_gold: number;
}

export class GdsTable<T> {
  items: T[];
}

export interface CityConfig {
  facilityConfig: GdsTable<FacilityGdsRow>;
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
    this.state.update( { [`facilities.${typ}`] : level + 1 });
  }

  showAll() {
    //facilities
    for (var key in this.state.facilities) {
      console.log('facilitie: ', key, ' ', this.state.facilities[key]);
    }
  }
}
