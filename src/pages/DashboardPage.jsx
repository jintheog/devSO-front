import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getImageUrl, getPosts, getProfile, getRecruits } from "../api";
import "../styles/PostList.css";
import "../styles/Dashboard.css";

const safeGetList = (res) => {
	const raw = res?.data?.data ?? res?.data;
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	if (Array.isArray(raw.content)) return raw.content;
	return [];
};

const formatRelativeTime = (iso) => {
	if (!iso) return "";
	const t = new Date(iso).getTime();
	if (Number.isNaN(t)) return "";
	const diff = Date.now() - t;
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "방금 전";
	if (mins < 60) return `${mins}분 전`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	return `${days}일 전`;
};

const extractFirstMarkdownImageUrl = (md) => {
	if (!md || typeof md !== "string") return null;
	// ![alt](url)
	const m = md.match(/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
	return m?.[1] ?? null;
};

function AutoCarousel({ title, subtitle, items, renderItem, onMore }) {
	const scrollerRef = useRef(null);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		if (!items || items.length <= 1) return;

		const step = () => {
			const firstChild = el.firstElementChild;
			const cardW = firstChild ? firstChild.getBoundingClientRect().width : 320;
			const gap = 14;
			const nextLeft = el.scrollLeft + cardW + gap;
			const atEnd = nextLeft + el.clientWidth >= el.scrollWidth - 8;
			el.scrollTo({ left: atEnd ? 0 : nextLeft, behavior: "smooth" });
		};

		const id = window.setInterval(step, 2800);
		return () => window.clearInterval(id);
	}, [items]);

	const handlePrev = () => {
		const el = scrollerRef.current;
		if (!el) return;
		const firstChild = el.firstElementChild;
		const cardW = firstChild ? firstChild.getBoundingClientRect().width : 320;
		const gap = 14;
		el.scrollBy({ left: -(cardW + gap), behavior: "smooth" });
	};

	const handleNext = () => {
		const el = scrollerRef.current;
		if (!el) return;
		const firstChild = el.firstElementChild;
		const cardW = firstChild ? firstChild.getBoundingClientRect().width : 320;
		const gap = 14;
		el.scrollBy({ left: cardW + gap, behavior: "smooth" });
	};

	return (
		<section className="dash-surface sns-surface">
			<div className="dash-surface-header">
				<div className="dash-surface-header-left">
					<div className="dash-surface-title">{title}</div>
					{subtitle ? <div className="dash-surface-subtitle">{subtitle}</div> : null}
				</div>
				<div className="dash-surface-header-right">
					<button className="dash-icon-btn" type="button" onClick={handlePrev} aria-label="Prev">
						‹
					</button>
					<button className="dash-icon-btn" type="button" onClick={handleNext} aria-label="Next">
						›
					</button>
					{onMore ? (
						<button className="sns-btn dash-more-btn" type="button" onClick={onMore}>
							더보기
						</button>
					) : null}
				</div>
			</div>

			<div ref={scrollerRef} className="dash-carousel">
				{items?.length ? items.map(renderItem) : <div className="dash-empty">표시할 항목이 없습니다.</div>}
			</div>
		</section>
	);
}

export default function DashboardPage() {
	const navigate = useNavigate();
	const [posts, setPosts] = useState([]);
	const [recruits, setRecruits] = useState([]);
	const [users, setUsers] = useState([]);

	useEffect(() => {
		let mounted = true;

		const load = async () => {
			try {
				const [postRes, recruitRes] = await Promise.all([
					getPosts(0, 12),
					getRecruits({ page: 0, size: 12, onlyOpen: true }),
				]);

				const postList = safeGetList(postRes);
				const recruitList = safeGetList(recruitRes);

				if (!mounted) return;
				setPosts(postList);
				setRecruits(recruitList);

				// 인기 유저(샘플): 최근 게시글 작성자 일부의 followerCount를 조회해서 정렬
				const usernames = Array.from(
					new Set([
						...(postList || [])
							.map((p) => p?.author?.username || p?.user?.username)
							.filter(Boolean),
						...(recruitList || []).map((r) => r?.username).filter(Boolean),
					])
				)
					.filter((u) => u && u !== "익명")
					.slice(0, 10);

				const profiles = await Promise.all(
					usernames.map(async (u) => {
						try {
							const r = await getProfile(u);
							return r?.data?.data ?? r?.data;
						} catch {
							return null;
						}
					})
				);

				const normalized = (profiles || [])
					.filter(Boolean)
					.map((p) => ({
						username: p.username,
						name: p.name,
						profileImageUrl: p.profileImageUrl,
						followerCount: p.followerCount ?? 0,
					}))
					.filter((u) => u.username)
					.sort((a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0));

				// 프로필 조회가 실패해도 최소한 "샘플 유저"는 노출되게 폴백
				const fallbackUsers =
					normalized.length > 0
						? normalized
						: usernames.map((u) => ({ username: u, name: "", profileImageUrl: "", followerCount: 0 }));

				if (!mounted) return;
				setUsers(fallbackUsers);
			} catch (e) {
				console.error("Dashboard load failed:", e);
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, []);

	const postItems = useMemo(() => (posts || []).slice(0, 12), [posts]);
	const recruitItems = useMemo(() => (recruits || []).slice(0, 12), [recruits]);
	const userItems = useMemo(() => (users || []).slice(0, 12), [users]);

	return (
		<div className="sns-page">
			<div className="sns-container dash-page">
				<div className="sns-hero-card dash-hero">
					<div className="sns-hero-badge">DEVSO</div>
					<div className="dash-hero-title">대시보드</div>
					<div className="dash-hero-subtitle">
						게시글 · 팀원모집 · 인기 유저를 한 번에 둘러보세요.
					</div>
				</div>

				<AutoCarousel
					title="최신 게시글"
					subtitle="클릭하면 게시글 상세로 이동합니다."
					items={postItems}
					onMore={() => navigate("/")}
					renderItem={(p) => (
						(() => {
							const authorUsername = p?.author?.username || p?.user?.username || "익명";
							const thumb =
								(p.imageUrl ? getImageUrl(p.imageUrl) : null) ||
								(extractFirstMarkdownImageUrl(p.content)
									? getImageUrl(extractFirstMarkdownImageUrl(p.content))
									: null);

							return (
						<button
							key={p.id}
							type="button"
							className={`dash-card ${thumb ? "dash-card-with-thumb" : ""}`}
							onClick={() => navigate(`/posts/${p.id}`)}
						>
							{thumb ? (
								<div className="dash-card-thumb" aria-hidden="true">
									<img src={thumb} alt="" />
								</div>
							) : null}

							<div className="dash-card-body">
								<div className="dash-card-top">
									<div className="dash-card-title">{p.title}</div>
									<div className="dash-card-meta">
										<span className="dash-chip">{formatRelativeTime(p.createdAt)}</span>
										<span className="dash-dot">·</span>
										<span className="dash-muted">by {authorUsername}</span>
									</div>
								</div>
								<div className="dash-card-bottom">
									<div className="dash-stats">
										<span>👁 {p.viewCount ?? 0}</span>
										<span>❤️ {p.likeCount ?? 0}</span>
										<span>💬 {p.commentCount ?? 0}</span>
									</div>
								</div>
							</div>
						</button>
							);
						})()
					)}
				/>

				<AutoCarousel
					title="팀원 모집글"
					subtitle="클릭하면 모집글 상세로 이동합니다."
					items={recruitItems}
					onMore={() => navigate("/recruits")}
					renderItem={(r) => (
						<button
							key={r.id}
							type="button"
							className="dash-card dash-card-recruit"
							onClick={() => navigate(`/recruits/${r.id}`)}
						>
							<div className="dash-card-body">
								<div className="dash-card-top">
									<div className="dash-card-title">{r.title}</div>
									<div className="dash-card-meta">
										<span className="dash-chip">{r.type === "STUDY" ? "스터디" : "프로젝트"}</span>
										<span className="dash-dot">·</span>
										<span className="dash-muted">by {r.username ?? "익명"}</span>
									</div>
								</div>
								<div className="dash-card-bottom">
									<div className="dash-stats">
										<span>👁 {r.viewCount ?? 0}</span>
										<span>🔖 {r.bookmarkCount ?? 0}</span>
										<span>💬 {r.commentCount ?? 0}</span>
									</div>
								</div>
							</div>
						</button>
					)}
				/>

				<AutoCarousel
					title="인기 유저"
					subtitle="최근 작성자 기준 샘플 추천 유저입니다."
					items={userItems}
					renderItem={(u) => (
						<button
							key={u.username}
							type="button"
							className="dash-card dash-card-user"
							onClick={() => navigate(`/profile/${u.username}/posts`)}
						>
							<div className="dash-user-row">
								<div className="dash-user-avatar">
									{u.profileImageUrl ? (
										<img src={getImageUrl(u.profileImageUrl)} alt={u.username} />
									) : (
										<div className="dash-user-fallback" />
									)}
								</div>
								<div className="dash-user-info">
									<div className="dash-user-username">{u.username}</div>
									<div className="dash-user-sub">{u.name || " "}</div>
								</div>
							</div>
							<div className="dash-card-bottom">
								<div className="dash-stats">
									<span>👥 팔로워 {u.followerCount ?? 0}</span>
								</div>
							</div>
						</button>
					)}
				/>
			</div>
		</div>
	);
}


