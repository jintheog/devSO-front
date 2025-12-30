import React, { useState, useRef, useEffect } from "react";
import "../styles/RecruitFilterBar.css";

const RecruitFilterBar = ({ options, filter, setFilter, resetFilters }) => {
	const {
		types = [],
		positions = [],
		stacks = [],
		progressTypes = [],
	} = options;
	const [isStackOpen, setIsStackOpen] = useState(false);
	const [activeCategory, setActiveCategory] = useState("모두보기");
	const dropdownRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsStackOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleFilterChange = (key, value) => {
		setFilter((prev) => ({ ...prev, [key]: value }));
	};

	const handleStackToggle = (stackValue) => {
		const currentStacks = [...(filter.stacks || [])];
		const isSelected = currentStacks.some(
			(s) => String(s) === String(stackValue)
		);

		const newStacks = isSelected
			? currentStacks.filter((s) => String(s) !== String(stackValue))
			: [...currentStacks, stackValue];

		handleFilterChange("stacks", newStacks);
	};

	const getLabel = (item) =>
		item && typeof item === "object" ? item.label : item;
	const getValue = (item) =>
		item && typeof item === "object" ? item.value : item;

	const filteredStacks = stacks.filter((s) => {
		if (activeCategory === "모두보기") return true;
		const categoryMap = {
			프론트엔드: "FE",
			백엔드: "BE",
			모바일: "MOBILE",
			기타: "ETC",
		};
		return s.category === categoryMap[activeCategory];
	});

	return (
		<div className="filter-container">
			{/* 1. 상단 타입 탭 & 검색창 */}
			<div className="type-tabs">
				<div className="type-buttons-group">
					<button
						className={!filter.type ? "active" : ""}
						onClick={() => handleFilterChange("type", null)}
					>
						전체
					</button>
					{types.map((t) => (
						<button
							key={getValue(t)}
							className={
								String(filter.type) === String(getValue(t)) ? "active" : ""
							}
							onClick={() => handleFilterChange("type", getValue(t))}
						>
							{getLabel(t)}
						</button>
					))}
				</div>

				<div className="search-bar">
					<span className="search-icon">🔍</span>
					<input
						type="text"
						placeholder="제목, 글 내용을 검색해보세요."
						value={filter.search || ""}
						onChange={(e) => handleFilterChange("search", e.target.value)}
					/>
				</div>
			</div>

			{/* 2. 하단 필터 컨트롤 */}
			<div className="filter-controls">
				{/* 기술 스택 */}
				<div className="dropdown-wrapper" ref={dropdownRef}>
					<button
						className={`dropdown-btn ${
							filter.stacks?.length > 0 ? "selected" : ""
						}`}
						onClick={() => setIsStackOpen(!isStackOpen)}
					>
						기술 스택
						{filter.stacks?.length > 0 && (
							<span className="count-badge">{filter.stacks.length}</span>
						)}
						<span className={`arrow-icon ${isStackOpen ? "open" : ""}`}>▼</span>
					</button>

					{isStackOpen && (
						<div className="stack-dropdown-panel">
							<div className="stack-category-tabs">
								{["모두보기", "프론트엔드", "백엔드", "모바일", "기타"].map(
									(cat) => (
										<button
											key={cat}
											className={activeCategory === cat ? "active" : ""}
											onClick={() => setActiveCategory(cat)}
										>
											{cat}
										</button>
									)
								)}
							</div>
							<div className="stack-list">
								{filteredStacks.map((s) => {
									const val = getValue(s);
									const isSelected = filter.stacks?.some(
										(sv) => String(sv) === String(val)
									);
									return (
										<button
											key={val}
											className={`stack-item ${isSelected ? "active" : ""}`}
											onClick={() => handleStackToggle(val)}
										>
											{s.imageUrl ? (
												<img
													src={s.imageUrl}
													alt={getLabel(s)}
													className="stack-icon-img"
												/>
											) : (
												<div className="stack-dot" />
											)}
											<span>{getLabel(s)}</span>
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* 포지션 */}
				<select
					className="select-filter"
					value={filter.position || ""}
					onChange={(e) =>
						handleFilterChange("position", e.target.value || null)
					}
				>
					<option value="">포지션 전체</option>
					{positions.map((p) => (
						<option key={getValue(p)} value={getValue(p)}>
							{getLabel(p)}
						</option>
					))}
				</select>

				{/* 진행 방식 */}
				<select
					className="select-filter"
					value={filter.progressType ?? ""}
					onChange={(e) => {
						const val = e.target.value;
						handleFilterChange("progressType", val === "" ? null : Number(val));
					}}
				>
					<option value="">진행 방식 전체</option>
					{progressTypes.map((pt) => (
						<option key={getValue(pt)} value={getValue(pt)}>
							{getLabel(pt)}
						</option>
					))}
				</select>

				{/* 토글 버튼 그룹 */}
				<div className="toggle-group">
					<button
						className={`toggle-chip ${filter.onlyMyRecruits ? "active" : ""}`}
						onClick={() =>
							handleFilterChange("onlyMyRecruits", !filter.onlyMyRecruits)
						}
					>
						👤 내 글만 보기
					</button>
					<button
						className={`toggle-chip ${filter.onlyBookmarked ? "active" : ""}`}
						onClick={() =>
							handleFilterChange("onlyBookmarked", !filter.onlyBookmarked)
						}
					>
						👏 내 북마크 보기
					</button>
					<button
						className={`toggle-chip ${filter.onlyOpen ? "active" : ""}`}
						onClick={() => handleFilterChange("onlyOpen", !filter.onlyOpen)}
					>
						👀 모집 중만 보기
					</button>
				</div>

				{/* 초기화 버튼 (애니메이션 제거 버전) */}
				<button className="reset-btn" onClick={resetFilters}>
					<span className="reset-icon">🔄</span>
					초기화
				</button>
			</div>
		</div>
	);
};

export default RecruitFilterBar;
