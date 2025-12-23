import { Client } from '@stomp/stompjs';
import { API_URL } from './index'; // API_URL을 가져옵니다.

let stompClient = null;
let subscriptions = {}; // 구독 정보를 저장할 객체

export const connectStomp = (onConnect, onError) => {
  if (stompClient && stompClient.connected) {
    onConnect();
    return;
  }

  // API_URL (예: http://localhost:8080)을 WebSocket URL (예: ws://localhost:8080/ws-chat)로 변환
  const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws-chat';

  stompClient = new Client({
    brokerURL: wsUrl,
    connectHeaders: {
      'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT 토큰을 헤더에 추가
    },
    debug: function (str) {
      console.log(str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('STOMP Connected');
      onConnect();
    },
    onStompError: (frame) => {
      console.error('STOMP Error:', frame);
      if (onError) onError(frame);
    },
    onWebSocketClose: () => {
        console.log('WebSocket Closed');
    },
    onDisconnect: () => {
        console.log('STOMP Disconnected');
    }
  });

  stompClient.activate();
};

export const disconnectStomp = () => {
  if (stompClient) {
    Object.values(subscriptions).forEach(sub => sub.unsubscribe());
    subscriptions = {};
    stompClient.deactivate();
    stompClient = null;
    console.log('STOMP Disconnected.');
  }
};

export const subscribeToRoom = (roomId, onMessageReceived) => {
  if (!stompClient || !stompClient.connected) {
    console.error('STOMP client not connected.');
    return;
  }
  const destination = `/topic/room.${roomId}`;
  if (subscriptions[destination]) {
    console.log(`Already subscribed to ${destination}`);
    return subscriptions[destination];
  }
  const subscription = stompClient.subscribe(destination, (message) => {
    onMessageReceived(JSON.parse(message.body));
  });
  subscriptions[destination] = subscription;
  console.log(`Subscribed to ${destination}`);
  return subscription;
};

export const unsubscribeFromRoom = (roomId) => {
  const destination = `/topic/room.${roomId}`;
  if (subscriptions[destination]) {
    subscriptions[destination].unsubscribe();
    delete subscriptions[destination];
    console.log(`Unsubscribed from ${destination}`);
  }
};

export const sendChatMessage = (roomId, message) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: '/app/chat/send',
      body: JSON.stringify({ roomId, message }),
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT 토큰을 헤더에 추가
      }
    });
  } else {
    console.error('STOMP client not connected, cannot send message.');
  }
};
