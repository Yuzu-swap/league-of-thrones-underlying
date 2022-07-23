export enum MessageType {
  Transition = 'transition',
  Query = 'query',
  Chat = 'chat'
}

export interface BaseMessage {
  SeqNum: number;
  Type: MessageType;
  TransId: string;
}

export interface MessageC2S extends BaseMessage {
  Data: {};
}
export interface MessageS2C extends BaseMessage {
  States: {};
  Result: any;
}
