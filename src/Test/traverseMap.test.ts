import { StringifyTxType } from "../Game/Const"
import {createCheckers} from "ts-interface-checker";
import { StateTransitionArgs } from "../Game/Const/index-ti";

test("hello test", ()=>{
    expect(1 == 1)
    const {a} = createCheckers({StateTransitionArgs});
    console.log(JSON.stringify({size: Infinity}))
    a.check({size: NaN});                  // OK
})

test("hello test1", ()=>{
    console.log(StringifyTxType())
    expect(1 == 1)
})