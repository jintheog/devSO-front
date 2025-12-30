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

const RecruitMainPage = () => {
	const navigate = useNavigate();
	const [recruits, setRecruits] = useState([]); // 게시글 목록
	const [loading, setLoading] = useState(true); // 로딩 상태

	// 🌟 1. 필터 상태 관리
	const [filter, setFilter] = useState({
		type: null,
		position: null,
		stacks: [],
		search: "",
		onlyOpen: true,
		onlyBookmarked: false,
		progressType: null,
	});

	// 🌟 2. Enum 옵션 데이터 상태
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
			onlyMyRecruits: false,
			progressType: null,
		});
	};

	/**
	 * 🌟 3. 필터링된 게시글 데이터를 가져오는 함수
	 * getRecruits가 api.get()의 Promise를 리턴하므로 response.data를 확인합니다.
	 */
	const fetchRecruitsData = useCallback(async (currentFilter) => {
		try {
			const response = await getRecruits(currentFilter);
			const data = response.data.data || response.data;

			setRecruits(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("모집글 로드 실패:", error);
			setRecruits([]);
		}
	}, []);

	/**
	 * 🌟 4. 페이지 초기 진입 시 로직
	 */
	useEffect(() => {
		const loadInitialData = async () => {
			setLoading(true);
			try {
				// 병렬 호출로 로딩 속도 향상
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

				// 첫 게시글 리스트 조회
				await fetchRecruitsData(filter);
			} catch (error) {
				console.error("초기 데이터 로드 실패:", error);
			} finally {
				setLoading(false);
			}
		};

		loadInitialData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/**
	 * 🌟 5. 필터 변경 감지 로직
	 */
	useEffect(() => {
		if (!loading) {
			fetchRecruitsData(filter);
		}
	}, [filter, fetchRecruitsData, loading]);

	/**
	 * 🌟 6. 북마크 클릭 핸들러
	 */
	const handleBookmarkClick = async (recruitId) => {
		try {
			const response = await toggleBookmark(recruitId);
			// 서버 응답 구조가 response.data.data에 boolean이 들어있다고 가정
			const isBookmarked = response.data.data;

			setRecruits((prev) =>
				prev.map((r) =>
					r.id === recruitId ? { ...r, bookmarked: isBookmarked } : r
				)
			);
		} catch (error) {
			console.error("북마크 토글 실패:", error);
			alert("로그인이 필요한 서비스이거나 서버 오류가 발생했습니다.");
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

			{loading ? (
				<div className="loading">모집글을 불러오는 중입니다...</div>
			) : (
				<div className="recruit-content">
					<div className="recruit-count">
						총 <span>{recruits.length}</span>개의 모집글이 있습니다.
					</div>

					{recruits.length === 0 ? (
						<div className="no-posts">
							검색 조건에 맞는 게시물이 없습니다. 필터를 변경해보세요!
						</div>
					) : (
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
					)}
				</div>
			)}
		</div>
	);
};

export default RecruitMainPage;
