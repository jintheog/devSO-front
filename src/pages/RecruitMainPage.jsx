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
	const [recruits, setRecruits] = useState([]);
	const [loading, setLoading] = useState(true);

	// 1. 필터 상태 관리 (백엔드 RequestDTO와 필드명 일치)
	const [filter, setFilter] = useState({
		type: null,
		position: null,
		stacks: [],
		search: "",
		onlyOpen: true,
		onlyBookmarked: false,
		onlyMyRecruits: false, // 👤 내 글만 보기 필터
		progressType: null,
	});

	const [options, setOptions] = useState({
		types: [],
		positions: [],
		stacks: [],
		progressTypes: [],
	});

	// 🌟 필터 초기화 함수 추가
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

	useEffect(() => {
		if (!loading) {
			fetchRecruitsData(filter);
		}
	}, [filter, fetchRecruitsData, loading]);

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
			alert("로그인이 필요한 서비스입니다.");
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

			{/* 필터 바: resetFilters prop 추가 */}
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
						<div className="no-posts">조건에 맞는 게시물이 없습니다.</div>
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
