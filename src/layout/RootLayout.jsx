import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import ChatBubble from "../components/ChatBubble";
import ChatWidget from "../components/ChatWidget";
import "../styles/Navbar.css";

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

	const handleChatClick = (e) => {
		e.preventDefault();
		toggleChat();
	};

	return (
		<div>
			<nav className="devso-nav">
				<div className="devso-nav-inner">
					{/* Left: Brand + navigation */}
					<div className="devso-nav-left">
						<NavLink
							to="/"
							className="devso-nav-brand"
						>
							<span className="devso-nav-brand-text">DevSo</span>
						</NavLink>

						<div className="devso-nav-links">
							{/* --- 누구나 볼 수 있는 메뉴 (Public) --- */}
							<NavLink
								to="/"
								className={() =>
									`devso-nav-link ${isSnsActive ? "active" : ""}`
								}
								end
							>
								SNS
							</NavLink>
							<NavLink
								to="/recruits"
								className={({ isActive }) =>
									`devso-nav-link ${isActive ? "active" : ""}`
								}
							>
								팀원 모집
							</NavLink>

							{/* --- 로그인 여부에 따라 바뀌는 메뉴 --- */}
							{isAuthenticated ? (
								<>
									<NavLink
										to="/profile"
										className={({ isActive }) =>
											`devso-nav-link ${isActive ? "active" : ""}`
										}
										end
									>
										프로필
									</NavLink>
									<a
										href="#"
										onClick={handleChatClick}
										className="devso-nav-link"
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
					<div className="devso-nav-right">
						{isAuthenticated ? (
							<button
								onClick={logout}
								className="devso-nav-btn devso-nav-btn-secondary"
							>
								로그아웃
							</button>
						) : (
							<>
								<NavLink
									to="/login"
									className={({ isActive }) =>
										`devso-nav-btn ${isActive ? "devso-nav-btn-primary" : "devso-nav-btn-secondary"}`
									}
								>
									로그인
								</NavLink>
								<NavLink
									to="/signup"
									className={({ isActive }) =>
										`devso-nav-btn ${isActive ? "devso-nav-btn-primary" : "devso-nav-btn-secondary"}`
									}
								>
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
