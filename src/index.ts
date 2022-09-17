import {
  CityFacility,
  StateName,
  StateTransition
} from './Game/Const';
import { ConfigContainer } from './Core/config';
import { ICityState } from './Game/State';
import {
  FacilityFortressGdsRow,
  FacilityMilitaryCenterGdsRow,
  FacilityWallGdsRow,
  FacilityStoreGdsRow,
  FacilityInfantryCampGdsRow,
  FacilityCavalryCampGdsRow,
  FacilityArcherCampGdsRow,
  FacilityTrainingCenterGdsRow,
  FacilityHomeGdsRow
} from './Game/DataConfig';

import fortressGDS = require('./league-of-thrones-data-sheets/.jsonoutput/fortress.json');
import militaryCenterGDS = require('./league-of-thrones-data-sheets/.jsonoutput/militarycenter.json');
import wallGDS = require('./league-of-thrones-data-sheets/.jsonoutput/wall.json');
import storeGDS = require('./league-of-thrones-data-sheets/.jsonoutput/store.json');
import infantryCampGDS = require('./league-of-thrones-data-sheets/.jsonoutput/infantrycamp.json');
import cavalryCampGDS = require('./league-of-thrones-data-sheets/.jsonoutput/cavalrycamp.json');
import archerCampGDS = require('./league-of-thrones-data-sheets/.jsonoutput/archercamp.json');
import trainingCenterGDS = require('./league-of-thrones-data-sheets/.jsonoutput/trainingcenter.json');
import homeGDS = require('./league-of-thrones-data-sheets/.jsonoutput/home.json');
import buildingCount = require('./league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import mapGDS = require('./league-of-thrones-data-sheets/.jsonoutput/map_config.json')
import { LocalMediator } from './Game/Controler/mediator';
import { IState, State } from './Core/state';
import {Throne, ICityComponent, IGeneralComponent, GeneralComponent , ComponentType, CityComponent} from './Game/Throne';
import { General } from './Game/Logic/general';
import { IMapComponent } from './Game/Throne/map';
import { getTimeStamp } from './Game/Utils';

export const GameName = 'league of thrones';
export * from './Game/Controler/mediator';
export * from './Game/Controler/transition';
export * from './Game/State';
export * from './Core/state';
export * from './Game/Throne';
export * from './Game/Const';


export var run = function () {
  /*
  const mediator = new LocalMediator();

  const myCityStateId = `${StateName.City}:${TestWallet}`;

  //async accuire state
  const defaultState = {
    id: myCityStateId,
    facilities: {},
    resources: {}
  };
  const city: City = new City(
    new State<ICityState>(defaultState).unsderlying(),CityConfigFromGDS
  );
  let cityInitd: boolean = false;
  mediator.onReceiveState({ id: myCityStateId }, (state: IState) => {
    //first init
    if (!cityInitd) {
      cityInitd = true;
      console.log('city initd');
      city.loadState(state.stateObj());
      city.showAll();
      //city update
    } else {
      console.log('city updated');
      city.loadState(state.stateObj());
      city.showAll();
    }
  });
  //trigger aysnc query
  mediator.queryState({ id: myCityStateId });

  //trigger upgrade
  mediator.sendTransaction(StateTransition.UpgradeFacility, {
    from: TestWallet,
    typ: CityFacility.Fortress,
    index: 0,
    targetLevel: 1
  });
  mediator.sendTransaction(StateTransition.UpgradeFacility, {
    from: TestWallet,
    typ: CityFacility.Fortress,
    index: 0,
    targetLevel: 2
  });
  */
  // mediator.sendTransaction(StateTransition.UpgradeFacility, { from: TestWallet, typ: CityFacility.Logistics, index: 0, targetLevel: 1 })
};

//run();
let count = 0;
function example() {
  Throne.instance().init(
    {
      username: "test",
      unionId: 1
    },
    (result)=>{
      console.log( (Throne.instance().mediator as LocalMediator).getTransaction().checkUnionWin())
      console.log( (Throne.instance().mediator as LocalMediator).getTransaction().getSeasonStatus())
      console.log("set union", result)
      Throne.instance().mediator.sendTransaction(StateTransition.StartSeason,{
        from: Throne.instance().username,
        applies:{
          "1" :{
            "test1" : [ 12, 13 ]
          }
        },
        season:{
          season_reservation: 0,
          season_ready : 0,
          season_open : 0,
          season_end : 0,
          reward1Amount: 0,
          reward2Amount: 0
        }
      }, ()=>{})
    }
  )
  setTimeout(() => {
    Throne.instance().initComponent<CityComponent>(
      ComponentType.City,
      (city: ICityComponent) => {
        console.log('City init');
        // bind button with action
        // button.onClick = () =>{
        for(let i = 0; i < 12; i++){
          city.doUpgradeFacility(CityFacility.Home, 0, ()=>{})
        }
        console.log('test error',city.getUpgradeInfo(CityFacility.Store, 15))
        // watch action response
        console.log(city.getFacilityOrder())
        // watch state update
        city.onStateUpdate(() => {
          // regenerate  ui state
          const facilities = city.getFacilityList();
          const resource = city.getResource();
          const uiState = { facilities, resource };
          console.log("receive state", uiState)
          count += 1
          //console.log("============", count)
          // rerender by new state
        });
        city.updateResource();
        city.doRecruit(5, (re)=>{
          console.log(re)
        })
        console.log(city.getRecruitState())
        
        //update
      }
    );
  }, 1000);
  
  setTimeout(()=>{
    Throne.instance().initComponent(
      ComponentType.General,
      ((general: IGeneralComponent)=>{
        general.onStateUpdate((state)=>{
          console.log("general",state)
        })
        general.ableGeneral(2, (result)=>{
          console.log("general able ", result)
        })
        for(let i = 0; i < 110 ; i ++){
          general.upgradeGeneral(2,  (result)=>{
            console.log("general up ", result)
          })
        }
        let num = general.getUpgradeGeneralNeed(2, 1);
        let num1= general.getSkillUpgradeNeed(2, 1, 1);
        console.log("value", general.getGeneralQuaValue(1, 1))
        console.log("general status ", general.getAbleStatus())
        for(let i = 0; i < 30 ; i ++){
          general.upgradeGeneralSkill(1 , 0, 
            (result)=>{
              console.log("upgrade skill", result)
            }
            )
        }
       
        console.log("general", general.getGeneralList())
        console.log("const ", general.getConstData())
        general.setDefenseGeneral(1, (re)=>{
          console.log(re)
        })
        console.log('defenseGeneral', general.getGeneralBattleInfo(1))
        general.battle(1, 'test', (re)=>{
          console.log(re)
        })
        general.getBattleRecords(
          (result)=>{
            console.log('+++++++++++++++++++++++++', result)
          }
        )
  
        general.battle(2, 'test1',
          (re)=>{
            console.log("general-----battle",re)
          }
        )
  
        general.getBattleStatuses('',
          (result)=>{
            console.log('general-----getbbb',result)
          }
        )
  
        general.getBattleStatuses('test',
          (result)=>{
            console.log('general----======-getbbb',result)
          }
        )
  
        })
  
    )
  }, 1500)
  
  setTimeout(
    ()=>{
      Throne.instance().initComponent(
        ComponentType.Map,
        (map: IMapComponent)=>{
          map.onStateUpdate(
            ()=>{
              console.log(map.getBlocksBelongInfo())
            }
          )
          map.getBlockInfo(1, 1, 
            (result)=>{
              console.log('map----getBlockInfo',result)
            }
          )
          //console.log(map.getBlocksBelongInfo())
    
          map.attackBlock( 9, 9, 2,
            (result)=>{
              console.log('map----attackBlock',result)
              map.getBlockInfo(9, 9, (result)=>{
                console.log(result)
              })
              map.attackBlock( 8, 10, 2,
                (result)=>{
                  console.log('map----attackBlock',result)
                  console.log(map.getBlocksBelongInfo())
                }
              )
            }
          )
    
          console.log(map.getBlocksBelongInfo())
    
          map.defenseBlock( 9 , 9, 1, 
            (result)=>{
              console.log('map----defenseBlock',result)
            }
          )
          map.getDefenseList(9, 9, 
            (result)=>{
              console.log('map----getDefenseList',result)
            }
          )
          
          map.getSeasonStatus(
            (result)=>{
              console.log('map----getSeasonStatus',result)
            }
          )
    
          map.getSeasonRankResult(
            (result)=>{
              console.log('map----getSeasonRankResult',result)
            }
          )
          console.log(map.getSeasonConfig())
        }
      )
    }
    ,2000
  )

  
}

function test(){
  console.log(mapGDS['9^9'])
}
//test()
//example()