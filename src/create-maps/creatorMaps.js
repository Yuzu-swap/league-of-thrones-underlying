'use strict';
var fs = require("fs");

let imageOrderMap = {
    '1_mountain_1': 1,
    '1_mountain_2': 2,
    '1_mountain_3': 3,
    '1_tree_1': 4,
    '1_tree_2': 5,
    '1_tree_3': 6,
    '2_mountain_1': 7,
    '2_mountain_2': 8,
    '2_mountain_3': 9,
    '2_tree_1': 10,
    '2_tree_2': 11,
    '2_tree_3': 12,
    '3_mountain_1': 13,
    '3_mountain_2': 14,
    '3_mountain_3': 15,
    '3_tree_1': 16,
    '3_tree_2': 17,
    '3_tree_3': 18,
    '4_mountain_1': 19,
    '4_mountain_2': 20,
    '4_mountain_3': 21,
    '4_tree_1': 22,
    '4_tree_2': 23,
    '4_tree_3': 24,
    'resource_1': 25,
    'resource_2': 26,
    'resource_3': 27,
    'gate': 28,
    '0_mountain_1': 29,
    '0_mountain_2': 30,
    '0_mountain_3': 31
};

let bgIndexMap = {
    '0-1': 1,
    '0-2': 2,
    '1-1': 3,
    '1-2': 4,
    '2-1': 5,
    '2-2': 6,
    '3-1': 7,
    '3-2': 8,
    '4-1': 9,
    '4-2': 10,
};

let types = {
    1: 'tree',
    11: '普通地块',
    2: '0',
    22: '中心城市',
    3: '0',
    33: '初始点',
    4: 'resource',
    44: '资源地块',
    5: 'gate',
    55: '关隘',
    6: 'mountain',
    66: '障碍'
};

var mapDir = '../league-of-thrones-data-sheets/.jsonoutput';
var mapList = require(mapDir + '/map_list.json')['Config'];
fs.readFile('./tpl-bg', 'utf8', (err, tplBg) => {
    if (err) {
        console.error(err);
        return;
    }

    fs.readFile('./tpl-map', 'utf8', (err, tplMap) => {
        if (err) {
            console.error(err);
            return;
        }
        // console.log(tplBg, tplMap);
        mapList.forEach(function(mapItem, index) {
            // console.log(mapItem);
            createMap(index, mapItem, tplBg, tplMap);
        });
        // console.log(mapList)
        fs.writeFile('./maps-result/map_list.json', JSON.stringify(mapList, null, ' \t'), function(err) {
            if (err) {
                return console.error(err);
            }
            console.log("map_list 数据写入成功！");
        });
    });
});

function createMap(index, mapItem, tplBg, tplMap) {
    let mapId = mapItem.map_id;
    var cols = mapItem.cols; //11
    var rows = mapItem.rows + 1;  //22;

    // console.log({ mapId, cols, rows });

    var blockMap = require(mapDir + '/map_config_' + mapId + '.json');

    let mapOrder = [];
    let mountains = {};
    let bgMap = {};
    let tileSetMap = {};

    for (var blockId in blockMap) {
        //item == {"y":1,"x":1,"cmap/area":3,"type":3,"level/parameter":3},
        /*
        type: 地块类型（1=普通地块；2=中心城市；3=初始点；4=资源地块；5=关隘；6=障碍）
        level: 
        地块类型=1时（1=低级树林；2=中级树林；3=高级树林；4=空地块）
        地块类型=3时配置相应的阵营（1西南,2东南,3西北,4东北）
        地块类型=4时配置相应的等级（1低级,2中级,3高级）
        地块类型=6时配置相应的等级（1低级,2中级,3高级）
        */
        let item = blockMap[blockId];
        let {
            x_id,
            y_id
        } = item;

        let image = '';
        if (item.type == 1) {
            image = item.area + '_' + types[item.type] + '_' + item.parameter;
        }
        if (item.type == 2) {
            image = 'map_center';
        }
        if (item.type == 3) {
            image = 'cmap_init';
        }
        if (item.type == 4) {
            image = types[item.type] + '_' + (item.parameter);
        }
        if (item.type == 5) {
            image = 'gate';
        }
        if (item.type == 6) {
            image = item.area + '_' + types[item.type] + '_' + (item.parameter || '0');
            mountains[blockId] = true;
        }
        item.image = image;

        let tileIndex = imageOrderMap[image] || 0;
        tileSetMap[blockId] = tileIndex;
        mapOrder.push(item);
        bgMap[blockId] = bgIndexMap[item.area + '-' + item.area_block] || 0;
    }


    let tileSet = [];
    let bgIndex = [];

    function getIdIndex(x, y) {
        //cols = 11, rows = 21/43;
        return {
            x_id: (x - 5) * 2 + y % 2,
            y_id:  (rows - 2)/2 - y
        }
        // return {
        //     x_id: (x - 5) * 2 + y % 2,
        //     y_id: 10 - y
        // }
    }

    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
            let r = getIdIndex(x, y);
            if(mapId !== 22 && r.y_id == -10){
                console.log({mapId, cols, rows }, '  ', r.x_id + '^' + r.y_id, bgMap[r.x_id + '^' + r.y_id], tileSetMap[r.x_id + '^' + r.y_id])                
            }
            tileSet.push(tileSetMap[r.x_id + '^' + r.y_id] || 0);
            bgIndex.push(bgMap[r.x_id + '^' + r.y_id] || 0)
        }
    }

    let content = {
        cols: cols,
        rows: rows - 1
    };
    content['dataset'] = JSON.stringify(bgIndex);
    let bgContent = subs(tplBg, content);

    fs.writeFile('./maps-result/bg-' + mapId + '.json', bgContent, function(err) {
        if (err) {
            return console.error(err);
        }
        console.log("bg 数据写入成功！");
    });

    content['dataset'] = JSON.stringify(tileSet);
    let mapContent = subs(tplMap, content);
    fs.writeFile('./maps-result/map-' + mapId + '.json', mapContent, function(err) {
        if (err) {
            return console.error(err);
        }
        console.log("map 数据写入成功！");
    });

    mapList[index].mountains = mountains;
}


function subs(temp, data, regexp) {
    if (!(Object.prototype.toString.call(data) === "[object Array]")) data = [data];
    var ret = [];
    for (var i = 0, j = data.length; i < j; i++) {
        ret.push(replaceAction(data[i]));
    }
    return ret.join("");

    function replaceAction(object) {
        return temp.replace(regexp || (/\\?\%{([^}]+)\}/g), function(match, name) {
            if (match.charAt(0) === '\\') return match.slice(1);
            return (object[name] !== undefined) ? object[name] : '';
        });
    }
}