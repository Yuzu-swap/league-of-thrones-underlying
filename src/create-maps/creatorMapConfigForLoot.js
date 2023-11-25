'use strict';
var fs = require("fs");

var mapDir = '../gds';
var buffTable = require(mapDir + '/buff_table.json')['Config'];
var lootGDS = require('./loot-gds.json');

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
var resourceNumber = 0;
var resourcePosition = {};
basePoints.forEach(function(v, index){
    if(v < 11){
        resourceNumber += 1;
        resourcePosition[Math.ceil(resourceNumber/10)] = index;
    }
})
resourceNumber = Math.ceil(resourceNumber/10);

var resourceIndexes = {};
for(var index in resourcePosition){
    resourceIndexes[resourcePosition[index]] = index;
}

/*
capitals + iinit 手工标准
city 来自于 city.text
center 待定
*/ 
var specialBlocks  = {
    capitals: [
        { x: 6, y: 18 },
        { x: 6, y: 9 },
        { x: 9, y: 9 },
        { x: 8, y: 35 },
        { x: 9, y: 22 },
        { x: 3, y: 33 }
    ],
    initCamps: [
        { x: 4, y: 39 },
        { x: 10, y: 40 },
        { x: 10, y: 0 },
        { x: 0, y: 18 }
    ],
    center: { x: 6, y: 18, x_id: 2, y_id: 2 },
    city: [
        { "x":6, "y":18, "isLittle":false },
        { "x":9, "y":22, "isLittle":false },
        { "x":6, "y":11, "isLittle":false },
        { "x":9, "y":36, "isLittle":false },
        { "x":9, "y":10, "isLittle":false },
        { "x":3, "y":33, "isLittle":false },
        { "x":1, "y":18 ,"isLittle":true },
        { "x":10 ,"y":24 ,"isLittle":true },
        { "x":7, "y":4 ,"isLittle":true },
        { "x":0, "y":5 ,"isLittle":true }
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

        let distance = getDistance(x, y);

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
        if(resourceIndexes[index]){
            type = 4;
        }
        specialBlocks.city.forEach(function(item, index){
            if(item['x'] == x && item['y'] == y){
                // if(item['isLittle']){
                    // type = 5;
                    type = 8;
                // }
            }
        });
        if(bgIndex == 11 || bgIndex == 12){
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
            // console.log(4444, { type, distance})
            parameter = Math.ceil(distance/7);
        }
        if(type == 6){
            //bgIndex = 11 -> 4; 12 -> 5; 
            parameter = bgIndex - 7;
        }

        // console.log('lootItem', type, distance);
        let lootItem = lootGDS[type + '-' + distance] || {
            "durability": 0,
            "buff_id": 1006,
            "area_block": 2,
            "area": 6,
            "troops": [
                {
                    "type": 1,
                    "defense": 0,
                    "count": 0,
                    "attack": 0
                }
            ],
            "silver_total_number": 0,
            "gather_silver_speed": 0,
            "victory_occupy_reward": [
                {
                    "type": 0,
                    "name": "0",
                    "count": 0
                }
            ]
        };
        parameter = lootItem['parameter'] || parameter;

        mapConfigLoot[x_id + "^" + y_id] = {
            "x": x,
            "y": y,
            "x_id": x_id,
            "y_id": y_id,
            "type": type,
            "distance": distance,
            "parameter": parameter,
            "area_block": area_block,
            "area": area,
            "durability": lootItem['durability'],
            "buff_id": lootItem['buff_id'],
            "troops": lootItem['troops'],
            "silver_total_number": lootItem['silver_total_number'],
            "gather_silver_speed": lootItem['gather_silver_speed'],
            "victory_occupy_reward": lootItem['victory_occupy_reward']
        }
    }
}

fs.writeFile('../gds/map_config_3.json', JSON.stringify(mapConfigLoot, null, ' \t'), function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("map_config_3 数据写入成功！");
});


function getDistance(x, y){
    var centerPoint = specialBlocks['center'];
    var distanceMax = 21;
    var d = Math.sqrt(Math.pow( centerPoint.x - x, 2) + Math.pow( centerPoint.y - y, 2));
    return Math.round(d)%distanceMax + 1;
}

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