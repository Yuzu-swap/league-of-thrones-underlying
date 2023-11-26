'use strict';
var fs = require("fs");
const excelToJson = require('convert-excel-to-json');


let config = {};
let sourceFile = "./loot-gds.xlsx";
const result = excelToJson({
	sourceFile: sourceFile,
	columnToKey: {
		A: 'type',
		B: 'distance',
		C: 'parameter',
		D: 'gather_silver_speed',
		E: 'silver_total_number',
		F: 'buff_id',
		G: 'troops',
		H: 'durability'
	}
});
let list = result.Sheet1 || [];
list.forEach(function(item, index){
	if(index > 1){
		let buff_ids = item.buff_id.split('|');
		item.buff_id = buff_ids[Math.round(Math.random()*987664)%buff_ids.length]/1;

		/*
		attack|defense|type|count
		[35000|35000|1|20000]|[35000|35000|2|20000]|[35000|35000|3|20000]
      "troops":[
         {
             "type": 2,
             "defense": 5000,
             "count": 2000,
             "attack": 5000
         }
      ],
		*/
		let _troops = item.troops.split(']|'); 
		let troops = [];
		_troops.forEach(function(_troop){
			_troop = _troop.split('[').join('').split(']').join('').split('|');
			troops.push({
             "attack": _troop[0]/1,
             "defense": _troop[1]/1,
             "type": _troop[2]/1,
             "count": _troop[3]/1
          });
		});
		item.troops = troops;
		item.key = 'type-distance';
		config[item.type + '-' + item.distance] = item;
	}
	console.log(item);
	// config[item.key.toLowerCase()] = item.value || item.key;
});

let str = JSON.stringify(config, null, ' \t');

fs.writeFile('loot-gds.json', str ,  function(err) {
   if (err) {
       return console.error(err);
   }
   console.log("数据写入成功！");
});