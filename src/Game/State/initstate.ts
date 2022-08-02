import buildingCountConfig = require('../../league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import { StateName, ResouceType, CityFacility } from '../Const';
import qualificationGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/general.json');
import { copyObj } from '../../Core/state';

var InitState = {
    [StateName.City]: {
      facilities: { },
      resources: {
          [ResouceType.Silver]:
          {
              lastUpdate: -1,
              value: 1000000000,
          },
          [ResouceType.Troop]:
          {
              lastUpdate: -1,
              value: 1000,
          }
      },
      recruit:[]
    },
    [StateName.General]:{
      levels:[],
      able:[],
      skill_levels:[],
      defense_general: -1,
      stamina: []
    },
    //TODO: add default defender info
    [StateName.DefenderInfo]:{
    },

};

var _inited = false


export function GetInitState(){
    if (!_inited) {
        //city state
        const time = parseInt(new Date().getTime() / 1000 + '');
        for(let key in CityFacility)
        {
            let CityAnyType:any = CityFacility[key];
            let maxCount = buildingCountConfig[CityAnyType]['max_count']
            if(!isNaN(maxCount)){
                InitState[StateName.City].facilities[CityAnyType] = Array(maxCount).fill(1)
            }
        }
        InitState[StateName.City].resources[ResouceType.Silver].lastUpdate = time
        InitState[StateName.City].resources[ResouceType.Troop].lastUpdate = time
        //general state
        let len = qualificationGDS.Config.length
        InitState[StateName.General].levels = new Array(len).fill(1)
        InitState[StateName.General].able = new Array(len).fill(false)
        InitState[StateName.General].skill_levels = new Array(len).fill([])
        InitState[StateName.General].stamina = new Array(len).fill({})
        for(let i = 0; i < len; i++){
            InitState[StateName.General].skill_levels[i] = new Array(3).fill(1)
            InitState[StateName.General].stamina[i] = {
                value: qualificationGDS.Config[i].stamina,
                lastUpdate: time
            } as any
        }
        _inited = true
    }
    return  copyObj(InitState)
}