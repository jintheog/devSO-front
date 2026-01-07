import React, { useState, useRef, useEffect } from "react";
import "../styles/RecruitFilterBar.css";

const RecruitFilterBar = ({ options, filter, setFilter, resetFilters, showTabs = true }) => {
	const {
		positions = [],
		stacks = [],
		progressTypes = [],
	} = options;

	const [isStackOpen, setIsStackOpen] = useState(false);
	const [activeCategory, setActiveCategory] = useState("모두보기");
	const dropdownRef = useRef(null);

	// 🌟 1. 검색어 입력을 위한 로컬 상태 추가
	// 부모의 filter.search와 동기화하되, 타이핑은 이 로컬 상태에서 처리합니다.
	const [localSearch, setLocalSearch] = useState(filter.search || "");

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsStackOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// 🌟 2. 디바운싱 로직 추가
	// localSearch가 변경되면 타이머를 시작하고, 500ms 동안 변경이 없으면 부모의 filter를 업데이트합니다.
	useEffect(() => {
		const timer = setTimeout(() => {
			if (localSearch !== filter.search) {
				setFilter((prev) => ({ ...prev, search: localSearch }));
			}
		}, 500);

		return () => clearTimeout(timer); // 다음 타이핑이 발생하면 이전 타이머를 취소
	}, [localSearch, setFilter, filter.search]);

	// 필터 초기화 시 로컬 검색어도 비워줌
	useEffect(() => {
		setLocalSearch(filter.search || "");
	}, [filter.search]);

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
			{showTabs && (
				<div className="type-tabs">
					<div className="type-buttons-group">
						<button
							className={!filter.type ? "active" : ""}
							onClick={() => handleFilterChange("type", null)}
						>
							전체
						</button>
						{options.types.map((t) => (
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
				</div>
			)}

			<div className="filter-controls" style={{ marginBottom: "16px" }}>
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

				<button className="reset-btn" onClick={resetFilters}>
					<span className="reset-icon">🔄</span>
					초기화
				</button>
			</div>

			<div className="search-bar" style={{ width: "100%", maxWidth: "none" }}>
				<span className="search-icon">🔍</span>
				<input
					type="text"
					placeholder="제목, 글 내용을 검색해보세요."
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							setFilter((prev) => ({ ...prev, search: localSearch }));
						}
					}}
				/>
			</div>
		</div>
	);
};

export default RecruitFilterBar;
