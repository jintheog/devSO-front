import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import ChatBubble from "../components/ChatBubble";
import ChatWidget from "../components/ChatWidget";

export default function RootLayout() {
	const { isAuthenticated, logout } = useAuth();
	const { toggleChat } = useChat();
	const location = useLocation();

	// SNS 영역(/, /posts..., /trending..., /feed...)에서는 네비게이션의 SNS 탭을 항상 활성화 표시
	const isSnsActive =
		location.pathname === "/" ||
		location.pathname.startsWith("/posts") ||
		location.pathname.startsWith("/trending") ||
		location.pathname.startsWith("/feed");

	const navLinkStyle = ({ isActive }) => ({
		padding: "9px 10px",
		borderRadius: "12px",
		fontWeight: isActive ? 900 : 700,
		color: isActive ? "#4338ca" : "#111827",
		textDecoration: "none",
		background: isActive ? "rgba(79, 70, 229, 0.08)" : "transparent",
		border: `1px solid ${isActive ? "rgba(79, 70, 229, 0.18)" : "transparent"}`,
		transition: "all 0.15s ease",
	});

	const buttonStyle = {
		padding: "10px 14px",
		fontWeight: 800,
		color: "#111827",
		background: "#ffffff",
		border: "1px solid #e5e7eb",
		borderRadius: "12px",
		cursor: "pointer",
		fontFamily: "inherit",
		fontSize: "14px",
		transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
	};

	// 우측 인증 버튼(로그인/회원가입): inactive는 동일한 중립 스타일, active만 보라 그라데이션
	const authActionStyle = ({ isActive }) => ({
		...buttonStyle,
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		textDecoration: "none",
		background: isActive ? "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)" : "#ffffff",
		color: isActive ? "#ffffff" : "#111827",
		border: isActive ? "1px solid transparent" : "1px solid #e5e7eb",
		boxShadow: isActive ? "0 10px 22px rgba(79, 70, 229, 0.18)" : "none",
	});

	const handleChatClick = (e) => {
		e.preventDefault();
		toggleChat();
	};

	return (
		<div>
			<nav
				style={{
					background: "#ffffff",
					borderBottom: "1px solid #e5e7eb",
					boxShadow: "0 10px 25px rgba(2, 6, 23, 0.06)",
					position: "sticky",
					top: 0,
					zIndex: 50,
				}}
			>
				<div
					style={{
						maxWidth: "100%",
						margin: 0,
						padding: "10px 27px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "16px",
					}}
				>
					{/* Left: Brand + navigation */}
					<div style={{ display: "flex", alignItems: "center", gap: "18px", minWidth: 0 }}>
						<NavLink
							to="/"
							style={{
								display: "flex",
								alignItems: "center",
								gap: "10px",
								textDecoration: "none",
								color: "#111827",
								fontWeight: 900,
								letterSpacing: "-0.2px",
								padding: 0,
							}}
						>
							<span style={{ fontSize: "18px" }}>DevSo</span>
						</NavLink>

						<div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
							{/* --- 누구나 볼 수 있는 메뉴 (Public) --- */}
							<NavLink to="/" style={() => navLinkStyle({ isActive: isSnsActive })} end>
								SNS
							</NavLink>
							<NavLink to="/recruits" style={navLinkStyle}>
								팀원 모집
							</NavLink>

							{/* --- 로그인 여부에 따라 바뀌는 메뉴 --- */}
							{isAuthenticated ? (
								<>
									<NavLink to="/profile" style={navLinkStyle} end>
										프로필
									</NavLink>
									<a
										href="#"
										onClick={handleChatClick}
										style={navLinkStyle({ isActive: false })}
									>
										채팅
									</a>
								</>
							) : (
								null
							)}
						</div>
					</div>

					{/* Right: auth actions */}
					<div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
						{isAuthenticated ? (
							<button
								onClick={logout}
								style={{
									...buttonStyle,
									// 로그아웃은 active 개념이 없으니 중립 버튼으로 (혼동 방지)
									background: "#ffffff",
									color: "#111827",
									border: "1px solid #e5e7eb",
									boxShadow: "none",
								}}
							>
								로그아웃
							</button>
						) : (
							<>
								<NavLink to="/login" style={authActionStyle}>
									로그인
								</NavLink>
								<NavLink to="/signup" style={authActionStyle}>
									회원가입
								</NavLink>
							</>
						)}
					</div>
				</div>
			</nav>

			<div style={{ padding: "20px" }}>
				<Outlet />
			</div>

			{isAuthenticated && (
				<>
					<ChatBubble />
					<ChatWidget />
				</>
			)}
		</div>
	);
}
