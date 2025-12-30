import React from "react";
import { Icon } from "@iconify/react";

const RecruitCard = ({
	recruit = {},
	options = {},
	onClick = () => {},
	onBookmarkClick = () => {},
}) => {
	const {
		type,
		positions = [],
		title = "",
		stacks = [],
		username = "익명",
		viewCount = 0,
		commentCount = 0,
		status,
		deadLine,
		bookmarked = false,
	} = recruit;

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const targetDate = new Date(deadLine);
	targetDate.setHours(0, 0, 0, 0);

	const isExpired = deadLine && targetDate < today;

	const getLabel = (optionList, value) => {
		if (!optionList || optionList.length === 0) return value;
		const found = optionList.find((o) => String(o.value) === String(value));
		return found ? found.label : value;
	};

	const formattedDeadline = deadLine
		? new Date(deadLine).toLocaleDateString("ko-KR")
		: "미정";

	const typeClass = String(type) === "1" ? "study" : "project";

	const handleCardClick = () => {
		if (isExpired) {
			alert("마감된 모집글입니다.");
			return;
		}
		onClick();
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
				borderRadius: "12px",
				border: "1px solid #eee",
				transition: "transform 0.2s, box-shadow 0.2s",
			}}
		>
			{/* 북마크 버튼 및 마감 레이어 생략 (기존과 동일) */}
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

			{isExpired && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(255, 255, 255, 0.7)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 5,
						borderRadius: "12px",
					}}
				>
					<span
						style={{
							background: "gray",
							color: "#fff",
							padding: "5px 10px",
							borderRadius: "4px",
							fontWeight: "bold",
							fontSize: "0.9rem",
						}}
					>
						모집 마감
					</span>
				</div>
			)}

			{/* 태그 영역 */}
			<div className="card-top-tags" style={{ marginBottom: "1rem" }}>
				{type !== undefined && (
					<span className={`category-tag category-${typeClass}`}>
						{getLabel(options.types, type)}
					</span>
				)}
				{(status === "OPEN" || status === 1) && !isExpired && (
					<span
						className="category-tag category-new"
						style={{ marginLeft: "6px" }}
					>
						🔥 모집 중
					</span>
				)}
			</div>

			<div
				className="deadline"
				style={{ fontSize: "0.85rem", color: "#888", marginBottom: "0.5rem" }}
			>
				마감일 | {formattedDeadline}
			</div>

			<h3
				className="card-title"
				style={{
					fontSize: "1.15rem",
					fontWeight: "bold",
					lineHeight: "1.4",
					height: "2.8em",
					marginBottom: "1rem",
					paddingRight: "1.5rem",
					display: "-webkit-box",
					WebkitLineClamp: 2,
					WebkitBoxOrient: "vertical",
					overflow: "hidden",
					textOverflow: "ellipsis",
				}}
			>
				{title}
			</h3>

			{/* 콘텐츠 영역 */}
			<div className="tags" style={{ flex: 1, overflow: "hidden" }}>
				{positions.length > 0 && (
					<div
						className="positions"
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: "0.4rem",
							marginBottom: "1.2rem",
							alignItems: "flex-start", // 🌟 부모가 자식 높이를 강제로 늘리지 못하게 설정
						}}
					>
						{positions.slice(0, 3).map((pos, idx) => (
							<span
								key={`pos-${idx}`}
								className="tag position-tag"
								style={{
									fontSize: "0.75rem",
									padding: "2px 8px", // 🌟 세로 padding을 줄여서 박스 높이를 조절
									backgroundColor: "#f0f4ff",
									color: "#4a5568",
									borderRadius: "6px",
									fontWeight: "600",
									border: "1px solid #e2e8f0",

									// 🌟 가로/세로 크기 고정 및 최적화
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: "fit-content", // 가로는 글자 길이에 맞게
									height: "24px", // 🌟 세로 높이를 명시적으로 고정 (선택 사항)
									lineHeight: "1", // 행간을 줄여서 텍스트가 중앙에 오게 함
									whiteSpace: "nowrap",
								}}
							>
								{getLabel(options.positions, pos)}
							</span>
						))}
						{positions.length > 3 && (
							<span
								style={{
									fontSize: "0.75rem",
									color: "#aaa",
									alignSelf: "center",
								}}
							>
								...
							</span>
						)}
					</div>
				)}

				{/* 스택 영역 */}
				{stacks.length > 0 && (
					<div
						className="stacks"
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: "0.6rem",
							alignItems: "center",
						}}
					>
						{stacks.slice(0, 8).map((stack, idx) => (
							<div
								key={`stack-${idx}`}
								title={stack.label}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: "28px",
									height: "28px",
								}}
							>
								{stack.imageUrl ? (
									<img
										src={stack.imageUrl}
										alt={stack.label}
										style={{
											width: "24px",
											height: "24px",
											objectFit: "contain",
											filter: isExpired ? "grayscale(100%)" : "none",
										}}
									/>
								) : (
									<div
										style={{
											width: "22px",
											height: "22px",
											backgroundColor: "#f0f0f0",
											borderRadius: "4px",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "0.6rem",
											color: "#999",
										}}
									>
										{stack.label?.substring(0, 1).toUpperCase()}
									</div>
								)}
							</div>
						))}
						{stacks.length > 8 && (
							<span style={{ fontSize: "0.75rem", color: "#aaa" }}>+</span>
						)}
					</div>
				)}
			</div>

			<hr
				style={{
					border: "0",
					borderTop: "1px solid #f0f0f0",
					margin: "1rem 0",
				}}
			/>

			{/* 푸터 영역 생략 (기존과 동일) */}
			<div
				className="card-footer"
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div
					className="author"
					style={{
						display: "flex",
						alignItems: "center",
						gap: "5px",
						fontSize: "0.9rem",
					}}
				>
					<span className="author-icon">🐑</span>
					<span style={{ fontWeight: "500" }}>{username}</span>
				</div>
				<div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
					<span
						style={{
							display: "flex",
							alignItems: "center",
							gap: "3px",
							fontSize: "0.8rem",
							color: "#999",
						}}
					>
						👁️ {viewCount}
					</span>
					<span
						style={{
							display: "flex",
							alignItems: "center",
							gap: "3px",
							fontSize: "0.8rem",
							color: "#999",
						}}
					>
						<Icon icon="mdi:comment-outline" width="16" height="16" />
						{commentCount || 0}
					</span>
				</div>
			</div>
		</div>
	);
};

export default RecruitCard;
