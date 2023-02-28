import {createCheckers} from "ts-interface-checker";
import { StateTransitionArgs } from "../Game/Const/index-ti";

test("hello test", ()=>{
    expect(1 == 1)
    const a = createCheckers({StateTransitionArgs});
    console.log(JSON.stringify({size: Infinity}))
    a.StateTransitionArgs.check({size: NaN});                  // OK
})

test("hello test1", ()=>{
    expect(1 == 1)
})