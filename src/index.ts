import {
  City,
  FacilityGdsRow,
  GdsTable
} from './Game/Logic/game';
import { CityFacility } from './Game/Const';
import { State, IStateChangeWatcher, IState } from './Core/state';
import { ICityState } from './Game/State';
export const GameName = 'league of thrones';


class StateWather implements IStateChangeWatcher{
  onStateChange(modify: {}, state: IState): void {
    console.log("onStateChange ", state.getId(), "moidfy ",modify)
  }
}
const watcher = new StateWather()

const cityState:ICityState= (new State<ICityState>({id:"city-testid",facilities:{
},resources:{},troops:0},watcher)).unsderlying()

const city = new City((cityState as any as ICityState),{
  facilityConfig: new GdsTable<FacilityGdsRow>()
});

city.upgradeFacility(CityFacility.Center);
city.upgradeFacility(CityFacility.Center);
city.upgradeFacility(CityFacility.Center);
city.upgradeFacility(CityFacility.Center);
city.upgradeFacility(CityFacility.Market);

city.showAll()
