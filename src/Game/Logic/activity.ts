import { copyObj } from "../../Core/state";
import { ResouceType } from "../Const";
import { ActivityTypeConfig, ActivityTypeConfigFromGDS, SeasonConfig, SeasonConfigFromGDS } from "../DataConfig";
import { ActivityData, IActivityState } from "../State";
import { getTimeStamp, indexOfSortedList, parseStateId } from "../Utils";
import { IBoost } from "./boost";
import { City } from "./game";

export interface ActivityInfo{
    activityId: number
    type: number
    totalReward: number
    startTime: number
    lastTime: number
}

export class Activity{
    seasonGDS : SeasonConfig
    activityGDS : ActivityTypeConfig
    state: IActivityState
    rewardNumber: number
    city: City
    boost: IBoost
    constructor(state: IActivityState){
        this.state = state
        this.seasonGDS = SeasonConfigFromGDS
        this.activityGDS = ActivityTypeConfigFromGDS
        this.rewardNumber = 200
    }

    setCity(city: City){
        this.city = city
    }

    setBoost(boost: IBoost){
        this.boost = boost
    }

    getActivityConfig(){
        return this.seasonGDS.get(1).activities
    }

    getActivityInfo(id: number){
        let activities = this.getActivityConfig()
        if(id < 0 || id >= activities.length){
            throw "activity id error"
        }
        let act = activities[id]
        let row = this.activityGDS.get(act.type)
        let info : ActivityInfo = {
            activityId : id,
            type : act.type,
            startTime: act.startTime,
            totalReward: row.activity_pond,
            lastTime: row.activity_last * 60 * 60
        }
        return info
    }

    checkActivityAble(id: number){
        const time = getTimeStamp()
        const info = this.getActivityInfo(id)
        if(time >= info.startTime && time < info.startTime + info.lastTime){
            return true
        }
        else{
            return false
        }
    }

    getAbleActivities(){
        let activities = this.getActivityConfig()
        let re : ActivityInfo[] = []
        for(let i = 0; i < activities.length; i++){
            if(this.checkActivityAble(i)){
                re.push(this.getActivityInfo(i))
            }
        }
        return re
    }

    getBeforeActivities(){
        let activities = this.getActivityConfig()
        let re : ActivityInfo[] = []
        const time = getTimeStamp()
        for(let i = 0; i < activities.length; i++){
            const info = this.getActivityInfo(i)
            if(time > info.startTime){
                re.push(this.getActivityInfo(i))
            }
        }
        return re
    }

    addDataToActivity(id: number, username: string, oldValue: number , newValue: number){
        if(!this.checkActivityAble(id)){
            return {
                result: false,
                error: "activity-is-not-able:id:" + id 
            }
        }
        let insert: ActivityData = {
            username: username,
            value: newValue
        }
        let list = copyObj(this.state.activityData[id]) as ActivityData[]
        let sumValue = this.state.sumValue[id]
        do{
            if(list.length == 0){
                list.push(
                    insert
                )
                sumValue = newValue
                break
            }
            let origin = indexOfSortedList(list, username, oldValue, 'value')
            if(origin.exist){
                list.splice(origin.index, 1)
                sumValue = sumValue - oldValue
            }
            let newInfo = indexOfSortedList(list, username, newValue, 'value')
            list.splice(newInfo.index, 0, insert)
            sumValue = sumValue + newValue
            if(list.length > 200){
                sumValue -= list[list.length - 1].value
            }
        }while(false)
        let data = this.state.activityData
        data[id] = list
        let sumValueList = this.state.sumValue
        sumValueList[id] = sumValue
        this.state.update(
            {
                'activityData' : data,
                'sumValue' : sumValueList
            }
        )
        return {
            result: true
        }
    }

    getActivityRank(id: number, username: string, value: number){
        const list = this.state.activityData[id]
        let origin = indexOfSortedList(list, username, value, 'value')
        let info = this.getActivityInfo(id)
        let rank = -1
        let rankReward = 0
        if(origin.exist){
            rank =  origin.index + 1
        }
        if(rank != -1){
            rankReward = info.totalReward * value / this.state.sumValue[id]
        }
        return {rank, rankReward }
    }

    donateSilver(id: number, amount: number){
        if(!this.checkActivityAble(id)){
            return {
                result: false,
                error: "activity-is-not-able:id:" + id 
            }
        }
        let info = this.getActivityInfo(id)
        if(info.type != 3){
            return{
                result: false,
                error: "activity-type-error" 
            }
        }
        let oldValue = this.city.getActivityData(id)
        if(!this.city.useSilver(amount)){
            return {
                result: false,
                error: 'silver-is-not-enough'
            }
        }
        let newValue = 0
        if(oldValue == -1){
            newValue = amount
        }
        else{
            newValue = oldValue + amount
        }
        this.addDataToActivity(id, parseStateId(this.city.state.id).username, oldValue, newValue)
        this.city.setActivityData(id, newValue)
        let rankInfo = this.getActivityRank(id, parseStateId(this.city.state.id).username, newValue)
        return{
            result: true,
            donateAmount: newValue,
            rank: rankInfo.rank,
            rankReward: rankInfo.rankReward
        }
    }

    updateAbleActivities(){
        let list = this.getAbleActivities()
        for(let item of list){
            if(item.type == 3){
                continue
            }
            let oldValue = this.city.getActivityData(item.activityId)
            let newValue = 0
            if(item.type == 1){
                newValue = this.boost.getProduction(ResouceType.Silver)
            }
            else if(item.type == 2){
                newValue = this.boost.getProduction(ResouceType.Troop)
            }
            this.addDataToActivity(item.activityId, parseStateId(this.city.state.id).username, oldValue, newValue)
            this.city.setActivityData(item.activityId, newValue)
        }
    }
}