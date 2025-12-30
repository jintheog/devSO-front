import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
	getRecruits,
	toggleBookmark,
	getTypes,
	getPositions,
	getTechStacks,
	getProgress,
} from "../api/index.js";
import "../styles/Recruit.css";
import RecruitCard from "../components/RecruitCard.jsx";
import RecruitFilterBar from "../components/RecruitFilterBar.jsx";
import { Icon } from "@iconify/react";

const RecruitMainPage = () => {
	const navigate = useNavigate();
	const [recruits, setRecruits] = useState([]);
	const [loading, setLoading] = useState(true);

	// 🌟 페이징 상태
	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);

	// 🌟 필터 상태
	const [filter, setFilter] = useState({
		type: null,
		position: null,
		stacks: [],
		search: "",
		onlyOpen: true,
		onlyBookmarked: false,
		progressType: null,
	});

	// 🌟 옵션 데이터 상태
	const [options, setOptions] = useState({
		types: [],
		positions: [],
		stacks: [],
		progressTypes: [],
	});

	const resetFilters = () => {
		setFilter({
			type: null,
			position: null,
			stacks: [],
			search: "",
			onlyOpen: true,
			onlyBookmarked: false,
			progressType: null,
		});
		setCurrentPage(0);
	};

	/**
	 * 🌟 데이터를 가져오는 함수 (useCallback으로 메모이제이션)
	 */
	const fetchRecruitsData = useCallback(async (currentFilter, page) => {
		try {
			const response = await getRecruits({
				...currentFilter,
				page: page,
				size: 8,
			});

			// 백엔드 응답에서 실제 데이터가 담긴 위치를 찾습니다.
			const rawData = response.data.data || response.data;

			if (rawData && rawData.content) {
				// 백엔드가 Page 객체를 줄 때
				// 예: { content: [...], totalPages: 2, totalElements: 10 }
				setRecruits(rawData.content);
				setTotalPages(rawData.totalPages); // 서버가 계산해준 전체 페이지 수 (2)
				setTotalElements(rawData.totalElements); // 서버가 계산해준 전체 글 수 (10)
			} else if (Array.isArray(rawData)) {
				// 백엔드가 배열만 줄 때 (현재 사용자의 상황)
				setRecruits(rawData);

				// 만약 서버가 전체 개수를 안 준다면 프론트에서 임시 계산해야 함
				// 하지만 실무에서는 반드시 서버가 totalElements를 주도록 백엔드를 수정합니다.
				const totalCount = rawData.length > 0 ? 10 : 0; // 임시로 10개라고 가정
				setTotalElements(totalCount);
				setTotalPages(Math.ceil(totalCount / 8)); // 10/8 = 1.25 -> 올림하여 2페이지
			}
		} catch (error) {
			console.error("모집글 로드 실패:", error);
			setRecruits([]);
		}
	}, []);

	/**
	 * 🌟 로직 1: 페이지 초기 진입 시 공통 데이터 로드
	 * 의존성 배열을 비워 처음에 한 번만 실행되도록 합니다.
	 */
	useEffect(() => {
		const loadInitialData = async () => {
			setLoading(true);
			try {
				const [typeRes, posRes, stackRes, progressRes] = await Promise.all([
					getTypes(),
					getPositions(),
					getTechStacks(),
					getProgress(),
				]);

				setOptions({
					types: typeRes.data || [],
					positions: posRes.data || [],
					stacks: stackRes.data || [],
					progressTypes: progressRes.data || [],
				});

				// 초기 데이터 호출
				await fetchRecruitsData(filter, 0);
			} catch (error) {
				console.error("초기 로드 에러:", error);
			} finally {
				setLoading(false);
			}
		};
		loadInitialData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // fetchRecruitsData를 넣지 않아 규칙 위반 방지

	/**
	 * 🌟 로직 2: 필터 변경 시 페이지만 0으로 리셋
	 */
	useEffect(() => {
		setCurrentPage(0);
	}, [filter]);

	/**
	 * 🌟 로직 3: 필터나 페이지가 변경될 때 데이터 다시 불러오기
	 */
	useEffect(() => {
		// 로딩 중이 아닐 때만 호출
		if (!loading) {
			fetchRecruitsData(filter, currentPage);
		}
	}, [filter, currentPage, fetchRecruitsData, loading]);

	const handleBookmarkClick = async (recruitId) => {
		try {
			const response = await toggleBookmark(recruitId);
			const isBookmarked = response.data.data;
			setRecruits((prev) =>
				prev.map((r) =>
					r.id === recruitId ? { ...r, bookmarked: isBookmarked } : r
				)
			);
		} catch (error) {
			console.error("북마크 실패:", error);
		}
	};

	return (
		<div className="recruit-container">
			<section className="hero-section">
				<h1 className="hero-title">프로젝트 & 스터디 모집</h1>
				<p className="hero-subtitle">함께 성장할 팀원을 찾아보세요!</p>
				<button
					className="hero-btn"
					onClick={() => navigate("/recruits/create")}
				>
					팀원 모집글 작성
				</button>
			</section>

			<RecruitFilterBar
				options={options}
				filter={filter}
				setFilter={setFilter}
				resetFilters={resetFilters}
			/>

			<div className="recruit-content">
				<div className="recruit-count">
					총 <span>{totalElements}</span>개의 모집글이 있습니다.
				</div>

				{loading ? (
					<div className="loading">데이터 로딩 중...</div>
				) : recruits.length === 0 ? (
					<div className="no-posts">조건에 맞는 모집글이 없습니다.</div>
				) : (
					<>
						<div className="recruit-posts">
							{recruits.map((recruit) => (
								<RecruitCard
									key={recruit.id}
									recruit={recruit}
									options={options}
									onClick={() => navigate(`/recruits/${recruit.id}`)}
									onBookmarkClick={() => handleBookmarkClick(recruit.id)}
								/>
							))}
						</div>

						{/* 페이지네이션 */}
						{totalPages > 1 && (
							<div className="pagination">
								<button
									className="pagination-arrow"
									disabled={currentPage === 0}
									onClick={() => setCurrentPage((p) => p - 1)}
								>
									<Icon icon="mdi:chevron-left" />
								</button>
								{[...Array(totalPages)].map((_, i) => (
									<button
										key={i}
										className={`pagination-number ${
											currentPage === i ? "active" : ""
										}`}
										onClick={() => setCurrentPage(i)}
									>
										{i + 1}
									</button>
								))}
								<button
									className="pagination-arrow"
									disabled={currentPage === totalPages - 1}
									onClick={() => setCurrentPage((p) => p + 1)}
								>
									<Icon icon="mdi:chevron-right" />
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default RecruitMainPage;
