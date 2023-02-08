import { CityFacility } from "../Game/Const"
import { Decimal } from 'decimal.js'
import { copyObj } from "../Core/state"
import { exportDecimal, importDecimal } from "../Game/Utils"

test("hello test", ()=>{
    let t = 
    { b:
       {
        a: "1"
       }
    }
    t.b.a = new Decimal(1) as any 
    let c = new Decimal(2.123123123);
    console.log(JSON.stringify(c))
    let d = copyObj(t)
    console.log(exportDecimal(t))
    console.log(importDecimal(exportDecimal(t)))
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