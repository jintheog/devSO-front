import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	getRecruitDetail,
	deleteRecruit,
	toggleStatus,
	toggleBookmark,
	getTypes,
	getPositions,
	getTechStacks,
	getProgress,
	getContactTypes,
	getDurationTypes,
	getMemberCount,
	getRecruitComments,
	createRecruitComment,
	updateRecruitComment,
	deleteRecruitComment,
	getImageUrl,
} from "../api";
import { useAuth } from "../contexts/AuthContext";
import { Icon } from "@iconify/react";
import { Avatar } from "@mui/material";

import "react-quill-new/dist/quill.snow.css";

export default function RecruitDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [recruit, setRecruit] = useState(null);
	const [comments, setComments] = useState([]);
	const [commentInput, setCommentInput] = useState("");
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editInput, setEditInput] = useState("");
	const [replyTo, setReplyTo] = useState(null);

	const [options, setOptions] = useState({
		types: [],
		positions: [],
		stacks: [],
		progress: [],
		contacts: [],
		durations: [],
		members: [],
	});

	const fetchData = async () => {
		try {
			const [detailRes, commentRes, t, p, s, pr, c, d, m] = await Promise.all([
				getRecruitDetail(id),
				getRecruitComments(id),
				getTypes(),
				getPositions(),
				getTechStacks(),
				getProgress(),
				getContactTypes(),
				getDurationTypes(),
				getMemberCount(),
			]);

			setRecruit(detailRes.data.data);
			setComments(commentRes.data.data || []);
			setOptions({
				types: t.data,
				positions: p.data,
				stacks: s.data,
				progress: pr.data,
				contacts: c.data,
				durations: d.data,
				members: m.data,
			});
		} catch (err) {
			console.error("데이터 로딩 실패", err);
		}
	};

	useEffect(() => {
		if (id) fetchData();
	}, [id]);

	const getLabel = (optionList, serverValue) => {
		if (
			!optionList ||
			optionList.length === 0 ||
			serverValue === undefined ||
			serverValue === null
		)
			return serverValue;
		const found = optionList.find((o) => {
			const isValueMatch = String(o.value) === String(serverValue);
			const isKeyMatch =
				o.key &&
				String(o.key).toUpperCase() === String(serverValue).toUpperCase();
			return isValueMatch || isKeyMatch;
		});
		return found ? found.label : serverValue;
	};

	const getStackDetails = (stackData) => {
		if (!stackData || !options.stacks.length) return [];
		return stackData.map((item) => {
			const val = typeof item === "object" ? item.value : item;
			return (
				options.stacks.find((s) => String(s.value) === String(val)) || {
					label: val,
				}
			);
		});
	};

	// 🌟 댓글 등록 (등록 후 전체 데이터를 다시 불러와서 카운트와 목록을 갱신합니다)
	const handleCommentSubmit = async () => {
		if (!commentInput.trim()) return;
		try {
			await createRecruitComment(id, {
				content: commentInput,
				parentId: replyTo ? replyTo.id : null,
			});
			setCommentInput("");
			setReplyTo(null);
			await fetchData(); // 게시글 상세정보(카운트 포함)와 댓글목록 갱신
		} catch (err) {
			alert("댓글 등록에 실패했습니다.");
		}
	};

	// 🌟 댓글 삭제 (A안: 부모 삭제 시 자식까지 삭제되므로 새로고침이 가장 정확합니다)
	const handleCommentDelete = async (commentId) => {
		if (
			!window.confirm(
				"댓글을 삭제하시겠습니까? (답글이 있는 경우 답글도 함께 삭제됩니다)"
			)
		)
			return;
		try {
			await deleteRecruitComment(id, commentId);
			await fetchData(); // Soft Delete된 후 카운트가 줄어든 데이터를 새로 가져옴
		} catch (err) {
			alert("댓글 삭제에 실패했습니다.");
		}
	};

	const startEdit = (comment) => {
		setEditingCommentId(comment.id);
		setEditInput(comment.content);
		setReplyTo(null);
	};

	const handleCommentUpdate = async (commentId) => {
		if (!editInput.trim()) return;
		try {
			await updateRecruitComment(id, commentId, { content: editInput });
			setEditingCommentId(null);
			fetchData();
		} catch (err) {
			alert("댓글 수정에 실패했습니다.");
		}
	};

	const startReply = (comment) => {
		setReplyTo({ id: comment.id, username: comment.author?.username });
		setEditingCommentId(null);
		setCommentInput("");
		document.getElementById("comment-input-field")?.focus();
	};

	const handleBookmarkToggle = async () => {
		if (!user) {
			alert("로그인이 필요한 서비스입니다.");
			return;
		}
		try {
			await toggleBookmark(id);
			setRecruit((prev) => ({
				...prev,
				bookmarked: !prev.bookmarked,
				bookmarkCount: prev.bookmarked
					? prev.bookmarkCount - 1
					: prev.bookmarkCount + 1,
			}));
		} catch (err) {
			console.error("북마크 실패", err);
		}
	};

	const handleDelete = async () => {
		if (window.confirm("작성하신 글을 삭제 하시겠어요?")) {
			try {
				await deleteRecruit(id);
				alert("삭제되었습니다.");
				navigate("/recruits", { replace: true });
			} catch (err) {
				alert("삭제 실패");
			}
		}
	};

	const handleUpdate = () =>
		navigate("/recruits/create", { state: { editData: recruit } });

	const handleToggleStatus = async () => {
		const isClosing = recruit.status === "OPEN" || recruit.status === 1;
		if (
			window.confirm(
				isClosing ? "모집을 마감하시겠습니까?" : "모집을 다시 시작하시겠습니까?"
			)
		) {
			try {
				await toggleStatus(id);
				alert("상태가 변경되었습니다.");
				fetchData();
			} catch (err) {
				alert("상태 변경 실패");
			}
		}
	};

	if (!recruit)
		return (
			<div className="text-center py-20 text-gray-500 font-medium">
				데이터 로딩 중...
			</div>
		);

	const isOwner = user && recruit.username === user.username;

	return (
		<div className="max-w-4xl mx-auto px-6 py-10 bg-white min-h-screen">
			<button
				onClick={() => navigate("/recruits")}
				className="mb-8 text-gray-400 hover:text-black transition flex items-center gap-1"
			>
				<Icon icon="mdi:arrow-left" width="20" height="20" />
				<span className="text-sm font-medium">목록으로</span>
			</button>

			<header className="mb-12">
				<h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8 flex items-center gap-3">
					{(recruit.status === "CLOSED" ||
						recruit.status === 2 ||
						recruit.status === "CLOSE") && (
						<span className="bg-red-50 text-red-500 text-xs px-2 py-1 rounded font-bold uppercase shrink-0">
							마감
						</span>
					)}
					{recruit.title}
				</h1>
				<div className="flex justify-between items-center pb-8 border-b border-gray-50">
					<div className="flex items-center gap-3">
						<Avatar
							src={getImageUrl(recruit.profileImageUrl)}
							sx={{
								width: 40,
								height: 40,
								bgcolor: "#f5f5f5",
								border: "1px solid #eee",
							}}
						>
							😊
						</Avatar>
						<div className="flex flex-col">
							<span className="font-bold text-sm text-gray-800">
								{recruit.username || "익명"}
							</span>
							<span className="text-xs text-gray-400">
								{new Date(recruit.createdAt).toLocaleDateString("ko-KR")}
							</span>
						</div>
					</div>
					{isOwner && (
						<div className="flex gap-2">
							<button onClick={handleUpdate} className="detail-action-btn">
								수정
							</button>
							<button
								onClick={handleDelete}
								className="detail-action-btn hover:text-red-500"
							>
								삭제
							</button>
							<button
								onClick={handleToggleStatus}
								className="detail-action-btn text-blue-600 bg-blue-50 border-blue-100"
							>
								{recruit.status === "OPEN" || recruit.status === 1
									? "마감하기"
									: "마감취소"}
							</button>
						</div>
					)}
				</div>
			</header>

			<section className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-16 pb-12 border-b border-gray-50">
				<InfoItem
					label="모집 구분"
					value={getLabel(options.types, recruit.type)}
				/>
				<InfoItem
					label="진행 방식"
					value={getLabel(options.progress, recruit.progressType)}
				/>
				<InfoItem
					label="모집 인원"
					value={getLabel(options.members, recruit.totalCount)}
				/>
				<InfoItem label="시작 예정" value={recruit.deadLine} />
				<InfoItem
					label="연락 방법"
					value={getLabel(options.contacts, recruit.contactMethod)}
				/>
				<InfoItem
					label="예상 기간"
					value={getLabel(options.durations, recruit.duration)}
				/>
				<InfoItem
					label="모집 분야"
					value={recruit.positions?.map((p) => getLabel(options.positions, p))}
				/>
				<InfoItem
					label="사용 언어"
					value={getStackDetails(recruit.stacks)}
					isStack
				/>
			</section>

			<section className="py-12 border-b border-gray-50">
				<h2 className="text-xl font-bold mb-8 text-gray-900">프로젝트 소개</h2>
				<div className="ql-container ql-snow" style={{ border: "none" }}>
					<div
						className="ql-editor p-0! text-gray-700 leading-8 text-[17px]"
						dangerouslySetInnerHTML={{ __html: recruit.content }}
					/>
				</div>
			</section>

			<footer className="py-8 flex justify-between items-center border-b border-gray-50">
				<div className="flex items-center gap-6">
					<span className="text-gray-400 text-sm flex items-center gap-1">
						<Icon icon="mdi:eye-outline" width="18" height="18" />{" "}
						{recruit.viewCount || 0}
					</span>
					<button
						onClick={handleBookmarkToggle}
						className="flex items-center gap-1.5 transition-all active:scale-95"
					>
						<Icon
							icon={
								recruit.bookmarked ? "mdi:bookmark" : "mdi:bookmark-outline"
							}
							width="24"
							height="24"
							color={recruit.bookmarked ? "#fbbf24" : "#9ca3af"}
						/>
						<span
							className={`font-bold ${
								recruit.bookmarked ? "text-amber-500" : "text-gray-400"
							}`}
						>
							{recruit.bookmarkCount || 0}
						</span>
					</button>
				</div>
			</footer>

			{/* 댓글 섹션 */}
			<section className="mt-10 pb-20">
				<h3 className="font-bold mb-6 text-gray-900 text-lg">
					댓글{" "}
					<span className="text-gray-400 ml-1">
						{recruit.commentCount || 0}
					</span>
				</h3>

				<div className="bg-gray-50 p-5 rounded-2xl flex flex-col gap-3 border border-gray-100 shadow-sm mb-10">
					{replyTo && (
						<div className="flex justify-between items-center px-3 py-1.5 bg-blue-50 rounded-lg text-xs font-bold text-blue-600">
							<span>@{replyTo.username} 님에게 답글 남기는 중...</span>
							<button
								onClick={() => setReplyTo(null)}
								className="hover:text-red-500"
							>
								취소
							</button>
						</div>
					)}
					<div className="flex items-center gap-4">
						<Avatar
							src={getImageUrl(user?.profileImageUrl)}
							sx={{ width: 36, height: 36, bgcolor: "#fff" }}
						>
							👤
						</Avatar>
						<input
							id="comment-input-field"
							type="text"
							value={commentInput}
							onChange={(e) => setCommentInput(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && handleCommentSubmit()}
							placeholder={
								user
									? replyTo
										? "답글을 입력하세요..."
										: "댓글을 입력하세요..."
									: "로그인 후 이용 가능합니다."
							}
							disabled={!user}
							className="bg-transparent flex-1 focus:outline-none text-[15px]"
						/>
						<button
							onClick={handleCommentSubmit}
							disabled={!user || !commentInput.trim()}
							className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:bg-gray-200"
						>
							{replyTo ? "답글 등록" : "등록"}
						</button>
					</div>
				</div>

				<div className="space-y-8">
					{/* 🌟 parentId가 없는 최상위 댓글만 map을 돌립니다. (백엔드 로직과 맞춤) */}
					{comments
						.filter((c) => !c.parentId)
						.map((comment) => (
							<div key={comment.id} className="flex flex-col gap-4">
								<div className="flex gap-4 group">
									<Avatar
										src={getImageUrl(comment.author?.profileImageUrl)}
										sx={{
											width: 40,
											height: 40,
											bgcolor: "#f5f5f5",
											border: "1px solid #eee",
										}}
									>
										😊
									</Avatar>
									<div className="flex-1">
										<div className="flex items-center justify-between mb-1.5">
											<div className="flex items-center gap-2">
												<span className="font-bold text-[14px] text-gray-800">
													{comment.author?.username}
												</span>
												<span className="text-[12px] text-gray-400">
													{new Date(comment.createdAt).toLocaleDateString(
														"ko-KR"
													)}
												</span>
											</div>
											{comment.isOwner && editingCommentId !== comment.id && (
												<div className="flex gap-3">
													<button
														onClick={() => startEdit(comment)}
														className="text-xs font-bold text-gray-400 hover:text-blue-500"
													>
														수정
													</button>
													<button
														onClick={() => handleCommentDelete(comment.id)}
														className="text-xs font-bold text-gray-400 hover:text-red-500"
													>
														삭제
													</button>
												</div>
											)}
										</div>
										{editingCommentId === comment.id ? (
											<div className="mt-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
												<textarea
													value={editInput}
													onChange={(e) => setEditInput(e.target.value)}
													className="w-full bg-transparent p-2 text-[15px] focus:outline-none min-h-20 resize-none"
												/>
												<div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-50">
													<button
														onClick={() => setEditingCommentId(null)}
														className="text-xs font-bold px-4 py-2 bg-gray-100 text-gray-600 rounded-lg"
													>
														취소
													</button>
													<button
														onClick={() => handleCommentUpdate(comment.id)}
														className="text-xs font-bold px-4 py-2 bg-gray-900 text-white rounded-lg"
													>
														수정완료
													</button>
												</div>
											</div>
										) : (
											<>
												<p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap">
													{comment.content}
												</p>
												<button
													onClick={() => startReply(comment)}
													className="text-xs font-extrabold text-gray-400 mt-2 hover:text-gray-900 uppercase"
												>
													답글 달기
												</button>
											</>
										)}
									</div>
								</div>

								{/* 대댓글(자식) 렌더링 */}
								{comment.children?.map((child) => (
									<div
										key={child.id}
										className="ml-14 space-y-6 border-l-2 border-gray-50 pl-6 mt-2"
									>
										<div className="flex gap-3">
											<Avatar
												src={getImageUrl(child.author?.profileImageUrl)}
												sx={{
													width: 32,
													height: 32,
													bgcolor: "#f5f5f5",
													border: "1px solid #eee",
												}}
											>
												😊
											</Avatar>
											<div className="flex-1">
												<div className="flex items-center justify-between mb-1">
													<div className="flex items-center gap-2">
														<span className="font-bold text-[13px] text-gray-800">
															{child.author?.username}
														</span>
														<span className="text-[11px] text-gray-400">
															{new Date(child.createdAt).toLocaleDateString(
																"ko-KR"
															)}
														</span>
													</div>
													{child.isOwner && (
														<button
															onClick={() => handleCommentDelete(child.id)}
															className="text-[10px] font-bold text-gray-300 hover:text-red-500"
														>
															삭제
														</button>
													)}
												</div>
												<p className="text-[14px] text-gray-600 leading-relaxed">
													{child.content}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						))}
				</div>
			</section>

			<style>{`
        .detail-action-btn {
          padding: 6px 14px; font-size: 13px; font-weight: 700;
          background-color: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 6px; color: #6b7280; transition: all 0.2s;
        }
        .detail-action-btn:hover { background-color: #ffffff; color: #111827; border-color: #d1d5db; }
      `}</style>
		</div>
	);
}

function InfoItem({ label, value, isBadge, isStack }) {
	if (isStack && Array.isArray(value)) {
		return (
			<div className="flex items-start text-[15px]">
				<span className="w-24 text-gray-400 shrink-0 font-medium">{label}</span>
				<div className="flex flex-wrap gap-2">
					{value.map((stack, idx) => (
						<div
							key={idx}
							className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold"
						>
							{stack.imageUrl && (
								<img
									src={getImageUrl(stack.imageUrl)}
									alt={stack.label}
									className="w-3.5 h-3.5 object-contain"
								/>
							)}
							<span>{stack.label}</span>
						</div>
					))}
					{value.length === 0 && <span className="text-gray-300">미정</span>}
				</div>
			</div>
		);
	}
	const displayValue = Array.isArray(value)
		? value.filter(Boolean).join(", ")
		: value || "미정";
	return (
		<div className="flex items-start text-[15px]">
			<span className="w-24 text-gray-400 shrink-0 font-medium">{label}</span>
			<div className="flex flex-wrap gap-2">
				{isBadge && Array.isArray(value) ? (
					value.map((v, idx) => (
						<span
							key={idx}
							className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide"
						>
							{v}
						</span>
					))
				) : (
					<span className="text-gray-800 font-semibold">{displayValue}</span>
				)}
			</div>
		</div>
	);
}
