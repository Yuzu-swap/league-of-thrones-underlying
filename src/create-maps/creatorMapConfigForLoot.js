'use strict';
var fs = require("fs");

var mapDir = '../gds';
var buffTable = require(mapDir + '/buff_table.json')['Config'];

var basePoints = [
    12,12,12,12,12,12,12,2,2,2,2,
    12,12,12,12,12,12,12,2,2,2,2,
    12,12,12,12,12,4,2,12,11,2,2,
    8,12,12,12,12,11,2,11,11,2,2,
    12,12,12,12,12,4,11,2,11,2,2,
    8,12,12,12,4,4,2,2,11,11,2,
    12,12,12,12,12,4,4,2,2,11,2,
    12,12,12,12,4,4,4,2,2,2,2,
    12,12,12,12,12,4,4,2,2,2,2,
    12,12,12,12,4,4,4,2,11,2,2,
    12,12,12,12,4,4,11,2,11,11,2,
    12,12,12,4,4,4,11,11,2,2,2,
    12,12,12,12,4,4,11,11,2,2,2,
    12,12,12,4,4,11,4,2,2,2,2,
    12,12,12,12,4,11,4,4,2,2,2,
    12,12,12,6,6,6,4,2,2,2,2,
    12,4,12,12,6,11,4,4,2,2,2,
    4,4,12,6,6,6,6,8,2,2,2,
    4,4,12,12,6,11,6,8,8,2,8,
    4,12,12,6,6,6,6,8,8,8,8,
    12,12,12,6,6,12,12,8,8,8,11,
    12,12,6,6,6,12,11,8,8,8,8,
    12,12,12,12,12,12,8,8,8,8,11,
    12,12,12,12,12,8,8,11,8,11,8,
    12,12,12,12,12,8,8,8,11,11,8,
    12,12,12,12,12,8,8,11,11,8,8,
    12,12,12,12,12,8,8,12,8,11,8,
    12,12,12,12,12,8,12,8,8,11,8,
    12,12,12,12,12,12,8,8,8,8,8,
    12,12,12,12,12,8,12,8,8,8,8,
    12,12,12,12,12,8,12,2,8,8,8,
    12,12,12,6,12,12,12,2,2,2,2,
    12,12,12,12,6,12,12,11,2,2,2,
    12,12,6,6,12,12,2,2,2,2,2,
    12,12,12,6,6,12,2,2,2,2,2,
    12,12,6,6,12,12,2,2,2,11,2,
    12,12,12,6,6,12,2,2,2,11,2,
    12,12,12,6,12,12,2,2,11,2,2,
    12,12,12,12,6,12,2,2,11,2,2,
    12,12,12,12,6,12,2,12,2,2,2,
    12,12,12,12,12,12,2,2,2,2,2,
    12,12,12,12,12,12,12,12,12,12,2
];

var specialBlocks  = {
    capitals: [
        { x: 6, y: 18 },
        { x: 6, y: 11 },
        { x: 9, y: 10 },
        { x: 9, y: 36 },
        { x: 9, y: 22 },
        { x: 3, y: 33 }
    ],
    initCamps: [
        { x: 4, y: 39 },
        { x: 10, y: 40 },
        { x: 10, y: 0 },
        { x: 0, y: 18 }
    ],
    city: [
        {"x":6,"y":24,"isLittle":false},
        {"x":6,"y":38,"isLittle":false},
        {"x":9,"y":2,"isLittle":false},
        {"x":7,"y":33,"isLittle":false},
        {"x":5,"y":7,"isLittle":false},
        {"x":8,"y":21,"isLittle":true},
        {"x":2,"y":33,"isLittle":true},
        {"x":10,"y":8,"isLittle":true},
        {"x":10,"y":34,"isLittle":true},
        {"x":3,"y":11,"isLittle":true},
        {"x":7,"y":37,"isLittle":true},
        {"x":7,"y":15,"isLittle":true},
        {"x":4,"y":38,"isLittle":true},
        {"x":10,"y":26,"isLittle":true},
        {"x":6,"y":3,"isLittle":true},
        {"x":10,"y":2,"isLittle":true},
        {"x":5,"y":26,"isLittle":true}
    ]
};


let rows = 42;
let cols = 11;
let mapConfigLoot = {};
for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
        let { x_id, y_id } = getIdIndex(x, y);

        let index = y*cols + x;

        //地块归属
        let bgIndex = basePoints[index];
        let area_block = 2 - bgIndex%2;
        let area = Math.round(bgIndex/2);

        //随机 buff id
        let buffId = buffTable[index%buffTable.length]['buff_id'];

        //地块类型
        /*
        type: 地块类型（1=普通地块；2=中心城市；3=初始点；4=资源地块；5=关隘；6=障碍, 8=港口）
        level: 
        地块类型=1时（1=低级树林；2=中级树林；3=高级树林；4=空地块）
        地块类型=3时配置相应的阵营（1西南,2东南,3西北,4东北）
        地块类型=4时配置相应的等级（1低级,2中级,3高级）
        地块类型=6时配置相应的等级（1低级,2中级,3高级）
        */
        let type = 1;
        specialBlocks.city.forEach(function(item, index){
            if(item['x'] == x && item['y'] == y){
                if(item['isLittle']){
                    type = 5;
                }else{
                    type = 8;
                }
            }
        });
        if(bgIndex == 11){
            type = 6;
        }
        specialBlocks.capitals.forEach(function(item){
            if(item['x'] == x && item['y'] == y){
                type = 2;
            }
        });
        let unionId = 0;
        specialBlocks.initCamps.forEach(function(item, index){
            if(item['x'] == x && item['y'] == y){
                type = 3;
                unionId = index + 1;
            }
        });

        /*
        地块类型=1时（10% 1=低级树林；5% 2=中级树林；5% 3=高级树林；80% 4=空地块）
        地块类型2时（配置0）
        地块类型=3时配置相应的阵营（1东北,2西北,3西南,4东南）
        地块类型=4时配置相应的等级（1低级,2中级,3高级）
        地块类型=6时配置相应的等级（1低级,2中级,3高级）
        */
        let parameter = 0;
        if(type == 1){
            let randomNumber = Math.round(Math.random()*99999999)%20; //0-19;
            let randomMap = {
                0: 1,
                1: 1,
                2: 2,
                3: 3,
                4: 4
            };
            parameter = randomMap[randomNumber] || 4;
        }
        if(type == 3){
            parameter = unionId;
        }
        if(type == 4){
            parameter = Math.round(Math.random()*987)%3 + 1;
        }
        if(type == 6){
            parameter = Math.round(Math.random()*987)%3 + 1;
        }

        let durability = 0;
        let silver_total_number = 0;
        let gather_silver_speed =  0;
        let troops = [
            {
                "type": 1,
                "defense": 0,
                "count": 0,
                "attack": 0
            }
        ];
        let victory_occupy_reward = [
            {
                "type": 0,
                "name": "0",
                "count": 0
            }
        ];
        if(type !== 3 && type !== 6){
            let randomNumber = Math.round(Math.random()*9999)%12 + 2;
            durability = 2000 * randomNumber;
            gather_silver_speed = 2000 * (randomNumber - Math.round(Math.random()*9999)%2);
            silver_total_number = 100 * gather_silver_speed;

            let randomTroopsLen = Math.round(Math.random()*9999)%3 + 1;
            for(let i = 0; i++; i< randomTroopsLen){
                let attackValue = durability - (Math.round(Math.random()*987)%2 - 2) * 2000;
                troops.push({
                    "type": i + 1,
                    "defense": attackValue,
                    "count": durability/2,
                    "attack": attackValue
                });
            }
        }

        mapConfigLoot[x_id + "^" + y_id] = {
            "x": x,
            "y": y,
            "x_id": x_id,
            "y_id": y_id,
            "type": type,
            "parameter": parameter,
            "durability": durability,
            "buff_id": buffId,
            "area_block": area_block,
            "area": area,
            "troops": troops,
            "silver_total_number": silver_total_number,
            "gather_silver_speed": gather_silver_speed,
            "victory_occupy_reward": victory_occupy_reward
        }
    }
}

fs.writeFile('./maps-result/map_config_3.json', JSON.stringify(mapConfigLoot, null, ' \t'), function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("map_config_3 数据写入成功！");
});


function getIdIndex(x, y) {
    //cols = 11, rows = 21/41 + 1;
    //0,0 -> -10, 10
    return {
        x_id: (x - 5) * 2 + y % 2,
        y_id:  (rows - 2)/2 - y
    }
    // return {
    //     x_id: (x - 5) * 2 + y % 2,
    //     y_id: 10 - y
    // }
}