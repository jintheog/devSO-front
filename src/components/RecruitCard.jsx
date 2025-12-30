import React from "react";
import { Icon } from "@iconify/react";
import { getImageUrl } from "../api/index.js";
import { useNavigate } from "react-router-dom";

const RecruitCard = ({
	recruit = {},
	options = {},
	onClick = () => {},
	onBookmarkClick = () => {},
}) => {
	const navigate = useNavigate();

	const {
		type, // 1: 스터디, 2: 프로젝트 (예시)
		positions = [],
		title = "",
		stacks = [],
		username = "익명",
		viewCount = 0,
		commentCount = 0,
		status,
		deadLine,
		bookmarked = false,
		profileImageUrl,
	} = recruit;

	// 마감 상태 계산
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const targetDate = new Date(deadLine);
	targetDate.setHours(0, 0, 0, 0);
	const isExpired = deadLine && targetDate < today;

	// 라벨 추출 헬퍼
	const getLabel = (optionList, value) => {
		if (!optionList || optionList.length === 0) {
			// 데이터 로딩 전이라면 기본 타입명 반환
			if (String(value) === "1") return "스터디";
			if (String(value) === "2") return "프로젝트";
			return value;
		}
		const found = optionList.find((o) => String(o.value) === String(value));
		return found ? found.label : value;
	};

	const formattedDeadline = deadLine
		? new Date(deadLine).toLocaleDateString("ko-KR")
		: "상시모집";

	// 🌟 타입별 UI 테마 설정 (색상 및 아이콘)
	const isStudy = String(type) === "1";
	const theme = isStudy
		? { color: "#00d4b1", bg: "#f0fffb", label: "스터디", icon: "📖" }
		: { color: "#3b82f6", bg: "#eff6ff", label: "프로젝트", icon: "📂" };

	const handleCardClick = () => {
		if (isExpired) {
			alert("마감된 모집글입니다.");
			return;
		}
		onClick();
	};

	const handleProfileClick = (e) => {
		e.stopPropagation(); // 카드 상세 이동 방지
		if (username && username !== "익명") {
			navigate(`/profile/${username}`);
		}
	};

	return (
		<div
			className={`recruit-card ${isExpired ? "expired" : ""}`}
			onClick={handleCardClick}
			style={{
				cursor: isExpired ? "not-allowed" : "pointer",
				position: "relative",
				display: "flex",
				flexDirection: "column",
				height: "380px",
				minHeight: "380px",
				padding: "1.5rem",
				backgroundColor: "#fff",
				borderRadius: "16px", // 조금 더 둥글게 수정
				border: "1px solid #eee",
				transition: "all 0.2s ease-in-out",
				boxSizing: "border-box",
				boxShadow: isExpired ? "none" : "0 2px 10px rgba(0,0,0,0.02)",
			}}
			onMouseEnter={(e) => {
				if (!isExpired) {
					e.currentTarget.style.transform = "translateY(-5px)";
					e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.08)";
				}
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.transform = "translateY(0)";
				e.currentTarget.style.boxShadow = isExpired
					? "none"
					: "0 2px 10px rgba(0,0,0,0.02)";
			}}
		>
			{/* 북마크 버튼 */}
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onBookmarkClick();
				}}
				style={{
					position: "absolute",
					top: "1.2rem",
					right: "1.2rem",
					background: "none",
					border: "none",
					cursor: "pointer",
					zIndex: 10,
					padding: "4px",
				}}
			>
				<Icon
					icon={bookmarked ? "mdi:bookmark" : "mdi:bookmark-outline"}
					width="26"
					height="26"
					color={bookmarked ? "#fbbf24" : "#d1d5db"}
				/>
			</button>

			{/* 마감 오버레이 */}
			{isExpired && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(255, 255, 255, 0.6)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 5,
						borderRadius: "16px",
						backdropFilter: "blur(1px)",
					}}
				>
					<span
						style={{
							background: "#495057",
							color: "#fff",
							padding: "6px 14px",
							borderRadius: "20px",
							fontWeight: "bold",
							fontSize: "0.85rem",
						}}
					>
						모집 완료
					</span>
				</div>
			)}

			{/* 상단: 타입 태그 및 마감일 */}
			<div style={{ flexShrink: 0 }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "0.8rem",
					}}
				>
					<div style={{ display: "flex", gap: "6px" }}>
						<span
							style={{
								fontSize: "0.75rem",
								fontWeight: "700",
								padding: "4px 10px",
								borderRadius: "4px",
								backgroundColor: theme.bg,
								color: theme.color,
								border: `1px solid ${theme.color}33`,
							}}
						>
							{theme.icon} {getLabel(options.types, type)}
						</span>
						{(status === "OPEN" || status === 1) && !isExpired && (
							<span
								style={{
									fontSize: "0.75rem",
									fontWeight: "700",
									padding: "4px 10px",
									borderRadius: "4px",
									backgroundColor: "#fff5f5",
									color: "#ff6b6b",
									border: "1px solid #ff6b6b33",
								}}
							>
								🔥 모집중
							</span>
						)}
					</div>
				</div>
				<div
					style={{
						fontSize: "0.85rem",
						color: "#999",
						marginBottom: "1rem",
						fontWeight: "500",
					}}
				>
					마감기한 | <span style={{ color: "#555" }}>{formattedDeadline}</span>
				</div>
			</div>

			{/* 제목 */}
			<h3
				style={{
					fontSize: "1.1rem",
					fontWeight: "800",
					lineHeight: "1.5",
					height: "3em",
					marginBottom: "1.2rem",
					paddingRight: "1rem",
					display: "-webkit-box",
					WebkitLineClamp: 2,
					WebkitBoxOrient: "vertical",
					overflow: "hidden",
					textOverflow: "ellipsis",
					flexShrink: 0,
					color: "#212529",
				}}
			>
				{title}
			</h3>

			{/* 메인 콘텐츠: 포지션 & 스택 */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
					overflow: "hidden",
				}}
			>
				{/* 포지션 리스트 */}
				{positions.length > 0 && (
					<div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
						{positions.slice(0, 3).map((pos, idx) => (
							<span
								key={idx}
								style={{
									fontSize: "0.75rem",
									padding: "4px 10px",
									backgroundColor: "#f8f9fa",
									color: "#666",
									borderRadius: "6px",
									fontWeight: "600",
									border: "1px solid #eee",
								}}
							>
								{getLabel(options.positions, pos)}
							</span>
						))}
						{positions.length > 3 && (
							<span
								style={{
									fontSize: "0.75rem",
									color: "#adb5bd",
									alignSelf: "center",
								}}
							>
								외 {positions.length - 3}
							</span>
						)}
					</div>
				)}

				{/* 기술 스택 아이콘 */}
				{stacks.length > 0 && (
					<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
						{stacks.slice(0, 6).map((stack, idx) => (
							<div
								key={idx}
								title={stack.label}
								style={{
									width: "32px",
									height: "32px",
									backgroundColor: "#f8f9fa",
									borderRadius: "50%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									border: "1px solid #f1f3f5",
								}}
							>
								{stack.imageUrl ? (
									<img
										src={stack.imageUrl}
										alt={stack.label}
										style={{
											width: "20px",
											height: "20px",
											objectFit: "contain",
										}}
									/>
								) : (
									<span style={{ fontSize: "0.6rem", color: "#adb5bd" }}>
										{stack.label?.charAt(0)}
									</span>
								)}
							</div>
						))}
						{stacks.length > 6 && (
							<div
								style={{
									fontSize: "0.75rem",
									color: "#adb5bd",
									display: "flex",
									alignItems: "center",
								}}
							>
								+{stacks.length - 6}
							</div>
						)}
					</div>
				)}
			</div>

			{/* 푸터: 작성자 및 카운트 */}
			<div style={{ flexShrink: 0 }}>
				<hr
					style={{
						border: "0",
						borderTop: "1px solid #f1f3f5",
						margin: "1.2rem 0",
					}}
				/>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div
						onClick={handleProfileClick} // 클릭 시 이동
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							cursor: "pointer", // 포인터 커서 추가
						}}
					>
						{profileImageUrl ? (
							<img
								src={getImageUrl(profileImageUrl)}
								alt=""
								style={{
									width: "24px",
									height: "24px",
									borderRadius: "50%",
									objectFit: "cover",
								}}
							/>
						) : (
							<div
								style={{
									width: "24px",
									height: "24px",
									borderRadius: "50%",
									backgroundColor: "#e9ecef",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "0.7rem",
								}}
							>
								👤
							</div>
						)}
						<span
							style={{
								fontSize: "0.85rem",
								fontWeight: "600",
								color: "#495057",
							}}
						>
							{username}
						</span>
					</div>
					<div style={{ display: "flex", gap: "10px", color: "#adb5bd" }}>
						<span
							style={{
								fontSize: "0.8rem",
								display: "flex",
								alignItems: "center",
								gap: "4px",
							}}
						>
							<Icon icon="mdi:eye-outline" /> {viewCount}
						</span>
						<span
							style={{
								fontSize: "0.8rem",
								display: "flex",
								alignItems: "center",
								gap: "4px",
							}}
						>
							<Icon icon="mdi:comment-outline" /> {commentCount}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RecruitCard;
