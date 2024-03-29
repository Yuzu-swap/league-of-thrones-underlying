import {
  CityFacility,
  RecoverMoraleType,
  StateName,
  StateTransition,
  StringifyTxType
} from './Game/Const';
import { ConfigContainer } from './Core/config';
import { ActivityData, GloryInfo, ICityState } from './Game/State';
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

import fortressGDS = require('./gds/fortress.json');
import militaryCenterGDS = require('./gds/militarycenter.json');
import wallGDS = require('./gds/wall.json');
import storeGDS = require('./gds/store.json');
import infantryCampGDS = require('./gds/infantrycamp.json');
import cavalryCampGDS = require('./gds/cavalrycamp.json');
import archerCampGDS = require('./gds/archercamp.json');
import trainingCenterGDS = require('./gds/trainingcenter.json');
import homeGDS = require('./gds/home.json');
import buildingCount = require('./gds/building_count.json');
// import mapGDS = require('./gds/map_config_0.json')
import vipGDS = require('./gds/vip.json')
import { LocalMediator } from './Game/Controler/mediator';
import { IState, State } from './Core/state';
import {Throne, ICityComponent, IGeneralComponent, GeneralComponent , ComponentType, CityComponent} from './Game/Throne';
import { General } from './Game/Logic/general';
import { IMapComponent } from './Game/Throne/map';
import { addToNormalSortedList, addToSortList, checkNaNInObj, getTimeStamp, isNumber } from './Game/Utils';
import { StrategyComponent } from './Game/Throne/strategy';
import { ChainComponent, IChainComponent } from './Game/Throne/chain';

import parameterGDS = require('./gds/parameter.json')
export const randomCampReward = parameterGDS.choose_random_camp_reward;

export const rewardConfig = {
  randomCamp: parameterGDS.choose_random_camp_reward || {},
  upgrade_fortress: parameterGDS.upgrade_fortress_share_activity_reward || {},
  attack: parameterGDS.attack_territory_share_activity_reward || {},
  stamina_share: parameterGDS.stamina_share_activity_reward || {}
};
export const staminaTimes = {
  attackPlayer: parameterGDS.attack_player_need_stamina.value,
  attackPlots: parameterGDS.attack_plots_need_stamina.value,
  defensePlots: parameterGDS.defense_plots_need_stamina.value,
  gather: parameterGDS.gather_need_stamina.value,
  spy: parameterGDS.spy_need_stamina.value,
  assembly: parameterGDS.assembly_need_stamina.value
};

export function getVipSilverBuff(userScore: number){
    let scores = vipGDS['Config'];
    let minScore = scores[0].score;
    let maxScore = scores[scores.length - 1].score;

    if(userScore >= maxScore){
      return scores[scores.length - 1];
    }

    let buffs = {};
    for(var i=0;i<scores.length-1;i++){
      if(userScore >= scores[i].score && userScore < scores[i+1].score){
        buffs = scores[i];
      }
    }
    return buffs;
}

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
  global.ctx = undefined
  console.log("hello world")
  Throne.instance().init(
    {
      username: "test",
      unionId: 2
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
          unionId: 0,
          force: true
        },
        ()=>{})
      Throne.instance().mediator.sendTransaction(StateTransition.RegularTask,
        {
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
  setTimeout(
    ()=>{
      Throne.instance().initComponent<ChainComponent>(
        ComponentType.Chain,
        (chainCom: IChainComponent) =>{
          chainCom.onReceiveChainBlockInfo( 
            (msg)=>{
              console.log("mmmmmsg", msg)
          } )
        }
      )
    },
    500
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
        const resource = city.getResource();
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

        console.log( JSON.stringify(city.getRechargeConfigs('oasis')))

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

        // Throne.instance().mediator.sendTransaction(StateTransition.InitUserStates,
        //   {
        //     from: 'test',
        //     username: 'test',
        //   },
        //   ()=>{})
        
        //update

        console.log(city.getAbleActivityInfo(1))

        city.donateSilver(1, 100, 
          (result)=>{
            console.log(result)
          })
        
        console.log( city.getGuideStep("test"))
        city.setGuideStep(
          "test",
          2, ()=>{
            console.log( city.getGuideStep("test"))
          }
        )
        city.setGuideStep(
          "test",
          5, ()=>{
            console.log( city.getGuideStep("test"))
          }
        )
      }
    );
  }, 1000);
  
  setTimeout(()=>{
    Throne.instance().initComponent(
      ComponentType.General,
      ((general: IGeneralComponent)=>{

        general.getRecentWorldBattleRecords(
          (re)=>{
            console.log(re)
          }
        )
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
              map.getInitBlockInfo(9, 9, (result)=>{
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
          strategy.onStateUpdate(()=>{
            console.log(strategy.getStrategyPointInfo())
          })
          strategy.buySilver((re)=>console.log(re))
          strategy.buyMorale((re)=>console.log(re))
          strategy.buyTroop((re)=>console.log(re))
          console.log(strategy.getStrategyNeed())
          console.log(strategy.getBuyStrategyPointNeed(2))
          console.log(strategy.getRecoverStrategyRemainTime())
          console.log(strategy.getStrategyPointInfo())
          strategy.buyStrategyPoint(2 , ()=>{})
          strategy.buyStore((re)=>console.log(re))
          strategy.buyProtect((re)=>console.log(re))
          strategy.buyProtect1((re)=>console.log(re))
          console.log(strategy.getStrategiesInfo())
        }
      )

    },
    2500
  )

  
}

function test(){
  enum  TTT{
    Test1 = "test1",
    Test2 = "test2"
  }
  for(let key in TTT){
    console.log(key)
  }
  for(let key in TTT){
    let type : any =  TTT[key]
    let typeT : TTT = type
    console.log(typeT)
  }
  let t1 = {
    tt: 123,
    tt12: {
      tt: 231,
      t3: 123,
    },
    t3: [1, 3]
  }
  checkNaNInObj(t1)
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

  let newList: ActivityData[] = [] 
  addToNormalSortedList(newList, "aaa", 0, 2, 'value')
  addToNormalSortedList(newList, "bbb", 0, 3, 'value')
  addToNormalSortedList(newList, "aaa", 2, 4, 'value')
  addToNormalSortedList(newList, "ccc", 0, 3, 'value')
  addToNormalSortedList(newList, "ddd", 0, 1, 'value')
  addToNormalSortedList(newList, "eee", 0, 2.5, 'value')
  addToNormalSortedList(newList, "eee", 2.5, 3.5, 'value')
  console.log(newList)

}
//test()
//example()
//testSort()