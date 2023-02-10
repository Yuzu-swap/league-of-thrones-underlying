import { CityFacility } from "../Game/Const"
import { Decimal } from 'decimal.js'
import { copyObj } from "../Core/state"
import { exportDecimal, importDecimal } from "../Game/Utils"

test("hello test", ()=>{
    let t = 
    { b:
       {
        decTypeA: "1"
       }
    }
    let c = new Decimal(2.123123123);
    let e = new Decimal(c)
    console.log(JSON.stringify(e))
    let d = copyObj(t)
    console.log(exportDecimal(t))
    console.log(importDecimal(importDecimal(exportDecimal(t))))
    expect(1 == 1)
})

test("dic for", ()=>{
    let dicTest = {}
    dicTest['A'] = 3
    dicTest['2'] = 4
    dicTest['1'] = 6
    dicTest['b'] = 4
    dicTest['a'] = 1
    expect( Object.getOwnPropertyNames(dicTest).toString() ==  [ '1', '2', 'A', 'b', 'a' ].toString())
} )