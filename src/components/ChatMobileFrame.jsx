import React from "react";
import { Card, Box, Paper } from "@mui/material";

const ChatMobileFrame = ({ header, children, ...props }) => {
  return (
    <Card
      {...props}
      sx={{
        width: "100%", // Take full width of parent Box
        height: "100%", // Take full height of parent Box
        borderRadius: "20px",
        boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#fff",
        ...props.sx
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          flexShrink: 0,
          borderRadius: 0,
          borderBottom: '1px solid #ddd'
        }}
      >
        {header}
      </Paper>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          backgroundColor: '#f9f9f9'
        }}
      >
        {children}
      </Box>
    </Card>
  );
};

export default ChatMobileFrame;
