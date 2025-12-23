import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  connectStomp,
  disconnectStomp,
  subscribeToRoom,
  sendChatMessage,
  unsubscribeFromRoom,
} from "../api/stompClient";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth to get current user info
import { getChatMessages, markChatAsRead } from "../api";
import "../styles/Chat.css";

const ChatRoomPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth(); // 현재 로그인된 사용자 정보
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      await markChatAsRead(roomId); // 메시지 읽음 처리
      const response = await getChatMessages(roomId);
      // 메시지를 시간순(오름차순)으로 정렬
      const sortedMessages = response.data.content.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages(sortedMessages);
    } catch (error) {
      console.error("메시지 내역을 불러오는데 실패했습니다.", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const setupChat = async () => {
      setIsLoading(true);
      // 1. 과거 메시지를 먼저 가져옵니다.
      await fetchMessages();

      // 2. 과거 메시지를 모두 가져온 후, 실시간 메시지 수신을 위해 STOMP를 연결하고 구독합니다.
      connectStomp(
        () => {
          setIsConnected(true);
          console.log(`Subscribing to room ${roomId}`);
          subscribeToRoom(roomId, message => {
            setMessages(prevMessages => [...prevMessages, message]);
          });
        },
        error => {
          console.error("STOMP Connection Error:", error);
          setIsConnected(false);
        }
      );
    };

    setupChat();

    return () => {
      // 컴포넌트 언마운트 시 구독 해제
      unsubscribeFromRoom(roomId);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSendMessage = e => {
    e.preventDefault();
    if (messageInput.trim() && isConnected) {
      sendChatMessage(Number(roomId), messageInput);
      setMessageInput("");
    }
  };

  if (isLoading) {
    return <div>메시지 로딩 중...</div>;
  }

  return (
    <div className="chat-room-container">
      <h2>채팅방: {roomId}</h2>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p>아직 메시지가 없습니다. 대화를 시작해보세요!</p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.messageId}
              className={`chat-message ${
                msg.senderId === user.id ? "sent" : "received"
              }`}>
              <strong>
                {msg.senderId === user.id ? "나" : `User ${msg.senderId}`}
              </strong>
              : {msg.message}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected || !messageInput.trim()}>
          전송
        </button>
      </form>
    </div>
  );
};

export default ChatRoomPage;
