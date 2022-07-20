import { w3cwebsocket } from 'websocket';

import {
  MessageType,
  MessageC2S,
  MessageS2C
} from './Game/Controler/Websocket/protocol';

var client = new w3cwebsocket('ws://localhost:1323/ws/hello');

client.onerror = function (err:Error ) {
  console.log('Connection Error', err)
};

client.onopen = function () {
  console.log('WebSocket Client Connected');
  let seqNum = 0;

  function sendNumber() {
    if (client.readyState === client.OPEN) {
      seqNum++;
      var number = Math.round(Math.random() * 0xffffff);
      var msg: MessageC2S = {
        SeqNum: seqNum,
        Type: MessageType.Transition,
        TransId: 'test',
        Data: { number: number }
      };
      console.log("msg is ",JSON.stringify(msg))
      client.send(JSON.stringify(msg));
      setTimeout(sendNumber, 1000);
    }
  }
  sendNumber();
};

client.onclose = function () {
  console.log('echo-protocol Client Closed');
};

client.onmessage = function (e:any) {
  if (typeof e.data === 'string') {
    console.log("Received: '" + e.data + "'");
  }
};
