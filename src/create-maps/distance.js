'use strict';
var fs = require("fs");

function calDistanceAll(){
    var centerPoint = { x: 6, y: 18, x_id: 2, y_id: 2 };
    let centerX = centerPoint['x_id'];
    let centerY = centerPoint['y_id'];
    let centerIds = centerX + '^' + centerY;
    let dMap = {
        [centerIds]: 0
    };
    let distanceMax = 22;
    for(let i =1; i<distanceMax; i++){
        // console.log(i, dMap)
        for(var newCenter in dMap){
            setCirclePoints(newCenter, i);
        }
    }

    function setCirclePoints(newCenter, distance){
        const xOffset = [ 0, 1, 1, 0, -1, -1];
        const yOffset = [ 2, 1, -1, -2, -1, 1];

        let _centerIds = newCenter.split('^');
        let _centerX = _centerIds[0]/1;
        let _centerY = _centerIds[1]/1;

        for(let i = 0; i < 6; i++){
            let newXYindex = (_centerX + xOffset[i]) + '^' + (_centerY + yOffset[i]);
            if(!dMap.hasOwnProperty(newXYindex)){
                dMap[newXYindex] = distance;                
            }
        }
    }
    return dMap;
}
var result = calDistanceAll();

fs.writeFile('./maps-result/distance.json', JSON.stringify(result, null, ' \t'), function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("distance  数据写入成功！");
});

