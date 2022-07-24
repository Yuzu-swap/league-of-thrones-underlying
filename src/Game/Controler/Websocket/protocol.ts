export enum MessageType {
  Transition = 'transition',
  Query = 'query',
  Chat = 'chat'
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
