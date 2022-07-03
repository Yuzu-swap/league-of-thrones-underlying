import {
  GameName,
  City,
  CityFacility,
  FacilityGdsRow,
  GdsTable
} from './Logic/game';
export * from './Logic/game';

console.log(GameName);

const city = new City({
  facilityConfig: new GdsTable<FacilityGdsRow>()
});

city.upgradeFacility(CityFacility.Center);
city.upgradeFacility(CityFacility.Center);
city.upgradeFacility(CityFacility.Center);
city.upgradeFacility(CityFacility.Center);
city.upgradeFacility(CityFacility.Market);

city.showAll()
