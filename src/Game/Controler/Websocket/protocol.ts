export enum MessageType {
  Transition = 'transition',
  StateQuery = 'state_query', //state query will triiger state callback
  Query = 'query', //normal query won't trigger any  stae callback
  Chat = 'chat',
  QueryCount = 'query_count'
}

export interface BaseMessage {
  SeqNum: number;
  Type: MessageType;
  TransID: string;
}

export interface MessageC2S extends BaseMessage {
  Data: {};
}
export interface MessageS2C extends BaseMessage {
  States: {};
  Data: any;
}
