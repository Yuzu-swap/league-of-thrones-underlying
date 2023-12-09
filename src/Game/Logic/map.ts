import { copyObj } from "../../Core/state";
import { StateName, StateTransition } from "../Const";
import { BattleRecordType, BattleTransRecord } from "../Controler/transition";
import { GenBlockDefenseTroop, MapConfig, getMapConfigFromGDS, MapGDS, getMapOffset, Parameter, parameterConfig, RankReward, SeasonConfig, SeasonConfigFromGDS } from "../DataConfig";
import { BelongInfo, BlockDefenseInfo, CampInfo, IBlockState, IMapGlobalState, InitState, IRewardGlobalState, ISeasonConfigState, ITokenPriceInfoState, RewardResult } from "../State";
import { SeasonStatus } from "../Throne/map";
import { getTimeStamp, getTxHash, parseStateId } from "../Utils";
import { IBoost } from "./boost";
import { BattleResult, BattleType, DefenseInfo, General } from "./general";
import { City } from "./game";

const DefaultTroopRecoverTime = 60 * 30
const DurabilityRecoverTime = 60 * 30

export enum UnionWinStatus {
    Normal = 'Normal',
    WaitToWin = 'WaitToWin',
    HaveWin = 'HaveWin'
}

export interface innerCancelBlockDefense{
    generalId: number,
    username: string
}

export class Map{
    gState: IMapGlobalState
    blockStates:{[key: string]: IBlockState} 
    mapId: number
    mapConfig: MapConfig
    seasonState: ISeasonConfigState
    tokenPriceInfo: ITokenPriceInfoState
    seasonConfig: SeasonConfig
    rewardGlobalState : IRewardGlobalState
    parameter: Parameter
    boost: IBoost
    general: General
    city: City
    mapOffset: any
    constructor( 
        gState: IMapGlobalState, 
        seasonState: ISeasonConfigState, 
        rewardGlobalState : IRewardGlobalState,
        tokenPriceInfo : ITokenPriceInfoState ){
        this.gState = gState
        this.blockStates = {}

        let mapId = seasonState.mapId;
        this.mapId = mapId;
        this.mapConfig = getMapConfigFromGDS(mapId);
        this.mapOffset = getMapOffset(mapId);
        
        this.parameter = parameterConfig
        this.seasonConfig = SeasonConfigFromGDS
        this.seasonState = seasonState
        this.tokenPriceInfo = tokenPriceInfo
        this.rewardGlobalState = rewardGlobalState
    }
    setBoost(boost:IBoost){
        this.boost = boost
    }

    setGeneral(general){
        this.general = general
    }

    setCity(city: City){
        this.city = city
    }

    getMapGDS(x_id: number, y_id: number){
        return this.mapConfig.get(x_id, y_id)
    }

    loadBlockStates( states : IBlockState[] ){
        for(let state of states){
            let x_id = state.x_id
            let y_id = state.y_id
            this.blockStates[x_id + "^" + y_id] = state
        }
    }

    getBlockState( x_id: number, y_id: number){
        return this.blockStates[ x_id + "^" + y_id ]
    }

    getBlockInitState(x_id: number, y_id: number){
        let mapId = this.mapId;
        const state = InitState[`${StateName.BlockInfo}:${mapId}:${x_id}^${y_id}`]
        return state
    }

    getBlockBaseInfo(x_id: number, y_id: number){
        /*
        this.mapOffset.x = 10;
        this.mapOffset.y = 20;
        x_id,t_id - > xIndex, yIndex;
        9,9 -> 9,11
        -3,1 -> 6,19
        -3,-1 -> 6,21
        -2,2 -> 6, 18
        */
        // let xIndex = x_id + this.mapOffset.x;
        // let yIndex = Math.floor((y_id + this.mapOffset.y) / 2)

        let mapId = this.mapId;
        let campInfoKey = 'campInfo_' + mapId;
        let campInfo = this.gState[campInfoKey] || [];

        let yIndex = this.mapOffset.y - y_id;
        let xIndex = (this.mapOffset.x + x_id - Math.abs(x_id%2))/2;
        return {
            xIndex,
            yIndex,
            campInfoKey,
            campInfo
        }
    }

    getBelongInfo(x_id: number, y_id: number): number{
        // let xIndex = x_id + this.mapOffset.x;
        // let yIndex = Math.floor((y_id + this.mapOffset.y) / 2)
        // if(xIndex < 0 || yIndex < 0){
        //     return 0
        // }
        // let campInfo = this.gState[campInfoKey] || [];
        // if(campInfo.length > xIndex && campInfo[xIndex].length > yIndex ){
        //     return campInfo[xIndex][yIndex].unionId
        // }

        let { xIndex, yIndex, campInfo } = this.getBlockBaseInfo(x_id, y_id);
        if(xIndex < 0 || yIndex < 0){
            return 0;
        }
        if(campInfo.length > yIndex && campInfo[yIndex].length > xIndex ){
            // console.log('getBelongInfo ', campInfo[yIndex], {x_id, y_id }, {yIndex, xIndex});
            // console.log('getBelongInfo ', campInfo[yIndex][xIndex]);
            return campInfo[yIndex][xIndex].unionId
        }
        return 0
    }

    getBlockBattleStatus(x_id: number, y_id: number): CampInfo {
        // let mapId = this.mapId;
        // let campInfoKey = 'campInfo_' + mapId;
        // let xIndex = x_id + this.mapOffset.x;
        // let yIndex = Math.floor((y_id + this.mapOffset.y) / 2)
        // let defalutRe : CampInfo ={
        //     unionId: 0,
        //     attackEndTime: -1,
        //     protectEndTime: -1
        // }
        // if(xIndex < 0 || yIndex < 0){
        //     return defalutRe
        // }
        // let campInfo = this.gState[campInfoKey] || [];
        // if(campInfo.length > xIndex && campInfo[xIndex].length > yIndex ){
        //     return campInfo[xIndex][yIndex]
        // }

        let { xIndex, yIndex, campInfo } = this.getBlockBaseInfo(x_id, y_id);
        let defalutRe : CampInfo ={
            unionId: 0,
            attackEndTime: -1,
            protectEndTime: -1
        }
        if(xIndex < 0 || yIndex < 0){
            return defalutRe
        }
        if(campInfo.length > yIndex && campInfo[yIndex].length > xIndex ){
            return campInfo[yIndex][xIndex]
        }
        return defalutRe
    }

    changeBelongInfo(x_id: number, y_id: number, unionId: number, protectEnd: number){
        // let mapId = this.mapId;
        // let campInfoKey = 'campInfo_' + mapId;
        // let xIndex = x_id  + this.mapOffset.x;
        // let yIndex = Math.floor((y_id  + this.mapOffset.y) / 2)
        // let infoMap = this.gState[campInfoKey] || [];
        // infoMap[xIndex][yIndex].unionId = unionId
        // infoMap[xIndex][yIndex].protectEndTime = protectEnd
        // this.gState.update(
        //     {
        //         [campInfoKey]: infoMap
        //     }
        // )

        let { xIndex, yIndex, campInfoKey, campInfo } = this.getBlockBaseInfo(x_id, y_id);
        campInfo[yIndex][xIndex].unionId = unionId
        campInfo[yIndex][xIndex].protectEndTime = protectEnd
        this.gState.update(
            {
                [campInfoKey]: campInfo
            }
        )
    }

    changeGlobalLastAttack( x_id: number, y_id: number, attackEnd: number){
        // let mapId = this.mapId;
        // let campInfoKey = 'campInfo_' + mapId;
        // let xIndex = x_id  + this.mapOffset.x;
        // let yIndex = Math.floor((y_id  + this.mapOffset.y) / 2)
        // let infoMap = this.gState[campInfoKey] || [];
        // infoMap[xIndex][yIndex].attackEndTime = attackEnd
        // this.gState.update(
        //     {
        //         [campInfoKey]: infoMap
        //     }
        // )

        let { xIndex, yIndex, campInfoKey, campInfo } = this.getBlockBaseInfo(x_id, y_id);
        campInfo[yIndex][xIndex].attackEndTime = attackEnd
        this.gState.update(
            {
                [campInfoKey]: campInfo
            }
        )
    }

    getAllMyHarbors(unionId){
        //get data base on 
        let allMyHarbors = [];
        let { xIndex, yIndex, campInfoKey, campInfo } = this.getBlockBaseInfo(1, 1);
        for(let item of campInfo){
            for(let subItem of item){
                //harbor + capital sit by ocean + river;
                let isHarbor = subItem['type'] === 8 || (subItem['type'] == 2 && subItem['parameter'] == 14);
                if(isHarbor && subItem['unionId'] === unionId){
                    allMyHarbors.push(subItem);
                }
            }
        }

        return allMyHarbors;
    }

    checkBetween(unionId : number, x_id: number, y_id: number){
        let allMyHarbors = this.getAllMyHarbors(unionId);
        let { campInfo } = this.getBlockBaseInfo(x_id, y_id);
        let isTargetBlockIsHarbor = campInfo['type'] === 8 || (campInfo['type'] == 2 && campInfo['parameter'] == 14);


        console.log('checkBetween:', { campInfo, unionId, isTargetBlockIsHarbor });
        console.log('checkBetween allMyHarbors:', allMyHarbors);
        
        //only attack non-occupy-harbor when own a harbor
        if(allMyHarbors.length > 0 && isTargetBlockIsHarbor && campInfo.unionId !== unionId){
            return true;
        }

        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let re = false
        for(let i = 0; i < 6; i++){
            let tempX = x_id + xOffset[i]
            let tempY = y_id + yOffset[i]
            if(this.getBelongInfo(tempX, tempY) == unionId){
                re = true
            }
        }
        return true
    }

    defenseBlock(x_id: number, y_id: number, info : BlockDefenseInfo ){
        let blockState = this.getBlockState(x_id, y_id)
        let defenseList = blockState.defenseList
        defenseList.push(info)
        blockState.update(
            {
                'defenseList': defenseList
            }
        )
    }

    cancelDefenseBlock( x_id: number, y_id: number, username: string, generalId: number){
        let blockState = this.getBlockState(x_id, y_id)
        let defenseList = blockState.defenseList
        let remainTroop = 0
        for(let i = 0; i< defenseList.length; i++){
            if(defenseList[i].username == username && defenseList[i].generalId == generalId){
                remainTroop = defenseList[i].troops
                defenseList.splice(i, 1)
                break
            }
        }
        blockState.update(
            {
                'defenseList': defenseList
            }
        )
        return remainTroop
    }

    getDefenseList( x_id: number, y_id: number, defaultDefense : boolean){
        let time = getTimeStamp()
        let blockState = this.getBlockState(x_id, y_id)
        if(!blockState){
            return []
        }

        let mapId = this.mapId;
        if(defaultDefense){
            if(time - blockState.lastAttachTime > DefaultTroopRecoverTime){
                return GenBlockDefenseTroop(x_id, y_id, mapId)
            }
            else{
                return blockState.defaultDefense
            }
        }
        else{
            return blockState.defenseList
        }
    }

    transBlockDefenseInfoToGeneralDefense( info: BlockDefenseInfo ){
        let re : DefenseInfo = {
            generalId : info.generalId,
            generalLevel: info.generalLevel,
            generalType: info.generalType,
            attack: info.attack,
            defense: info.defense,
            troop: info.troops,
            silver: 0,
            defenseMaxTroop: info.troops
        }
        return re
    }

    checkIfCanAttack( x_id: number, y_id: number ){
        let blockState = this.getBlockState(x_id, y_id);
        let blockInfo = this.getMapGDS(x_id, y_id)
        console.log('getBlockState:', { x_id, y_id }, blockState, blockInfo);

        let isMont = blockInfo.type === 6;
        if(isMont){
            return false
        }
        let time = getTimeStamp();
        if(blockState.belong.updateTime == -1 || time - blockState.belong.updateTime > this.parameter.occupy_block_protect_times){
            return true
        }
        return false
    }

    getProtectRemainTime(x_id: number, y_id: number){
        let blockState = this.getBlockState(x_id, y_id)
        let time = getTimeStamp();
        if(blockState.belong.updateTime == -1 || time - blockState.belong.updateTime > this.parameter.occupy_block_protect_times){
            return 0
        }
        return blockState.belong.updateTime + this.parameter.occupy_block_protect_times - time
    }

    attackBlocksAround(x_id: number, y_id: number, generalId: number, remainTroop: number, isCod: boolean, onBelongChange: () => void){
        if(!this.checkIfCanAttack(x_id, y_id)){
            return {
                result: false,
                error: 'block-is-be-protected'
            }
        }

        let stamina = this.parameter.attack_plots_need_stamina;
        if(!isCod && !(this.general.useGeneralStamina(generalId, stamina))){
            return{
                result: false,
                error: 'general-stamina-error'
            }
        }
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let centerBlockState = this.getBlockState(x_id, y_id)
        const unionId = centerBlockState.belong.unionId
        let records = []
        let cancelList = []
        // let remainTroop = -1
        let isAttackNeighbor = false;
        let re = this.attackBlock(x_id, y_id, generalId, remainTroop, isAttackNeighbor, isCod)
        console.log('attackBlocksAround block state:', {x_id, y_id, isCod }, centerBlockState)
        console.log('attackBlocksAround result:', { isCod },  re)
        if(re['error']){
            return re
        }
        cancelList = cancelList.concat(re['cancelList'])
        records = records.concat(re['records'])
        remainTroop = re['remainTroop']
        if(unionId != 0 && remainTroop > 0){
            let attackTroops = remainTroop + 0;
            for(let i = 0; i < 6; i++){
                if(attackTroops <=0 ){
                    break
                }
                let tempX = x_id + xOffset[i]
                let tempY = y_id + yOffset[i]
                let tempBlockState = this.getBlockState(tempX, tempY)
                if(tempBlockState && tempBlockState.belong.unionId == unionId && attackTroops > 0){
                    console.log('attackBlock Around block going:', { x_id, y_id }, {unionId, tempX, tempY, generalId, attackTroops}, ' blockInfo:',  tempBlockState);
                    let isAttackNeighbor = true;
                    let tempRe = this.attackBlock(tempX, tempY, generalId, attackTroops, isAttackNeighbor, isCod)
                    if(tempRe['error']){
                        return tempRe
                    }
                    cancelList = cancelList.concat(tempRe['cancelList'])
                    records = records.concat(tempRe['records'])
                    attackTroops = tempRe['remainTroop']
                }
            }
        }
        
        let durabilityReduce = 0
        if(remainTroop > 0){
            durabilityReduce = this.reduceDurability(x_id, y_id, remainTroop, this.general.state.unionId, onBelongChange)      
            if(records.length != 0){
                let lastRecord = records[records.length - 1] as BattleTransRecord
                let newRecord = JSON.parse(JSON.stringify(lastRecord));
                newRecord.attackInfo.gloryGet += Math.floor(durabilityReduce / 50)
                newRecord.blockInfo.durabilityReduce = durabilityReduce;
                records.push(newRecord);
            }
        }
        return {
            records: records,
            cancelList: cancelList,
            durabilityReduce: durabilityReduce
        }
    }

    recoveryBlockDefense(x_id: number, y_id: number){
        let blockState = this.getBlockState(x_id, y_id);
        let time = parseInt(new Date().getTime() / 1000 + '');
        if(time - blockState.lastAttachTime < DefaultTroopRecoverTime){
            console.log('attackBlock recoveryBlockDefense fail:', time);
            return;
        }
        let mapId = this.mapId;
        let defaultDefense = GenBlockDefenseTroop(x_id, y_id, mapId);
        blockState.update({
            'defaultDefense': defaultDefense,
            'lastAttachTime': time
        })
        // this.changeGlobalLastAttack(x_id, y_id, time + DefaultTroopRecoverTime)
        console.log('attackBlock recoveryBlockDefense ok:', {x_id, y_id}, blockState);
    }

    attackBlock( x_id: number, y_id: number, generalId: number, remainTroop: number = -1, isAttackNeighbor: boolean, isCod: boolean){
        //attack order: playerTroops > defaultDefense > duration
        //isAttackNeighbor only attack playerTroops;
        console.log('attackBlock args:', {x_id, y_id, generalId, remainTroop});
        this.recoveryBlockDefense(x_id, y_id);

        let time = parseInt(new Date().getTime() / 1000 + '');
        let blockState = this.getBlockState(x_id, y_id)
        let list : BattleTransRecord[] = []
        let generalRow = this.general.getGeneralQualification(generalId)
        if(remainTroop == -1){
            remainTroop = this.general.getMaxAttackTroop()
        }

        let isDefaultDefense = false;
        let playerDefenseTroops = this.getDefenseList(x_id, y_id, isDefaultDefense);
        let cancelList : innerCancelBlockDefense[] = [];
        if(playerDefenseTroops.length > 0){
            for(let i = 0; i < playerDefenseTroops.length; i++){
                let info = this.transBlockDefenseInfoToGeneralDefense(playerDefenseTroops[i])
                let unionId = this.general.state.unionId;
                let unionIds = {
                  attackUnionId: unionId, 
                  defenseUnionId: playerDefenseTroops[i].unionId
                };
                let useStamina = false;
                let bre = this.general.battle(generalId, unionIds, info, remainTroop, useStamina)
                if(!isCod){
                    this.city.useTroop(bre['attackTroopReduce'])
                    this.city.updateInjuredTroops(bre['attackTroopReduce'],'battle')   
                }
                console.log('updateInjuredTroops battle result:', { isCod }, bre)
                
                if(!bre['result']){
                    return bre
                }else{
                    bre = bre as BattleResult
                    let battleRecord : BattleTransRecord= {
                        attackInfo : {
                            username:  parseStateId(this.general.state.getId()).username,
                            generalId: generalId,
                            generalLevel: this.general.getGeneralLevel(generalId),
                            generalType: generalRow.general_type,
                            troopReduce: bre.attackTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.attackGloryGet,
                            unionId: unionId,
                            iconId: this.general.state.iconId
                        },
                        defenseInfo: {
                            username:  playerDefenseTroops[i].username,
                            generalId: info.generalId,
                            generalLevel: info.generalLevel,
                            generalType: info.generalType,
                            troopReduce: bre.defenseTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.defenseGloryGet,
                            unionId: playerDefenseTroops[i].unionId,
                            iconId: playerDefenseTroops[i].iconId
                        },
                        leader: '',
                        recordType: isCod ? BattleRecordType.Assembly : BattleRecordType.Block,
                        timestamp: getTimeStamp(),
                        blockInfo:{
                            x_id: x_id,
                            y_id: y_id,
                            durabilityReduce: 0
                        },
                        txHash: getTxHash(),
                        result: bre.win
                    }
                    list.push(battleRecord)
                    if( bre.win ){
                        cancelList.push({
                            generalId: playerDefenseTroops[i].generalId,
                            username: playerDefenseTroops[i].username
                        })
                        playerDefenseTroops.shift()
                        i--
                        remainTroop -= bre.attackTroopReduce
                    }else{
                        playerDefenseTroops[i].troops -= bre.defenseTroopReduce
                        remainTroop -= bre.attackTroopReduce
                        break
                    }
                }
            }
            blockState.update({
                'defenseList': playerDefenseTroops
            });
            this.changeGlobalLastAttack(x_id, y_id, time + DefaultTroopRecoverTime)
        }
        if(remainTroop <= 0 || isAttackNeighbor){
            return {
                records: list,
                cancelList: cancelList,
                remainTroop: remainTroop
            }
        }

        //attack defaultDefense
        if(!isAttackNeighbor){
            let isDefaultDefense = true;
            let defaultDefense = this.getDefenseList(x_id, y_id, isDefaultDefense);
            for(let i = 0; i < defaultDefense.length; i++){
                let info = this.transBlockDefenseInfoToGeneralDefense(defaultDefense[i])
                let unionId = this.general.state.unionId;
                let unionIds = {
                  attackUnionId: unionId, 
                  defenseUnionId: 0
                };
                let useStamina = false;
                let bre = this.general.battle(generalId, unionIds, info, remainTroop, useStamina);
                if(!isCod){
                    this.city.useTroop(bre['attackTroopReduce'])
                    this.city.updateInjuredTroops(bre['attackTroopReduce'], 'battle')   
                }
                console.log('updateInjuredTroops battle result:', { isCod }, bre)

                if(!bre['result']){
                    return bre
                }
                else{
                    bre = bre as BattleResult
                    let battleRecord : BattleTransRecord= {
                        attackInfo : {
                            username: parseStateId(this.general.state.getId()).username ,
                            generalId: generalId,
                            generalLevel: this.general.getGeneralLevel(generalId),
                            generalType: generalRow.general_type,
                            troopReduce: bre.attackTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.attackGloryGet,
                            unionId: unionId,
                            iconId: this.general.state.iconId
                        },
                        defenseInfo: {
                            username: '',
                            generalId: info.generalId,
                            generalLevel: info.generalLevel,
                            generalType: info.generalType,
                            troopReduce: bre.defenseTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.defenseGloryGet,
                            unionId: 0,
                            iconId: -1
                        },
                        leader: '',
                        recordType: isCod ? BattleRecordType.Assembly : BattleRecordType.Block,
                        timestamp: getTimeStamp(),
                        blockInfo:{
                            x_id: x_id,
                            y_id: y_id,
                            durabilityReduce: 0
                        },
                        txHash: getTxHash(),
                        result: bre.win
                    }
                    list.push(battleRecord)
                    if( bre.win ){
                        defaultDefense.shift()
                        i--
                        remainTroop -= bre.attackTroopReduce
                    }
                    else{
                        defaultDefense[i].troops -= bre.defenseTroopReduce
                        remainTroop -= bre.attackTroopReduce
                        break
                    }
                }
            }
            blockState.update({
                'defaultDefense': defaultDefense,
                'lastAttachTime': time
            })
            this.changeGlobalLastAttack(x_id, y_id, time + DefaultTroopRecoverTime)
        }

        return {
            records: list,
            cancelList: cancelList,
            remainTroop : remainTroop
        }
    }

    _attackBlocksAroundCod(x_id: number, y_id: number, generalId: number, remainTroop: number, onBelongChange: () => void){
        if(!this.checkIfCanAttack(x_id, y_id)){
            return {
                result: false,
                txType: StateTransition.AttackBlock,
                error: 'block-is-be-protected'
            }
        }

        // cod battle
        // let stamina = this.parameter.attack_plots_need_stamina;
        // if(!(this.general.useGeneralStamina(generalId, stamina))){
        //     return{
        //         result: false,
        //         txType: StateTransition.AttackBlock,
        //         error: 'general-stamina-error'
        //     }
        // }
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let centerBlockState = this.getBlockState(x_id, y_id)
        const unionId = centerBlockState.belong.unionId
        let records = []
        let cancelList = []
        // let remainTroop = -1
        let re = this._attackBlockCod(x_id, y_id, generalId, remainTroop);
        console.log('attackBlocksAroundCod result 1:', remainTroop, re);
        console.log('attackBlocksAroundCod block state:', {x_id, y_id}, centerBlockState)
        if(re['error']){
            return re
        }
        cancelList = cancelList.concat(re['cancelList'])
        records = records.concat(re['records'])
        remainTroop = re['remainTroop']
        if(unionId != 0){
            for(let i = 0; i < 6; i++){
                if(remainTroop <=0 ){
                    break
                }
                let tempX = x_id + xOffset[i]
                let tempY = y_id + yOffset[i]
                let tempBlockState = this.getBlockState(tempX, tempY)
                if(tempBlockState && tempBlockState.belong.unionId == unionId){
                    let tempRe = this._attackBlockCod(tempX, tempY, generalId, remainTroop)
                    if(tempRe['error']){
                        return tempRe
                    }
                    cancelList = cancelList.concat(tempRe['cancelList'])
                    records = records.concat(tempRe['records'])
                    remainTroop = tempRe['remainTroop']
                }
            }
        }
        
        let durabilityReduce = 0
        if(remainTroop > 0){
            durabilityReduce = this.reduceDurability(x_id, y_id, remainTroop, this.general.state.unionId, onBelongChange)      
            if(records.length != 0){
                let lastRecord = records[records.length - 1] as BattleTransRecord
                lastRecord.attackInfo.gloryGet += Math.floor(durabilityReduce / 50)
                lastRecord.blockInfo.durabilityReduce = durabilityReduce
            }     
        }
        console.log('attackBlocksAroundCod result 2:', durabilityReduce, ' ', records, cancelList);
        return {
            txType: StateTransition.AttackBlock,
            records: records,
            cancelList: cancelList,
            durabilityReduce: durabilityReduce
        }
    }
    
    _attackBlockCod( x_id: number, y_id: number, generalId: number, remainTroop: number = -1){
        let time = parseInt(new Date().getTime() / 1000 + '');
        let blockState = this.getBlockState(x_id, y_id)
        let defaultDefense = this.getDefenseList(x_id, y_id, true)
        let firstBlock = true
        let list : BattleTransRecord[] = []
        let generalRow = this.general.getGeneralQualification(generalId)

        if(remainTroop == -1){
            remainTroop = this.general.getMaxAttackTroop()
            // firstBlock = true
        }
        if(firstBlock){
            for(let i = 0; i < defaultDefense.length; i++){
                let info = this.transBlockDefenseInfoToGeneralDefense(defaultDefense[i])
                let unionId = this.general.state.unionId;
                let unionIds = {
                  attackUnionId: unionId, 
                  defenseUnionId: 0
                };
                let bre = this.general.battle(generalId, unionIds, info, remainTroop, false);
                console.log('attackBlocksAroundCod attackBlockCod 1:', remainTroop, bre);
                if(!bre['result']){
                    return bre
                }
                else{
                    bre = bre as BattleResult
                    let battleRecord : BattleTransRecord= {
                        attackInfo : {
                            username: parseStateId(this.general.state.getId()).username ,
                            generalId: generalId,
                            generalLevel: this.general.getGeneralLevel(generalId),
                            generalType: generalRow.general_type,
                            troopReduce: bre.attackTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.attackGloryGet,
                            unionId: unionId,
                            iconId: this.general.state.iconId
                        },
                        defenseInfo: {
                            username: '',
                            generalId: info.generalId,
                            generalLevel: info.generalLevel,
                            generalType: info.generalType,
                            troopReduce: bre.defenseTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.defenseGloryGet,
                            unionId: 0,
                            iconId: -1
                        },
                        leader: '',
                        recordType: BattleRecordType.Assembly,
                        timestamp: getTimeStamp(),
                        blockInfo:{
                            x_id: x_id,
                            y_id: y_id,
                            durabilityReduce: 0
                        },
                        txHash: getTxHash(),
                        result: bre.win
                    }
                    list.push(battleRecord)
                    if( bre.win ){
                        defaultDefense.shift()
                        i--
                        remainTroop -= bre.attackTroopReduce
                    }
                    else{
                        defaultDefense[i].troops -= bre.defenseTroopReduce
                        remainTroop -= bre.attackTroopReduce
                        break
                    }
                }
            }
            blockState.update(
                {
                    'defaultDefense': defaultDefense,
                    'lastAttachTime': time
                }
            )
            this.changeGlobalLastAttack(x_id, y_id, time + DefaultTroopRecoverTime)
        }
        if(remainTroop <= 0 ){
            return {
                txType: StateTransition.AttackBlock,
                records: list,
                cancelList: [],
                remainTroop: remainTroop
            }
        }
        let defenseInfos = this.getDefenseList(x_id, y_id, false);
        console.log('attackBlocksAroundCod attackBlockCod defenseInfos:',{x_id, y_id} , defenseInfos);
        let cancelList : innerCancelBlockDefense[] = []
        for(let i = 0; i < defenseInfos.length; i++){
            let info = this.transBlockDefenseInfoToGeneralDefense(defenseInfos[i])
            let unionId = this.general.state.unionId;
            let unionIds = {
              attackUnionId: unionId, 
              defenseUnionId: defenseInfos[i].unionId
            };
            let bre = this.general.battle(generalId, unionIds, info, remainTroop, false)
            console.log('attackBlocksAroundCod attackBlockCod 2:', remainTroop, bre);

            if(!bre['result']){
                return bre
            }
            else{
                bre = bre as BattleResult
                let battleRecord : BattleTransRecord= {
                    attackInfo : {
                        username:  parseStateId(this.general.state.getId()).username,
                        generalId: generalId,
                        generalLevel: this.general.getGeneralLevel(generalId),
                        generalType: generalRow.general_type,
                        troopReduce: bre.attackTroopReduce,
                        silverGet: 0,
                        gloryGet: bre.attackGloryGet,
                        unionId: unionId,
                        iconId: this.general.state.iconId
                    },
                    defenseInfo: 
                    {
                        username:  defenseInfos[i].username,
                        generalId: info.generalId,
                        generalLevel: info.generalLevel,
                        generalType: info.generalType,
                        troopReduce: bre.defenseTroopReduce,
                        silverGet: 0,
                        gloryGet: bre.defenseGloryGet,
                        unionId: defenseInfos[i].unionId,
                        iconId: defenseInfos[i].iconId
                    },
                    leader: '',
                    recordType: BattleRecordType.Assembly,
                    timestamp: getTimeStamp(),
                    blockInfo:{
                        x_id: x_id,
                        y_id: y_id,
                        durabilityReduce: 0
                    },
                    txHash: getTxHash(),
                    result: bre.win
                }
                list.push(battleRecord)
                if( bre.win ){
                    cancelList.push(
                        {
                            generalId: defenseInfos[i].generalId,
                            username: defenseInfos[i].username
                        }
                    )
                    defenseInfos.shift()
                    i--
                    remainTroop -= bre.attackTroopReduce
                }
                else{
                    defenseInfos[i].troops -= bre.defenseTroopReduce
                    remainTroop -= bre.attackTroopReduce
                    break
                }
            }
        }
        blockState.update(
            {
                'defenseList': defenseInfos
            }
        )
        console.log('attackBlocksAroundCod attackBlockCod result:', remainTroop, ' records:', list);
        return {
            txType: StateTransition.AttackBlock,
            records: list,
            cancelList: cancelList,
            remainTroop : remainTroop
        }
    }

    genDurabilityRecord(x_id:number, y_id: number, generalId: number, gloryGet: number, durabilityReduce: number ) : BattleTransRecord{
        let generalRow = this.general.getGeneralQualification(generalId)
        let battleRecord : BattleTransRecord= {
            attackInfo : {
                username: parseStateId(this.general.state.getId()).username ,
                generalId: generalId,
                generalLevel: this.general.getGeneralLevel(generalId),
                generalType: generalRow.general_type,
                troopReduce: 0,
                silverGet: 0,
                gloryGet: gloryGet,
                unionId: this.general.state.unionId,
                iconId: this.general.state.iconId
            },
            defenseInfo: {
                username: '',
                generalId: -1,
                generalLevel: 0,
                generalType: 0,
                troopReduce: 0,
                silverGet: 0,
                gloryGet: 0,
                unionId: 0,
                iconId: -1
            },
            leader: '',
            recordType: BattleRecordType.Block,
            timestamp: getTimeStamp(),
            blockInfo:{
                x_id: x_id,
                y_id: y_id,
                durabilityReduce: durabilityReduce
            },
            txHash: getTxHash(),
            result: true
        }
        return battleRecord
    } 

    miningable(x_id: number, y_id: number ){
        let blockState = this.getBlockState(x_id, y_id)
        let row = this.getMapGDS(x_id, y_id)
        if(row.gather_silver_speed <= 0){
            return false
        }
        if(blockState.remainSilver >= row.gather_silver_speed){
            return true
        }
        return false
    }

    miningBlock(x_id: number, y_id: number){
        let blockState = this.getBlockState(x_id, y_id)
        let row = this.getMapGDS(x_id, y_id)
        if(this.miningable(x_id, y_id)){
            blockState.update(
                {
                    'remainSilver' : blockState.remainSilver - row.gather_silver_speed
                }
            )
        }
        return row.gather_silver_speed
    }

    getDurability( x_id: number, y_id: number){
        let time = parseInt(new Date().getTime() / 1000 + '')
        let blockState = this.getBlockState(x_id, y_id)
        let row = this.getMapGDS(x_id, y_id)
        if(time - blockState.lastAttachTime > DurabilityRecoverTime){
            return row.durability
        }
        else{
            return blockState.durability
        }
    }

    reduceDurability( x_id: number, y_id: number, remainTroop: number , unionId: number, onBelongChange: () => void){
        let time = parseInt(new Date().getTime() / 1000 + '')
        let blockState = this.getBlockState(x_id, y_id)
        let row = this.getMapGDS(x_id, y_id)
        let durability = this.getDurability(x_id, y_id)
        let update = 0
        console.log('reduceDurability change:', {x_id, y_id}, {durability, remainTroop, unionId});
        if(durability - remainTroop <= 0){
            let newBelong : BelongInfo ={
                unionId : unionId,
                updateTime: time
            }
            blockState.update(
                {
                    'durability': row.durability,
                    'belong': newBelong,
                    'lastAttachTime': -1
                }
            )
            this.changeBelongInfo(x_id, y_id, unionId, time + this.parameter.occupy_block_protect_times)
            onBelongChange && onBelongChange();
            update = durability
        }
        else{
            blockState.update(
                {
                    'durability': durability - remainTroop
                }
            )
            update = remainTroop
        }
        return update
    }

    getBlocksBelongInfo(){
        let re = {}
        for(let id in this.mapConfig.config){
            let row : MapGDS = this.mapConfig.config[id]
            re[id] = copyObj(
                this.getBlockBattleStatus(row.x_id, row.y_id)
            )
        }
        return re
    }

    getBuffList(unionId : number){
        let list = []
        for( let id in this.mapConfig.config){
            let row : MapGDS = this.mapConfig.config[id]
            if(unionId == this.getBelongInfo(row.x_id, row.y_id)){
                if(row.buff_id != 0){
                    list.push(row.buff_id)
                }
            }
        }
        return list
    }

    getCapitalsBlocks(){
        let mapId = this.mapId;
        let capitalsKey = 'capitals_' + mapId;
        let blockMap = InitState[StateName.Capitals][capitalsKey];
        // console.log('checkUnionWin by capitalsKey:', { mapId, capitalsKey }, blockMap);
        return blockMap;
    }

    checkUnionWinForSeperateCapitals(){
        console.log('checkUnionWin start');
        let time = getTimeStamp()
        let status = UnionWinStatus.WaitToWin
        let endTime = 0;
        let mapId = this.mapId;

        console.log('checkUnionWin:', {mapId, time, unionWinId: this.gState.unionWinId});
        if(this.gState.unionWinId != 0){
            return {
                unionWin: true,
                unionId: this.gState.unionWinId,
                status: UnionWinStatus.HaveWin,
                remainTime: 0
            }
        }

        let capticals = this.getCapitalsBlocks();
        console.log('checkUnionWin capticals:', { mapId }, capticals);

        let blockStates = this.blockStates;
        console.log('checkUnionWin capticals blockStates:', { mapId }, blockStates);

        let winId = 0;
        let unionWin = true;
        if(JSON.stringify(capticals) == '{}'){
            unionWin = false;
        }
        for(var blockId in capticals){
            let blockIds = blockId.split('^');
            let x_id = parseInt(blockIds[0]);
            let y_id = parseInt(blockIds[1]);
            let blockState = this.getBlockState(x_id, y_id);
            // let ownerId = this.getBelongInfo(x_id, y_id);
            // console.log('checkUnionWin blockId:', { blockId, x_id, y_id, ownerId });
            console.log('checkUnionWin blockId:', { blockId, x_id, y_id, mapId }, blockState);
            if(!blockState){
                throw "error blockState when check unionWin"
            }
            if( blockState.belong.unionId == 0){
                unionWin = false
                status = UnionWinStatus.Normal
                break
            }
            if( winId == 0 || blockState.belong.unionId == winId){
                winId = blockState.belong.unionId
                if(time - blockState.belong.updateTime < this.parameter.victory_need_occupy_times){
                    unionWin = false
                }
                let tempEndTime = blockState.belong.updateTime + this.parameter.victory_need_occupy_times
                endTime = tempEndTime > endTime ? tempEndTime : endTime
            }else{
                unionWin = false
                status = UnionWinStatus.Normal
                break
            }
        }

        console.log('checkUnionWin status:', { unionWin, status }, UnionWinStatus);

        if(!unionWin && status ==  UnionWinStatus.Normal){
            return {
                unionWin : unionWin,
                unionId : 0,
                status : UnionWinStatus.Normal,
                remainTime : 0
            }
        }

        if(!unionWin && status ==  UnionWinStatus.WaitToWin){
            return {
                unionWin : unionWin,
                unionId : winId,
                status : UnionWinStatus.WaitToWin,
                remainTime : endTime - time
            }
        }

        if(unionWin){
            return {
                unionWin : unionWin,
                unionId : winId,
                status : UnionWinStatus.HaveWin,
                remainTime : 0
            }
        }
    }

    checkUnionWin(){
        return this.checkUnionWinForSeperateCapitals();

        //old
        let time = getTimeStamp()
        let status = UnionWinStatus.WaitToWin
        let endTime = 0
        if(this.gState.unionWinId != 0){
            return {
                unionWin: true,
                unionId: this.gState.unionWinId,
                status: UnionWinStatus.HaveWin,
                remainTime: 0
            }
        }
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let xList = []
        let yList = []
        const centerX = 0
        const centerY = 0
        xList.push(centerX)
        yList.push(centerY)
        for(let i = 0; i < 6; i++){
            xList.push(centerX + xOffset[i])
            yList.push(centerY + yOffset[i])
        }
        
        //xList, yList get by gds(maybe not neighbors,buy seperate ones)

        let unionWin = true
        let winId = 0
        for(let i = 0; i < 7; i++){
            let blockState = this.getBlockState(xList[i], yList[i])
            if(!blockState){
                throw "error when check unionWin"
            }
            if( blockState.belong.unionId == 0){
                unionWin = false
                status = UnionWinStatus.Normal
                break
            }
            if( winId == 0 || blockState.belong.unionId == winId){
                winId = blockState.belong.unionId
                if(time - blockState.belong.updateTime < this.parameter.victory_need_occupy_times){
                    unionWin = false
                }
                let tempEndTime = blockState.belong.updateTime + this.parameter.victory_need_occupy_times
                endTime = tempEndTime > endTime ? tempEndTime : endTime
            }
            else{
                unionWin = false
                status = UnionWinStatus.Normal
                break
            }
        }
        if(!unionWin){
            if( status ==  UnionWinStatus.Normal){
                return {
                    unionWin : unionWin,
                    unionId : 0,
                    status : UnionWinStatus.Normal,
                    remainTime : 0
                }
            }
            else{
                return {
                    unionWin : unionWin,
                    unionId : winId,
                    status : UnionWinStatus.WaitToWin,
                    remainTime : endTime - time
                }
            }
        }
        else{
            return {
                unionWin : unionWin,
                unionId : winId,
                status : UnionWinStatus.HaveWin,
                remainTime : 0
            }
        }
    }

    getSeasonState(){
        return this.seasonState;
    }
    getSeasonStatus(){
        let time = getTimeStamp()
        const config = this.seasonState
        let re = {
            status: SeasonStatus.Reservation,
            remaintime: config.season_ready - time
        }
        if( time < config.season_ready ){
            re = {
                status: SeasonStatus.Reservation,
                remaintime: config.season_ready - time
            }
        }else if( time < config.season_open ){
            re = {
                status: SeasonStatus.Ready,
                remaintime: config.season_open - time
            }
        }else if( time < config.season_end ){
            re = {
                status: SeasonStatus.Open,
                remaintime: config.season_end - time
            }
        }else{
            re = {
                status: SeasonStatus.End,
                remaintime: -1
            }
        }
        return re
    }

    setUnionWin(unionId : number){
        if(!(this.checkUnionWin().unionId == unionId)){
            return {
                result: false,
                txType: StateTransition.SetUnionWin,
                error: "this-union-do-not-win"
            }
        }
        this.setRewardResult(unionId)
        this.gState.update(
            {
                'seasonEnd': true,
                'unionWinId': unionId
            }
        )
        return{
            txType: StateTransition.SetUnionWin,
            result: true
        }
    }

    setRewardResult(unionId: number){
        let addressList = []
        let gloryList = []
        let unionSumGlory = 0 
        for( let item  of this.rewardGlobalState.globalGloryRankInfo ){
            addressList.push(item.username)
            gloryList.push(item.glory)
        }
        if(unionId != 0){
            for( let item of this.rewardGlobalState.unionGloryRankInfo[unionId - 1] ){
                unionSumGlory += item.glory
                if(addressList.indexOf(item.username) == -1){
                    addressList.push(item.username)
                    gloryList.push(item.glory)
                }
            }
        }
        let unionRewardResult: RewardResult[] = []
        let gloryRewardResult: RewardResult[] = []

        const rankReward = this.genRankResultList()
        let rewardIndex = 0
        let reward = rankReward[rewardIndex]
        for(let i in this.rewardGlobalState.globalGloryRankInfo){
            if( parseInt(i) + 1  > reward.end){
                rewardIndex++
                if(rewardIndex >= rankReward.length){
                    break
                }
                reward = rankReward[rewardIndex]
            }
            let temp: RewardResult = {
                username : this.rewardGlobalState.globalGloryRankInfo[i].username,
                unionId : this.rewardGlobalState.globalGloryRankInfo[i].unionId,
                glory: this.rewardGlobalState.globalGloryRankInfo[i].glory,
                count: reward.count
            }
            gloryRewardResult.push(temp)
        }
        if(unionId != 0 && unionSumGlory != 0){
            for( let item of this.rewardGlobalState.unionGloryRankInfo[unionId - 1] ){
                let temp: RewardResult = {
                    username: item.username,
                    glory: item.glory,
                    unionId: item.unionId,
                    count: item.glory * this.seasonState.unionRewardValue / unionSumGlory
                }
                unionRewardResult.push(temp)
            }
        }

        this.rewardGlobalState.update(
            {
                contractAddressInput: addressList,
                contractGloryInput: gloryList,
                unionGlorySum: unionSumGlory,
                unionWinId: unionId,
                seasonEnd: true,
                unionRewardResult: unionRewardResult,
                gloryRewardResult: gloryRewardResult,
            }
        )
    }

    setSeasonEnd(){
        if(this.getSeasonStatus().status == SeasonStatus.End){
            console.log("endSeason success")
            this.setRewardResult(0)
            this.gState.update(
                {
                    'seasonEnd': true
                }
            )
            return {
                txType: StateTransition.SetSeasonEnd,
                result: true
            }
        }
        else{
            console.log("it-is-not-time-to-end")
            return{
                result: false,
                txType: StateTransition.SetSeasonEnd,
                error: 'it-is-not-time-to-end'
            }
        }
    }

    genRankResultList(){
        let re : RankReward[] = []
        if( this.seasonState.rankConfigValue.length * 2 != this.seasonState.rankConfigFromTo.length){
            return re
        }
        for(let i = 0; i < this.seasonState.rankConfigValue.length; i++){
            let temp: RankReward = {
                type: 1,
                name: "rose",
                from: this.seasonState.rankConfigFromTo[ i*2 ],
                end: this.seasonState.rankConfigFromTo[ i*2 + 1],
                count: this.seasonState.rankConfigValue[i]
            }
            re.push(temp)
        }
        return re
    }

    addGloryAndSum( value: number ){
        this.general.addGlory(value)
        let unionId = this.general.state.unionId
        let glorySum = this.rewardGlobalState.unionGlorySumRuntime
        glorySum[unionId -1 ] += value
        this.rewardGlobalState.update(
            {
                unionGlorySumRuntime: glorySum
            }
        )
    } 
}