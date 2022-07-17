import buildingCountConfig = require('../../league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import { StateName, ResouceType, CityFacility } from '../Const';

var InitState = {
    [StateName.City]: {
      facilities: { },
      resources: {
          [ResouceType.Silver]:
          {
              lastUpdate: -1,
              value: 1000000,
              production: 0
          },
          [ResouceType.Troop]:
          {
              lastUpdate: -1,
              value: 0,
              production: 0
          }
      },
    },
    [StateName.General]:{
      levels:[],
      able:[],
      skill_levels:[]
    }
};

var _inited = false



export function GetInitState(){
    if (!_inited) {
        for(let key in CityFacility)
        {
            let CityAnyType:any = CityFacility[key];
            let maxCount = buildingCountConfig[CityAnyType]['max_count']
            if(!isNaN(maxCount)){
                InitState[StateName.City].facilities[CityAnyType] = Array(maxCount).fill(1)
            }
        }

    }
    return InitState
}