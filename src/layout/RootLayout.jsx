import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import ChatBubble from "../components/ChatBubble";
import ChatWidget from "../components/ChatWidget";

export default function RootLayout() {
  const { isAuthenticated, logout } = useAuth();
  const { toggleChat } = us
  const 
	const navLinkStyle = ({ isActive }) => ({
		marginRight: "15px",
		fontWeight: isActive ? "bold" : "normal",
		color: isActive ? "blue" : "black",
		textDecoration: "none",
	});

  const buttonStyle = {
    marginRight: "15px",
    fontWeight: "normal",
    color: "black",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
    fontSize: "inherit",
  };

  const handleChatClick = (e) => {
    e.preventDefault();
    toggleChat();
  };

  return (
    <div>
      <nav style={{ padding: "10px", backgroundColor: "#eee" }}>
        <NavLink to="/" style={navLinkStyle}>
          SNS
        </NavLink>
        <NavLink to="/posts" style={navLinkStyle}>
          최신
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink to="/profile" style={navLinkStyle}>
              프로필
            </NavLink>
            <NavLink to="/recruits" style={navLinkStyle}>
							팀원 모집
						</NavLink>
            <NavLink to="/posts/new" style={navLinkStyle}>
              새 글 작성
            </NavLink>
            {/* This link opens the chat widget */}
            <a
              href="#"
              onClick={handleChatClick}
              style={navLinkStyle({ isActive: false })}
            >
              채팅
            </a>
            <button onClick={logout} style={buttonStyle}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={navLinkStyle}>
              로그인
            </NavLink>
            <NavLink to="/signup" style={navLinkStyle}>
              회원가입
            </NavLink>
          </>
        )}
      </nav>

      <div style={{ padding: "20px" }}>
        <Outlet />
      </div>

      {/* Render chat components if authenticated */}
      {isAuthenticated && (
        <>
          <ChatBubble />
          <ChatWidget />
        </>
      )}
    </div>
  );
}
ChatBubble />
          <ChatWidget />
        </>
      )}
    </div>
  );
}
ChatBubble />
          <ChatWidget />
        </>
      )}
    </div>
  );
}
