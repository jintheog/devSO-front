import React, { useEffect, useState, useMemo } from "react";
import {
  getMyChatRooms,
  enterChatRoom,
  searchUsers,
  getImageUrl,
  leaveChatRoom
} from "../api";
import { useChat } from "../contexts/ChatContext"; // Import useChat
import ChatMobileFrame from "../components/ChatMobileFrame";
import {
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Divider,
  ListItemButton,
  Menu,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "../styles/ChatMUI.css";
import { debounce } from "../utils/debounce";

const ChatListPage = ({ onRoomSelect }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const { setTotalUnreadCount } = useChat(); // Get setTotalUnreadCount from context

  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const handleContextMenu = (event, roomId) => {
    event.preventDefault();
    setSelectedRoomId(roomId);
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedRoomId(null);
  };

  const onLeaveChat = () => {
    if (selectedRoomId) {
      handleLeaveChatRoom(selectedRoomId);
    }
    handleCloseContextMenu();
  };

  
  useEffect(() => {
    fetchChatRooms();
    const handleFocus = () => fetchChatRooms();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const response = await getMyChatRooms();
      setChatRooms(response.data.data);
      // Calculate total unread count
      const total = response.data.data.reduce((sum, room) => sum + room.unreadCount, 0);
      setTotalUnreadCount(total);
    } catch (err) {
      setError("채팅방 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = async (opponentId) => {
    try {
      const response = await enterChatRoom(opponentId);
      onRoomSelect(response.data.roomId);
    } catch (err) {
      setError("채팅방 생성/입장에 실패했습니다.");
    }
  };

  const performSearch = async (term) => {
    if (!term.trim()) {
      setUserSearchResults([]);
      return;
    }
    try {
      const response = await searchUsers(term.trim());
      setUserSearchResults(response.data.data);
    } catch (error) {
      console.error("사용자 검색에 실패했습니다.", error);
      setUserSearchResults([]);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    []
  );

  const handleLeaveChatRoom = async (roomId) => {
    try {
      await leaveChatRoom(roomId);
      setChatRooms(prevRooms =>
        prevRooms.filter(room => room.roomId !== roomId)
      );
    } catch (err) {
      setError("채팅방 나가기에 실패했습니다.");
    }
  };

  useEffect(() => {
    debouncedSearch(userSearchTerm);
  }, [userSearchTerm, debouncedSearch]);

  const header = (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid #ddd' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
          채팅
        </Typography>
      </Toolbar>
    </AppBar>
  );

  return (
    <ChatMobileFrame header={header}>
      <Box sx={{ p: 2, flexShrink: 0, borderBottom: '1px solid #eee' }}>
        <TextField
          fullWidth
          variant="standard"
          placeholder="사용자 검색"
          value={userSearchTerm}
          onChange={(e) => setUserSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            disableUnderline: true,
          }}
        />
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Typography color="error" sx={{p: 2}}>{error}</Typography>}

      <List sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
        {userSearchResults.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{p: '16px 16px 8px'}}>검색 결과</Typography>
            {userSearchResults.map((foundUser) => (
              <ListItemButton
                key={foundUser.id}
                onClick={() => handleStartNewChat(foundUser.id)}
              >
                <ListItemAvatar>
                  <Avatar src={getImageUrl(foundUser.profileImageUrl)} />
                </ListItemAvatar>
                <ListItemText
                  primary={foundUser.name}
                  secondary={`@${foundUser.username}`}
                />
              </ListItemButton>
            ))}
            <Divider sx={{my: 1}}/>
          </>
        )}

        {chatRooms.map((room) => (
          <ListItemButton
            key={room.roomId}
            onClick={() => onRoomSelect(room.roomId)}
            onContextMenu={(e) => handleContextMenu(e, room.roomId)}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                color="success" // This could be dynamic based on user status
              >
                <Avatar
                  src={
                    getImageUrl(room.opponentProfileImageUrl) ||
                    "/default-profile.png"
                  }
                />
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={room.opponentName}
              secondary={room.lastMessage || "새로운 대화를 시작해보세요."}
              secondaryTypographyProps={{ noWrap: true, textOverflow: 'ellipsis' }}
            />
            {room.unreadCount > 0 && (
              <Badge badgeContent={room.unreadCount} color="error" />
            )}
          </ListItemButton>
        ))}
      </List>
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={onLeaveChat}>채팅방 나가기</MenuItem>
      </Menu>
    </ChatMobileFrame>
  );
};

export default ChatListPage;
