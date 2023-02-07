import { CityFacility } from "../Game/Const"
import { Decimal } from 'decimal.js'

test("hello test", ()=>{
    let t = 
    {
        a: "1"
    }
    t.a = new Decimal(1) as any 
    let c = new Decimal(2);
    (t.a as any as Decimal).add(c)
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