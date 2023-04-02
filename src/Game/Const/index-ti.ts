/**
 * This module was automatically generated by `ts-interface-builder`
 */
import * as t from "ts-interface-checker";
// tslint:disable:object-literal-key-quotes

export const StateName = t.enumtype({
  "City": "city",
  "General": "general",
  "DefenderInfo": "defenderinfo",
  "MapGlobalInfo": "mapglobalinfo",
  "BlockInfo": "blockinfo",
  "SeasonConfig": "seasonconfig",
  "RewardGloablState": "rewardglobalstate",
  "Strategy": "strategy",
  "Activity": "activity",
});

export const CityFacility = t.enumtype({
  "Fortress": "fortress",
  "MilitaryCenter": "militarycenter",
  "Wall": "wall",
  "Store": "store",
  "InfantryCamp": "infantrycamp",
  "CavalryCamp": "cavalrycamp",
  "ArcherCamp": "archercamp",
  "TrainingCenter": "trainingcenter",
  "Home": "home",
});

export const ResouceType = t.enumtype({
  "Silver": "silver",
  "Troop": "troop",
});

export const StateTransition = t.enumtype({
  "UpgradeFacility": 1,
  "Recruit": 2,
  "ExcuteStrategy": 3,
  "HireGeneral": 4,
  "EnhanceGeneral": 5,
  "AttackEnemy": 6,
  "MarchToPos": 7,
  "AbleGeneral": 8,
  "DisableGeneral": 9,
  "UpgradeGeneral": 10,
  "UpgradeGeneralSkill": 11,
  "SetDefenseGeneral": 12,
  "ReceiveTroop": 13,
  "Battle": 14,
  "DefenseBlock": 15,
  "AttackBlock": 16,
  "CancelDefenseBlock": 17,
  "SetUnionId": 18,
  "SetUnionWin": 19,
  "SetSeasonEnd": 20,
  "StartSeason": 21,
  "SetIconId": 22,
  "Recharge": 23,
  "AddTestResource": 24,
  "RecoverMorale": 25,
  "BuyStrategyPoint": 26,
  "StrategyBuySilver": 27,
  "StrategyBuyTroop": 28,
  "StrategyBuyMorale": 29,
  "StrategyBuyProtect": 30,
  "StrategyBuyStore": 31,
  "MiningBlock": 32,
  "InitUserStates": 33,
  "InitGlobalStates": 34,
  "DonateSilver": 35,
  "RegularTask": 36,
  "SetGuideStep": 37,
  "FirstLogin": 38,
  "StrategyBuyProtect1": 39,
});

export const StateTransitionArgs = t.iface([], {
  "from": "string",
});

export const UpgradeFacilityArgs = t.iface(["StateTransitionArgs"], {
  "typ": "CityFacility",
  "index": "number",
});

export const RecruitArgs = t.iface(["StateTransitionArgs"], {
  "amount": "number",
});

export const AbleGeneralArgs = t.iface(["StateTransitionArgs"], {
  "id": "number",
});

export const DisableGeneralArgs = t.iface(["StateTransitionArgs"], {
  "id": "number",
});

export const UpgradeGeneralArgs = t.iface(["StateTransitionArgs"], {
  "id": "number",
});

export const UpgradeGeneralSkillArgs = t.iface(["StateTransitionArgs"], {
  "generalId": "number",
  "skillIndex": "number",
});

export const SetDefenseGeneralArgs = t.iface(["StateTransitionArgs"], {
  "generalId": "number",
});

export const ReceiveTroopArgs = t.iface(["StateTransitionArgs"], {
});

export const BattleArgs = t.iface(["StateTransitionArgs"], {
  "generalId": "number",
  "name": "string",
});

export const AttackBlockArgs = t.iface(["StateTransitionArgs"], {
  "x_id": "number",
  "y_id": "number",
  "generalId": "number",
});

export const SetUnionIdArgs = t.iface(["StateTransitionArgs"], {
  "unionId": "number",
  "force": "boolean",
});

export const SetUnionWinArgs = t.iface(["StateTransitionArgs"], {
  "unionId": "number",
});

export const SetSeasonEndArgs = t.iface(["StateTransitionArgs"], {
});

export const StartSeasonArgs = t.iface(["StateTransitionArgs"], {
  "applies": t.iface([], {
  }),
  "season": t.iface([], {
    "apply_ts": "number",
    "prepare_ts": "number",
    "start_ts": "number",
    "end_ts": "number",
    "reward_amount_1": "number",
    "reward_amount_2": "number",
    "rank_config_fromto": t.array("number"),
    "rank_config_value": t.array("number"),
  }),
});

export const SetIconIdArgs = t.iface(["StateTransitionArgs"], {
  "iconId": "number",
});

export const RechargeArgs = t.iface(["StateTransitionArgs"], {
  "username": "string",
  "rechargeId": "number",
  "amount": "number",
});

export const RecoverMoraleType = t.enumtype({
  "Silver": "silver",
  "Gold": "gold",
});

export const RecoverMoraleArgs = t.iface(["StateTransitionArgs"], {
  "resourceType": "RecoverMoraleType",
});

export const BuyStrategyPointArgs = t.iface(["StateTransitionArgs"], {
  "amount": "number",
});

export const InitUserStatesArgs = t.iface(["StateTransitionArgs"], {
  "username": "string",
});

export const DonateSilverArgs = t.iface(["StateTransitionArgs"], {
  "activityId": "number",
  "amount": "number",
});

export const GuideStepArgs = t.iface(["StateTransitionArgs"], {
  "type": "string",
  "step": "number",
});

export const ChatType = t.enumtype({
  "ChatTypeText": 1,
  "ChatTypePos": 2,
  "ChatTypeSystem_OccupiedTile": 3,
  "ChatTypeSystem_OccupiedCenter": 4,
});

export const ChatChannel = t.enumtype({
  "ChatChannel_WORLD": 1,
  "ChatChannel_Camp": 2,
});

export const ChatTransId = t.enumtype({
  "SendChat": "send",
  "HistoryData": "query",
});

export const ProfileTransId = t.enumtype({
  "Save": "save",
  "Query": "query",
});

export const ChatMessage = t.iface([], {
  "id": "string",
  "type": "ChatType",
  "channel": "ChatChannel",
  "content": "string",
  "sender": "string",
  "senderCamp": "number",
  "iconId": "number",
  "ts": "number",
});

const exportedTypeSuite: t.ITypeSuite = {
  StateName,
  CityFacility,
  ResouceType,
  StateTransition,
  StateTransitionArgs,
  UpgradeFacilityArgs,
  RecruitArgs,
  AbleGeneralArgs,
  DisableGeneralArgs,
  UpgradeGeneralArgs,
  UpgradeGeneralSkillArgs,
  SetDefenseGeneralArgs,
  ReceiveTroopArgs,
  BattleArgs,
  AttackBlockArgs,
  SetUnionIdArgs,
  SetUnionWinArgs,
  SetSeasonEndArgs,
  StartSeasonArgs,
  SetIconIdArgs,
  RechargeArgs,
  RecoverMoraleType,
  RecoverMoraleArgs,
  BuyStrategyPointArgs,
  InitUserStatesArgs,
  DonateSilverArgs,
  GuideStepArgs,
  ChatType,
  ChatChannel,
  ChatTransId,
  ProfileTransId,
  ChatMessage,
};
export default exportedTypeSuite;
