import { StateName, StateTransition, CityFacility } from "./Game/Const";
import { WebSocketMediator } from "./Game/Controler/websocket";
import { ICityState } from "./Game/State";

async function testws(uname, seasonId) {
    const ws: WebSocketMediator = new WebSocketMediator(
      'ws://test-ws.leagueofthrones.com/ws/' + uname,
      {}
    );
  
    await ws.init();
    const city = (await ws.queryState(
      { id: `${StateName.City}:${uname}` },
      { seasonId: seasonId },
      null
    )) as ICityState;
  
    console.log('@@city', city);
  
    ws.sendTransaction(
      StateTransition.UpgradeFacility,
      {
        from: uname,
        typ: CityFacility.Fortress,
        index: 0,
        targetLevel: 1
      },
      (result) => {
        console.log('upgrade facility result is ', result);
      }
    );
    // ws.sendTransaction(
    //   StateTransition.InitGlobalStates,
    //   {
    //     from: uname,
    //   },
    //   (result) => {
    //     console.log(' Init global ', result);
    //   }
    // );

    const cities = (await ws.query(
      `${StateName.City}`,
      {
        seasonId: seasonId
      },
    ))
//    console.log("cities are ",cities)

    /*
    ws.sendTransaction(
      StateTransition.UpgradeFacility,
      {
        from: uname,
        typ: CityFacility.Fortress,
        index: 0,
        targetLevel: 1
      },
      (result) => {
        console.log('upgrade facility result is ', result);
      }
    );
    */
  }
  
  testws('ccc5', 'ssss');
  