import buildingCountConfig = require('../../league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import { StateName, ResouceType, CityFacility } from '../Const';
import qualificationGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/general.json');

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
        //city state
        for(let key in CityFacility)
        {
            let CityAnyType:any = CityFacility[key];
            let maxCount = buildingCountConfig[CityAnyType]['max_count']
            if(!isNaN(maxCount)){
                InitState[StateName.City].facilities[CityAnyType] = Array(maxCount).fill(1)
            }
        }
        //general state
        let len = qualificationGDS.Config.length
        InitState[StateName.General].levels = new Array(len).fill(1)
        InitState[StateName.General].able = new Array(len).fill(false)
        InitState[StateName.General].skill_levels = new Array(len).fill([])
        for(let i = 0; i < len; i++){
            InitState[StateName.General].skill_levels[i] = new Array(3).fill(1)
        }
        _inited = true
    }
    return InitState
}