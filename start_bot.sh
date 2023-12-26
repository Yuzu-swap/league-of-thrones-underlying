#!/bin/bash
# export YUZUSWAP_SECRET_KEY=leagueofthrones
#sh start.sh startIndex cnt seasonId


# 检查是否有三个参数传递给脚本
if [ $# -ne 3 ]; then
    echo "Usage: script.sh startIndex cnt seasonId"
    echo "Please provide exactly three arguments."
    exit 1
fi

startIndex=$1
cnt=$2
seasonId=$3
endIndex=$((startIndex + cnt - 1))


while true; do
pids=()

# 当脚本退出时，杀死所有子进程
trap "kill ${pids[*]}" EXIT

for i in $(seq $startIndex $endIndex); do
    echo "start $i $seasonId"
    WALLET_INDEX=$i SEASON_ID=$seasonId ts-node src/robot.ts >> logs/log_$3_$i.txt 2>&1 &
    pids+=($!)
done

# 等待所有后台任务完成
wait

done
