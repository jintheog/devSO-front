import React, { useEffect, useState, useRef } from "react";
import {
  connectStomp,
  subscribeToRoom,
  sendChatMessage,
  unsubscribeFromRoom,
} from "../api/stompClient";
import { useAuth } from "../contexts/AuthContext";
import {
  getChatMessages,
  markChatAsRead,
  getMyChatRooms,
  getImageUrl,
} from "../api"; // getImageUrl import
import ChatMobileFrame from "../components/ChatMobileFrame";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Avatar, // Avatar import
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import "../styles/ChatMUI.css";

const ChatRoomPage = ({ roomId, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [opponentInfo, setOpponentInfo] = useState(null); // Store opponent info
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const setupChat = async () => {
      setIsLoading(true);
      try {
        await markChatAsRead(roomId);
        const [messagesResponse, roomsResponse] = await Promise.all([
          getChatMessages(roomId),
          getMyChatRooms(),
        ]);

        const sortedMessages = messagesResponse.data.content.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setMessages(sortedMessages);

        const currentRoom = roomsResponse.data.data.find(
          room => room.roomId === parseInt(roomId)
        );
        if (currentRoom) {
          setOpponentInfo({
            name: currentRoom.opponentName,
            profileImageUrl: currentRoom.opponentProfileImageUrl,
          });
        }
      } catch (error) {
        console.error("Failed to load chat data:", error);
      } finally {
        setIsLoading(false);
      }

      connectStomp(
        () => {
          setIsConnected(true);
          subscribeToRoom(roomId, message => {
            setMessages(prev => [...prev, message]);
          });
        },
        error => {
          console.error("STOMP Connection Error:", error);
          setIsConnected(false);
        }
      );
    };

    if (roomId) {
      setupChat();
    }

    return () => {
      if (roomId) {
        unsubscribeFromRoom(roomId);
      }
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

  const header = (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ borderBottom: "1px solid #ddd" }}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, textAlign: "center" }}>
          {opponentInfo?.name || `채팅방`}
        </Typography>
        <Box sx={{ width: 48 }} /> {/* For spacing */}
      </Toolbar>
    </AppBar>
  );

  return (
    <ChatMobileFrame header={header}>
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <List className="chat-messages-list">
            {messages.map((msg, index) => {
              const isSentByCurrentUser = msg.senderId === user.id;
              const senderName = isSentByCurrentUser
                ? user.name
                : opponentInfo?.name;
              const senderProfileImage = isSentByCurrentUser
                ? getImageUrl(user.profileImageUrl)
                : getImageUrl(opponentInfo?.profileImageUrl);
              const messageTime = new Date(msg.createdAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              );

              return (
                <ListItem
                  key={msg.messageId || index}
                  sx={{
                    justifyContent: isSentByCurrentUser
                      ? "flex-end"
                      : "flex-start",
                    p: "5px 8px",
                  }}>
                  {!isSentByCurrentUser && (
                    <Avatar
                      src={senderProfileImage}
                      sx={{ mr: 1, width: 32, height: 32 }}
                    />
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isSentByCurrentUser
                        ? "flex-end"
                        : "flex-start",
                    }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5, px: 1 }}>
                      {senderName}
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: "10px 14px",
                        borderRadius: "20px",
                        bgcolor: isSentByCurrentUser
                          ? "primary.main"
                          : "#e0e0e0",
                        color: isSentByCurrentUser
                          ? "primary.contrastText"
                          : "text.primary",
                        maxWidth: "100%",
                        wordBreak: "break-word",
                      }}>
                      <Typography
                        variant="body1"
                        sx={{ wordBreak: "break-word" }}>
                        {msg.message}
                      </Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, px: 1 }}>
                      {messageTime}
                    </Typography>
                  </Box>
                  {isSentByCurrentUser && (
                    <Avatar
                      src={senderProfileImage}
                      sx={{ ml: 1, width: 32, height: 32 }}
                    />
                  )}
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              p: 1,
              backgroundColor: "background.paper",
              flexShrink: 0,
              borderTop: "1px solid #ddd",
            }}>
            <TextField
              fullWidth
              variant="standard"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              disabled={!isConnected}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="submit"
                      color="primary"
                      disabled={!isConnected || !messageInput.trim()}>
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                disableUnderline: true,
              }}
            />
          </Box>
        </>
      )}
    </ChatMobileFrame>
  );
};

export default ChatRoomPage;
