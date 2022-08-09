import { IComponent , ComponentType, Throne} from ".";
import { BattleRecord, BattleType, General, GeneralAbility } from '../Logic/general'
import { City, RecruitStatus } from '../Logic/game'
import { Map } from "../Logic/map";
import { ITransContext, LocalMediator, IStatetWithTransContextCallback, ITransResult } from '../Controler/mediator'
import { StateTransition, CityFacility, ResouceType, StateName } from '../Const'
import { BaseMediator, IStateMediator, StateCallback } from '../../Core/mediator'
import { State, IState, IStateIdentity, copyObj } from '../../Core/state'
import { ConfigContainer } from '../../Core/config'
import { IBlockState, ICityState, IGeneralState, IMapGlobalState, ResouceInfo } from '../State'
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
import mapGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config.json')
import { LogicEssential, createLogicEsential, StateEssential, ConfigEssential } from '../Logic/creator'
import { WebSocketMediator } from '../Controler/websocket'
import { callbackify } from 'util'
import { userInfo } from 'os'

export interface IMapComponent extends IComponent{
    attackBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void
    defenseBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void
    cancelDefenseBlock(xId: number, yId: number, generalId: number, callback: (result: any) => void): void
    getDefenseList(xId: number, yId: number, callback: (result: any) => void): void
    getBlockInfo(xId: number, yId: number, callback: (result: any) => void): void
    getBlocksBelongInfo( callback: (result: any) => void ): void
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
    }

    onStateUpdate(callback: IStatetWithTransContextCallback): void {
        
    }

    getBlocksBelongInfo(callback: (result: any) => void): void {
        callback(this.map.getBlocksBelongInfo())
    }

    getDefenseList(xId: number, yId: number, callback: (result: any) => void): void {
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

    getBlockInfo(xId: number, yId: number, callback: (result: any) => void): void {
        let row = this.map.mapConfig.get(xId, yId)
        row['now_durability'] = this.map.getDurability(xId, yId)
        callback(row)
    }
}