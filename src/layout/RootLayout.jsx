import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RootLayout() {
  const { isAuthenticated, logout, user } = useAuth();

  const navLinkStyle = ({ isActive }) => ({
    marginRight: "15px",
    fontWeight: isActive ? "bold" : "normal",
    color: isActive ? "blue" : "black",
    textDecoration: "none",
  });

  const logoutButtonStyle = {
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

  return (
    <div>
      {/* 상단 메뉴바 */}
      <nav style={{ padding: "10px", backgroundColor: "#eee" }}>
        <NavLink to="/" style={navLinkStyle}>
          SNS
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink to="/profile" style={navLinkStyle}>
              프로필
            </NavLink>
            <NavLink to="/chat" style={navLinkStyle}>
              채팅
            </NavLink>
            <button onClick={logout} style={logoutButtonStyle}>
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

      {/* 자식 페이지 렌더링 위치 */}
      <div style={{ padding: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
}