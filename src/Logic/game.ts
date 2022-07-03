export const GameName = 'league of thrones';

export enum CityFacility {
  Center = 0,
  Wirehouse = 1,
  Market = 2,
  Production = 3,
  Logistics = 4,
  Store = 5
}

export enum ResouceType {
  Gold = 0,
  Silver = 1,
  Wookd = 2,
  Stone = 3
}

export class Resource {
  lastUpdate: number;
  value: number;
  production: number;
}

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
  facilities: { [key in CityFacility]: number };
  resources: { [key in ResouceType]: Resource };
  troops: number;

  //cache
  cityConfig: CityConfig;

  constructor(cityconf: CityConfig) {
    this.cityConfig = cityconf;
    this.facilities = {} as { [key in CityFacility]: number };
  }

  upgradeFacility(typ: CityFacility) {
    this.facilities[typ] = this.facilities[typ] || 0;
    this.facilities[typ] += 1;
  }

  showAll() {
    //facilities
    for (var key in this.facilities) {
      console.log('facilitie: ', key, ' ', this.facilities[key]);
    }
  }
}
