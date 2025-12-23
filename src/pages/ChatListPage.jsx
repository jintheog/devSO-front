import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyChatRooms,
  enterChatRoom,
  searchUsers,
  getImageUrl,
} from "../api";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth to get current user info
import "../styles/Chat.css";

const ChatListPage = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const { user } = useAuth(); // Get the current authenticated user

  const navigate = useNavigate();

  useEffect(() => {
    fetchChatRooms(); // 컴포넌트 마운트 시 fetch

    const handleFocus = () => {
      console.log("Window refocused, re-fetching chat rooms.");
      fetchChatRooms(); // 창이 다시 포커스될 때 fetch
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // 빈 의존성 배열은 마운트 시 한 번 실행 및 언마운트 시 클린업을 의미합니다.

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const response = await getMyChatRooms();
      setChatRooms(response.data.data); // API 응답 데이터를 그대로 사용
    } catch (err) {
      setError("채팅방 목록을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = async opponentId => {
    try {
      const response = await enterChatRoom(opponentId);
      const { roomId } = response.data;
      navigate(`/chat/${roomId}`);
    } catch (err) {
      setError("채팅방 생성/입장에 실패했습니다.");
      console.error(err);
    }
  };

  const handleUserSearch = async () => {
    if (userSearchTerm.trim()) {
      try {
        const response = await searchUsers(userSearchTerm.trim());
        setUserSearchResults(response.data.data);
      } catch (error) {
        console.error("사용자 검색에 실패했습니다.", error);
        setUserSearchResults([]);
      }
    } else {
      setUserSearchResults([]);
    }
  };

  if (loading) {
    return <div>채팅방 목록 로딩 중...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="chat-list-container">
      <h1>내 채팅방</h1>

      {/* 새로운 채팅 시작 섹션 */}
      <div className="new-chat-section">
        <input
          type="text"
          placeholder="새로운 채팅 상대방 검색 (username)"
          value={userSearchTerm}
          onChange={e => setUserSearchTerm(e.target.value)}
        />
        <button onClick={handleUserSearch}>검색</button>
        {userSearchResults.length > 0 && (
          <div className="user-search-results">
            <h3>검색 결과:</h3>
            <ul>
              {userSearchResults.map(foundUser => (
                <li key={foundUser.id}>
                  {foundUser.name} ({foundUser.username})
                  <button onClick={() => handleStartNewChat(foundUser.id)}>
                    채팅 시작
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {chatRooms.length === 0 ? (
        <p>아직 참여 중인 채팅방이 없습니다.</p>
      ) : (
        <ul className="chat-rooms-list">
          {chatRooms.map(room => (
            <li key={room.roomId} className="chat-room-item">
              <Link to={`/chat/${room.roomId}`}>
                <div className="opponent-info">
                  <img
                    src={
                      getImageUrl(room.opponentProfileImageUrl) ||
                      "/default-profile.png"
                    }
                    alt={room.opponentName}
                    className="profile-thumbnail"
                  />
                  <span>{room.opponentName}</span>
                </div>
                <div className="last-message">
                  <p>{room.lastMessage || "새로운 대화를 시작해보세요."}</p>
                  {room.lastMessageTime && (
                    <span className="message-time">
                      {new Date(room.lastMessageTime).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {room.unreadCount > 0 && (
                  <span className="unread-count">{room.unreadCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatListPage;
