# 说明

## loot-gds 来源

https://github.com/shuise/lot-data 生成

## 生成 map-config

1. 根据 loot nft 配置 调整 createorMapConfigForLoot 并在 node 下运行
2. 修改 ../gds/map_list.json

## 更新游戏配置
通过 maps-result 中的结果更新

1. 配置放入 front/public/map-config
2. 修改 front/src/map/map_list.json


## 特殊逻辑
bg.json map.json 中 [i*22-1] == 0

## get image
let a = new Image(); a.src=document.querySelector('.App-seaon-map-canvas canvas').toDataURL(); document.appendChild(a);