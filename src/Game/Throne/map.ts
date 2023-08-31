import { IComponent , ComponentType, Throne} from ".";
import { BattleType, General, GeneralAbility } from '../Logic/general'
import { City, RecruitStatus } from '../Logic/game'
import { Map } from "../Logic/map";
import { ITransContext, LocalMediator, IStatetWithTransContextCallback, ITransResult } from '../Controler/mediator'
import { StateTransition, CityFacility, ResouceType, StateName } from '../Const'
import { BaseMediator, IStateMediator, StateCallback } from '../../Core/mediator'
import { State, IState, IStateIdentity, copyObj } from '../../Core/state'
import { ConfigContainer } from '../../Core/config'
import { GetInitState, IBlockState, ICityState, IDefenderInfoState, IGeneralState, IMapGlobalState, ResouceInfo, validBlockIds, ITokenPriceInfoState } from '../State'
import {
  FacilityFortressGdsRow,
  FacilityMilitaryCenterGdsRow,
  FacilityWallGdsRow,
  FacilityStoreGdsRow,
  FacilityInfantryCampGdsRow,
  FacilityCavalryCampGdsRow,
  FacilityArcherCampGdsRow,
  FacilityTrainingCenterGdsRow,
  FacilityHomeGdsRow,
  FacilityGdsRow,
  GeneralGdsRow,
  BuffGdsRow
} from '../DataConfig';
// import mapGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config_0.json')
import { LogicEssential, createLogicEsential, StateEssential, ConfigEssential } from '../Logic/creator'
import { WebSocketMediator } from '../Controler/websocket'
import { callbackify } from 'util'
import { TransitionEventType } from "../Controler/transition";
import { getTimeStamp, setTimeOffset } from "../Utils";
import { MessageType } from "../Controler/Websocket/protocol";

export interface IMapComponent extends IComponent{
    attackBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void
    defenseBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void
    miningBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void
    cancelDefenseBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void
    getDefenseList(xId: number, yId: number, callback: (result: any) => void): Promise<void>
    getBlockInfo(xId: number, yId: number, callback: (result: any) => void): Promise<void>
    getInitBlockInfo(xId: number, yId: number, callback: (result: any) => void): Promise<void>
    getBlocksBelongInfo(): {}
    getSeasonStatus(callback: (result: any) => void) : Promise<void>
    getSeasonConfig():{}
    getSeasonRankResult(callback: (result: any) => void) :  Promise<void>
    getUnionWinInfo(callback: (result: any) => void): Promise<void>
    getExpectUnionReward(chainName: string, callback: (result: any) => void): Promise<void>
    getUnionOverView(callback: (result: any) => void): Promise<void>
}

export enum SeasonStatus{
    Reservation = 'reservation',
    Ready = 'ready',
    Open = 'open',
    End = 'end'
}

export class MapComponent implements IMapComponent{
    type: ComponentType;
    map: Map;
    mediator: IStateMediator<StateTransition, ITransContext>
    constructor(mediator: IStateMediator<StateTransition, ITransContext>) {
        this.type = ComponentType.General
        this.mediator = mediator
    }

    setMap(map: Map){
        this.map = map
        this.mediator.onReceiveState(
            {id : StateName.MapGlobalInfo}
            ,
            ()=>{
                this.map.boost.setMapBuff(this.map.getBuffList(Throne.instance().unionId))
            }
        )
    }

    onStateUpdate(callback: IStatetWithTransContextCallback): void {
        this.mediator.onReceiveState(
            {id : StateName.MapGlobalInfo}
            ,
            callback
        )
    }

    async getTokenPriceInfo(callback: (result: any) => void): Promise<void>{ 
        let tokenPriceInfo =  (await this.mediator.queryState({ id: `${StateName.TokenPriceInfo}`}, { }, null)) as ITokenPriceInfoState;
        console.log('updateTokenPriceInfo in map:', tokenPriceInfo);
        let result = this.createTokenPriceFormat(tokenPriceInfo);
        callback(result);
    }

    createTokenPriceFormat(tokenPriceInfo){
        let unions = {
            1: "BTC",
            2: "ETH",
            3: "USDT",
            4: "BNB"
        };
        let { current, initial } = tokenPriceInfo;

        let result = [];
        for(var id=1;id<5;id++){
            let name = unions[id];
            let v1 = initial[name]/1 || current[name]/1;
            let v2 = current[name]/1;
            let changeValue = Math.min((v2 - v1)/v1, 5);

            result.push({ id, name, changeValue, v1, v2});
        }
        return result;
    }

    genBlockIds(x_id: number, y_id: number):string[]{
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let re = []
        let centerid = `${StateName.BlockInfo}:${x_id}^${y_id}`
        if(validBlockIds.length == 0){
            let seasonState = this.map.getSeasonState();
            let mapId = seasonState.mapId;
            GetInitState(mapId, 'map.genBlockIds')
        }
        if(validBlockIds.indexOf(centerid) != -1){
            re.push(centerid)
        }
        for(let i = 0; i < 6; i++){
            let tempX = x_id + xOffset[i]
            let tempY = y_id + yOffset[i]
            let id = tempX + "^" + tempY
            let stateId = `${StateName.BlockInfo}:${id}`
            if(validBlockIds.indexOf(stateId) != -1){
                re.push( stateId)
            }
        }
        return re
    }

    async queryBlockStates(x_id : number , y_id : number){
        let idLists = this.genBlockIds(x_id, y_id)
        let blockStats =  await this.mediator.query(StateName.BlockInfo, { 'id' : {"$in":idLists} })
        this.map.loadBlockStates(blockStats)
    }

    getBlocksBelongInfo() {
        return this.map.getBlocksBelongInfo()
    }

    async getDefenseList(xId: number, yId: number, callback: (result: any) => void): Promise<void> {
        await this.queryBlockStates(xId, yId)
        let re = this.map.getDefenseList(xId, yId, true)
        let re1 = this.map.getDefenseList(xId, yId, false)
        let re2 = re.concat(re1)
        callback(re2)
    }

    attackBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.AttackBlock, {
            from: Throne.instance().username,
            x_id: xId,
            y_id: yId,
            generalId: generalId
        }, callback)
    }

    defenseBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.DefenseBlock, {
            from: Throne.instance().username,
            x_id: xId,
            y_id: yId,
            generalId: generalId
        }, callback)
    }
    
    cancelDefenseBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.CancelDefenseBlock, {
            from: Throne.instance().username,
            x_id: xId,
            y_id: yId,
            generalId: generalId
        }, callback)
    }

    miningBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.MiningBlock, {
            from: Throne.instance().username,
            x_id: xId,
            y_id: yId,
            generalId: generalId
        }, callback)
    }

    async getBlockInfo(xId: number, yId: number, callback: (result: any) => void): Promise<void> {
        await this.queryBlockStates(xId, yId)
        let row = copyObj(this.map.mapConfig.get(xId, yId))
        row['now_durability'] = this.map.getDurability(xId, yId)
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let defenseListLength = 0
        defenseListLength += this.map.getDefenseList(xId, yId, true).length
        defenseListLength += this.map.getDefenseList(xId, yId, false).length
        for(let i = 0; i < 6; i++){
            let tempX = xId + xOffset[i]
            let tempY = yId + yOffset[i]
            defenseListLength += this.map.getDefenseList(tempX, tempY, false).length
        }
        row['defense_list_len'] = defenseListLength
        row['protect_time'] = this.map.getProtectRemainTime(xId, yId)
        let blockState = this.map.getBlockState(xId, yId)
        row['belong'] = copyObj(blockState.belong)
        row['remainSilver'] = blockState.remainSilver
        callback(row)
    }

    async getInitBlockInfo(xId: number, yId: number, callback: (result: any) => void): Promise<void> {
        let row = copyObj(this.map.mapConfig.get(xId, yId))
        let blockState = copyObj(this.map.getBlockInitState(xId, yId)) as IBlockState
        row['now_durability'] = blockState.durability
        row['defense_list_len'] = blockState.defaultDefense.length
        row['protect_time'] = 0
        row['belong'] = copyObj(blockState.belong)
        row['remainSilver'] = blockState.remainSilver
        callback(row)
    }

    async getSeasonRankResult(callback: (result: any) => void): Promise<void> {
        let defenseList = (await this.mediator.query( StateName.DefenderInfo, {'$orderBy': '-glory'})) ?? []
        let re = []
        const rankReward = this.map.genRankResultList()
        let rewardIndex = 0
        let reward = rankReward[rewardIndex]
        for(let i in defenseList){
            if( parseInt(i) + 1  > reward.end){
                rewardIndex++
                if(rewardIndex >= rankReward.length){
                    break
                }
                reward = rankReward[rewardIndex]
            }
            let temp = {
                username : defenseList[i]['username'],
                unionId : defenseList[i]['unionId'],
                glory: defenseList[i]['glory'],
                reward: {
                    type: reward.type,
                    name: reward.name,
                    count: reward.count
                }
            }
            re.push(temp)
        }
        callback(re)
    }

    async getSeasonStatus(callback: (result: any) => void): Promise<void> {
        let re = this.map.getSeasonStatus()
        callback(re)
    }
    getSeasonConfig(): {} {
        let seasonState = this.map.getSeasonState()
        return seasonState;
    }   

    async getUnionWinInfo(callback: (result: any) => void): Promise<void>{
        await this.queryBlockStates(0, 0)
        let re = this.map.checkUnionWin()
        delete re.unionWin
        callback(re)
    }

    async getEndSeasonParameters(winUnion: number ): Promise<any>{
        let defenseList : IDefenderInfoState[] = (await this.mediator.query( StateName.DefenderInfo, {'$orderBy': '-glory', "$limit": 20}))
        let unionList : IDefenderInfoState[] = (await this.mediator.query( StateName.DefenderInfo, { "unionId": winUnion, '$orderBy': '-glory' } ))
        let addressList = []
        let gloryList = []
        let unionSumGlory = 0 
        for( let item  of defenseList ){
            addressList.push(item.username)
            gloryList.push(item.glory)
        }
        for( let item of unionList ){
            unionSumGlory += item.glory
            if(addressList.indexOf(item.username) == -1){
                addressList.push(item.username)
                gloryList.push(item.glory)
            }
        }
        let re = {
            addressList : addressList,
            gloryList : gloryList,
            unionSumGlory : unionSumGlory
        }
        return new Promise(
            (resolve, reject) =>{
                resolve(re)
            }
        )
    }

    async getExpectUnionReward(chainName: string, callback: (result: any) => void): Promise<void> {
        let unionId = Throne.instance().unionId
        let unionSum = this.map.rewardGlobalState.unionGlorySumRuntime[unionId - 1];
        let chains = {
            'emerald' : 1,
            'bsctest' : 2,
            'bsc' : 3
        };
        let index = chains[chainName];
        let rewardSum = this.map.seasonConfig.get(index).show_season_victory_reward[0].count;
        let re = {
            topInfo: [],
            myInfo: {}
        }
        if(unionSum == 0){
            callback(re)
        }
        else{
            let unionList : IDefenderInfoState[] = (await this.mediator.query( StateName.DefenderInfo, { "unionId": unionId , '$orderBy': '-glory' , "$limit": 20} ))
            let rank = -1
            rank = await this.mediator.defaultQuery( MessageType.QueryCount, StateName.DefenderInfo, {"unionId": unionId , "glory":{"$gt":  this.map.general.state.glory}})
            for(let i in unionList){
                let item = {
                    username: unionList[i].username,
                    unionId: unionId,
                    glory: unionList[i].glory,
                    rank: parseInt(i) + 1,
                    reward:  unionList[i].glory / unionSum * rewardSum
                }
                re.topInfo.push(item)
            }
            re.myInfo = {
                username: Throne.instance().username,
                unionId: unionId,
                glory: this.map.general.state.glory,
                rank: rank + 1,
                reward:  this.map.general.state.glory / unionSum * rewardSum
            }
            callback(re)
        }
    }

    async getUnionOverView(callback: (result: any) => void): Promise<void> {
        let re = [[], [], [], []]
        re[0] = (await this.mediator.query( StateName.DefenderInfo, { "unionId": 1 , '$orderBy': '-glory'} ))
        re[1] = (await this.mediator.query( StateName.DefenderInfo, { "unionId": 2 , '$orderBy': '-glory'} ))
        re[2] = (await this.mediator.query( StateName.DefenderInfo, { "unionId": 3 , '$orderBy': '-glory'} ))
        re[3] = (await this.mediator.query( StateName.DefenderInfo, { "unionId": 4 , '$orderBy': '-glory'} ))
        callback(re)
    }
}