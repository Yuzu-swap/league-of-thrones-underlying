import {
  CityFacility,
  StateName,
  StateTransition
} from './Game/Const';
import { ConfigContainer } from './Core/config';
import { GloryInfo, ICityState } from './Game/State';
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
import { General, RecoverMoraleType } from './Game/Logic/general';
import { IMapComponent } from './Game/Throne/map';
import { addToSortList, getTimeStamp } from './Game/Utils';
import { StrategyComponent } from './Game/Throne/strategy';

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
  console.log("hello world")
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
          // "1" :{
          //   "test1" : [ 12, 13 ]
          // }
        },
        season:{
          apply_ts: 0,
          prepare_ts : 0,
          start_ts : 0,
          end_ts : 0,
          reward_amount_1: 5000,
          reward_amount_2: 5000,
          rank_config_fromto:[1, 1, 2, 3],
          rank_config_value: [1100, 800],
        }
      }, ()=>{})
      Throne.instance().mediator.sendTransaction(StateTransition.SetUnionId,
        {
          from: 'test1',
          unionId: 1
        },
        ()=>{})
      Throne.instance().mediator.sendTransaction(StateTransition.AbleGeneral,
        {
          from: 'test1',
          id: 1
        },
        ()=>{})
      Throne.instance().mediator.sendTransaction(StateTransition.DefenseBlock,
        {
          from: 'test1',
          x_id: 9,
          y_id: 9,
          generalId: 1
        },
        ()=>{})
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
          city.doUpgradeFacility(CityFacility.Fortress, 0, ()=>{})
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
        console.log("cool down", city.getTestResourceCoolDownTime())
        city.addTestResource(
          (result)=>{
            console.log(result)
          }
        )
        console.log("cool down", city.getTestResourceCoolDownTime())
        city.addTestResource(
          (result)=>{
            console.log(result)
          }
        )
        city.updateResource();
        city.doRecruit(5, (re)=>{
          console.log(re)
        })
        console.log(city.getRecruitState())

        console.log( JSON.stringify(city.getRechargeConfigs()))

        Throne.instance().mediator.sendTransaction(StateTransition.Recharge,
          {
            from: 'test',
            username: 'test',
            rechargeId: 1,
            amount: 1
          },
          ()=>{})
        Throne.instance().mediator.sendTransaction(StateTransition.Recharge,
          {
            from: 'test',
            username: 'test',
            rechargeId: 1,
            amount: 10001
          },
          ()=>{})
        Throne.instance().mediator.sendTransaction(StateTransition.Recharge,
          {
            from: 'test',
            username: 'test',
            rechargeId: 1,
            amount: 1000
          },
          ()=>{})
        
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
        general.ableGeneral(1, (result)=>{
          console.log("general able ", result)
        })
        general.ableGeneral(2, (result)=>{
          console.log("general able ", result)
        })
        general.ableGeneral(3, (result)=>{
          console.log("general able ", result)
        })
        for(let i = 0; i < 100 ; i ++){
          general.upgradeGeneral(1,  (result)=>{
            console.log("general up ", result)
          })
        }
        let num = general.getUpgradeGeneralNeed(2, 1);
        let num1= general.getSkillUpgradeNeed(2, 1, 1);
        console.log("value", general.getGeneralQuaValue(1, 1))
        console.log("general status ", general.getAbleStatus())
        for(let i = 0; i < 100 ; i ++){
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
        general.battle(1, 'test1', (re)=>{
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

        general.battle(2, 'test1',
          (re)=>{
            console.log("general-----battle",re)
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

        console.log( general.getIconId())
        general.setIconId( 4, 
          (result)=>{
            console.log('general----======setIcon',result)
          }
        )
        console.log( general.getIconId())

        console.log( general.getMorale())

        console.log( general.getMoraleBuff())

        console.log( general.getRecoverMoraleInfo())

        general.recoverMorale(
          RecoverMoraleType.Gold
          ,(re)=>{
            console.log(re)
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
            
          map.attackBlock( 9, 9, 1,
            (result)=>{
              console.log('map----attackBlock',result)
              map.getBlockInfo(9, 9, (result)=>{
                console.log(result)
              })
            }
          )
          map.attackBlock( 9, 9, 1,
            (result)=>{
              console.log('map----attackBlock',result)
              map.getBlockInfo(9, 9, (result)=>{
                console.log(result)
              })
            }
          )
          map.attackBlock( 9, 9, 1,
            (result)=>{
              console.log('map----attackBlock',result)
              map.getBlockInfo(9, 9, (result)=>{
                console.log(result)
              })
            }
          )
          map.attackBlock( 9, 9, 1, ()=>{})
          map.attackBlock( 9, 9, 1, ()=>{})
          map.attackBlock( 9, 9, 1,
            (result)=>{
              console.log('map----attackBlock',result)
              map.miningBlock(9, 9, 1,()=>{})
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
    
          map.defenseBlock( 10 , 10, 3, 
            (result)=>{
              console.log('map----defenseBlock',result)
            }
          )
          map.defenseBlock( 10 , 10, 2, 
            (result)=>{
              console.log('map----defenseBlock',result)
            }
          )

          map.cancelDefenseBlock( 10 , 10, 3, 
            (result)=>{
              console.log('map----defenseBlock',result)
            }
          )
          map.getDefenseList(10, 10, 
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
          map.getUnionWinInfo(
            (result)=>{
              console.log('map----getUnionWinInfo', JSON.stringify(result))
            }
          )
          console.log(map.getSeasonConfig())
        }
      )
    }
    ,2000
  )

  setTimeout(
    ()=>{
      Throne.instance().initComponent(
        ComponentType.Strategy,
        (strategy : StrategyComponent)=>{
          strategy.buySilver((re)=>console.log(re))
          strategy.buyMorale((re)=>console.log(re))
          strategy.buyTroop((re)=>console.log(re))
          console.log(strategy.getStrategyNeed())
          console.log(strategy.getBuyStrategyPointNeed(2))
          console.log(strategy.getRecoverStrategyRemainTime())
          console.log(strategy.getStrategyPointInfo())
          strategy.buyStrategyPoint(2, ()=>{})
          strategy.buyStore((re)=>console.log(re))
          strategy.buyProtect((re)=>console.log(re))
          console.log(strategy.getStrategiesInfo())
        }
      )

    },
    2500
  )

  
}

function test(){
  console.log(mapGDS['9^9'])
}

function testSort(){
  let list: GloryInfo[] = []
  addToSortList(list, "aaa", 0, 2, 0)
  addToSortList(list, "bbb", 0, 3, 0)
  addToSortList(list, "aaa", 2, 4, 0)
  addToSortList(list, "ccc", 0, 3, 0)
  addToSortList(list, "ddd", 0, 1, 0)
  addToSortList(list, "eee", 0, 2.5, 0)
  addToSortList(list, "eee", 2.5, 3.5, 0)
  console.log(list)
}
//test()
//example()
//testSort()