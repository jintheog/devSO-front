import React from 'react';
import ChatListPage from '../pages/ChatListPage';
import ChatRoomPage from '../pages/ChatRoomPage';
import { useChat } from '../contexts/ChatContext';
import { Slide, Box } from '@mui/material'; // Import Box

const ChatWidget = () => {
  const { isChatOpen, chatView, selectedRoomId, showList, showRoom } = useChat();

  const chatContent = chatView === 'list' ? (
    <ChatListPage onRoomSelect={showRoom} />
  ) : (
    <ChatRoomPage roomId={selectedRoomId} onBack={showList} />
  );

  return (
    <Slide direction="up" in={isChatOpen} mountOnEnter unmountOnExit timeout={300}>
      <Box
        sx={{
          position: "fixed",
          bottom: 112, // Position above the ChatBubble
          right: 32,
          zIndex: 1299,
          width: "clamp(300px, 25vw, 400px)",
          height: "clamp(400px, 70vh, 700px)",
          maxHeight: 'calc(100vh - 120px)',

        }}
      >
        {chatContent}
      </Box>
    </Slide>
  );
};

export default ChatWidget;
