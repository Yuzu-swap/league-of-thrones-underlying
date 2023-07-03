import buildingCountConfig = require('../../league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import { StateName, ResouceType, CityFacility, MaxSize, mapIdOffset, MaxStrategyPoint } from '../Const';
import qualificationGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/general.json');
import mapGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config.json')
import { copyObj } from '../../Core/state';
import { GenBlockDefenseTroop, SeasonConfigFromGDS } from '../DataConfig';
import { GeneralInfo } from '.';

export var InitState = {
    [StateName.City]: {
      facilities: { },
      resources: {
          [ResouceType.Silver]:
          {
              lastUpdate: -1,
              value: 10000,
          },
          [ResouceType.Troop]:
          {
              lastUpdate: -1,
              value: 1000,
          }
      },
      recruit:[],
      gold: 0,
      lastAddTestTime: -1,
      userActivity: [],
      guideStep: [],
      firstLogin: -1
    },
    [StateName.General]:{
        generalList: {},
        defense_general: -1,
        defenseBlockList : [],
        unionId: 1,
        glory: 0,
        iconId: -1,
        morale: {
            lastUpdate: -1,
            value: 100,
        },
        unionInit: false,
        lastBattle: -1
    },
    //TODO: add default defender info
    [StateName.DefenderInfo]:{
        generalId: -1,
        generalLevel: 1,
        generalType: 1,
        attack: 100,
        defense: 100,
        troop: 0,
        silver: 0,
        glory: 0,
        defenseMaxTroop: 0,
        unionId: 1,
        fortressLevel: 1,
        isProtected: false
    },
    [StateName.MapGlobalInfo]:{
        campInfo:[],
        campMembers: [],
        unionWinId: 0,
        seasonEnd: false
    },
    [StateName.SeasonConfig]:{
        haveSet: false,
        season_reservation: 0,
        season_ready : 0,
        season_open : 0,
        season_end : 0,
        rankConfigFromTo: [],
        rankConfigValue: [],
        unionRewardValue: 0,
        rankRewardValue: 0
    },
    [StateName.RewardGloablState]:{
        unionGloryRankInfo: [[],[],[],[]],
        globalGloryRankInfo: [],
        contractAddressInput: [],
        contractGloryInput: [],
        unionGlorySum: 0,
        unionGlorySumRuntime:[0, 0, 0, 0],
        unionWinId: 0,
        seasonEnd: false,
        unionRewardResult: [],
        gloryRewardResult: [],
    },
    [StateName.Strategy]:{
        strategyPoint: {
            lastUpdate: -1,
            value: MaxStrategyPoint,
        },
        buyTimes:{
            lastUpdate: -1,
            value: 0,
        },
        store:{
            able: false,
            beginTime: 0
        },
        protect:{
            able: false,
            beginTime: 0
        },
        protect1:{
            able: false,
            beginTime: 0
        }
    },
    [StateName.Activity]:{
        activityData: [],
        sumValue: [],
        haveSendReward: []
    }
};

var gInitState = {

}

export var validBlockIds = []

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
        InitState[StateName.General].unionId = 1
        for(let i = 0; i < len; i++){
            if(qualificationGDS.Config[i].general_from == 1){
                const row = qualificationGDS.Config[i]
                let generalInfo : GeneralInfo = {
                    id: row.general_id,
                    level: 1,
                    able: false,
                    skill_levels: new Array(row.general_skill.length).fill(1),
                    stamina: {
                        value: row.stamina,
                        lastUpdate: -1
                    }
                }
                InitState[StateName.General].generalList[row.general_id + ""] = generalInfo
            }
        }
        let maxlen = Math.floor((MaxSize + 1)/ 2)
        InitState[StateName.MapGlobalInfo].campInfo = []
        for(let i = 0; i< MaxSize; i++){
            InitState[StateName.MapGlobalInfo].campInfo.push( new Array(maxlen - i %2 ).fill(null).map(
                ()=>{
                    return {unionId: 0,
                    attackEndTime: -1,
                    protectEndTime: -1}
                 }
                ))
        }
        for(let i = 0; i< 4; i++){
            InitState[StateName.MapGlobalInfo].campMembers.push([])
        }
        InitState[StateName.MapGlobalInfo].campMembers[0].push('test')
        InitState[StateName.MapGlobalInfo].unionWinId = 0

        InitState = Object.assign(InitState, GetMapState())        
        _inited = true
    }
    return  copyObj(InitState)
}

var _ginit = false

export function GetMapState(){
    if(!_ginit){
        const time = parseInt(new Date().getTime() / 1000 + '');
        for(let block in mapGDS){
            let key = `${StateName.BlockInfo}:${block}`
            let row = mapGDS[block]
            let list = block.split('^')
            let unionId = 0
            if( row['type'] == 3 ){
                unionId = row['parameter']
                let xIndex = parseInt(list[0]) + mapIdOffset;
                let yIndex = Math.floor((parseInt(list[1]) + mapIdOffset) / 2)
                InitState[StateName.MapGlobalInfo].campInfo[xIndex][yIndex].unionId = unionId
            }
            gInitState[key]= {
                id: key,
                x_id: parseInt(list[0]),
                y_id: parseInt(list[1]),
                belong: {
                    unionId: unionId,
                    updateTime: -1
                  },
                defenseList: [],
                durability: row['durability'],
                defaultDefense: GenBlockDefenseTroop(parseInt(list[0]),parseInt(list[1])),
                lastAttachTime: -1,
                remainSilver: row['silver_total_number']
            }
        }
        let activityLen = SeasonConfigFromGDS.get(1).activities.length
        for(let i = 0; i < activityLen; i++){
            InitState[StateName.Activity].activityData.push([])
            InitState[StateName.Activity].sumValue.push(0)
            InitState[StateName.Activity].haveSendReward.push(false)
        }
        for(let key in gInitState){
            validBlockIds.push(key)
        }
    }
    return copyObj(gInitState)
}