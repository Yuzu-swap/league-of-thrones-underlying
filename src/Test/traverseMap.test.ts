import { CityFacility } from "../Game/Const"
import { Decimal } from 'decimal.js'

test("hello test", ()=>{
    let t = 1
    console.log((t as any as Decimal).add(1))
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