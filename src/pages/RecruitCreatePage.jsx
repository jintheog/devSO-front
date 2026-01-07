import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../styles/PostList.css";

import {
	createRecruit,
	updateRecruit,
	getPositions,
	getTypes,
	getProgress,
	getTechStacks,
	getContactTypes,
	getDurationTypes,
	getMemberCount,
} from "../api";

// Quill 포맷 등록
const List = Quill.import("formats/list");
Quill.register(List, true);

export default function RecruitCreatePage() {
	const navigate = useNavigate();
	const location = useLocation();

	// 1. 수정 모드 확인 및 초기 데이터 설정
	const editData = location.state?.editData;
	const isEditMode = !!editData;

	// 폼 상태
	const [title, setTitle] = useState(editData?.title || "");
	const [content, setContent] = useState(editData?.content || "");
	const [deadLine, setDeadLine] = useState(
		editData?.deadLine ? editData.deadLine.split("T")[0] : ""
	);
	const [contactInfo, setContactInfo] = useState(editData?.contactInfo || "");

	// Select 컴포넌트용 객체 상태
	const [type, setType] = useState(null);
	const [position, setPosition] = useState([]);
	const [progressType, setProgressType] = useState(null);
	const [duration, setDuration] = useState(null);
	const [totalCount, setTotalCount] = useState(null);
	const [contactMethod, setContactMethod] = useState(null);

	// 기술 스택 관련 상태
	const [selectedStacks, setSelectedStacks] = useState([]);
	const [activeCategory, setActiveCategory] = useState("모두보기");

	// enum 옵션 상태
	const [options, setOptions] = useState({
		types: [],
		positions: [],
		stacks: [],
		progress: [],
		contacts: [],
		durations: [],
		members: [],
	});

	// 2. 데이터 불러오기 및 수정 데이터 매핑
	useEffect(() => {
		const fetchEnumsAndSetData = async () => {
			try {
				const [t, p, s, pr, c, d, m] = await Promise.all([
					getTypes(),
					getPositions(),
					getTechStacks(),
					getProgress(),
					getContactTypes(),
					getDurationTypes(),
					getMemberCount(),
				]);

				const mappedOptions = {
					types: t.data,
					positions: p.data,
					stacks: s.data,
					progress: pr.data,
					contacts: c.data,
					durations: d.data,
					members: m.data,
				};
				setOptions(mappedOptions);

				if (isEditMode && editData) {
					const findOption = (opts, val) => {
						if (val === undefined || val === null) return null;
						const targetVal = typeof val === "object" ? val.value : val;
						return (
							opts.find(
								(o) =>
									String(o.value) === String(targetVal) ||
									(o.key &&
										String(o.key).toUpperCase() ===
											String(targetVal).toUpperCase())
							) || null
						);
					};

					setType(findOption(mappedOptions.types, editData.type));
					setProgressType(
						findOption(mappedOptions.progress, editData.progressType)
					);
					setDuration(findOption(mappedOptions.durations, editData.duration));
					setContactMethod(
						findOption(mappedOptions.contacts, editData.contactMethod)
					);
					setTotalCount(findOption(mappedOptions.members, editData.totalCount));

					if (Array.isArray(editData.positions)) {
						const posItems = editData.positions.map((p) =>
							typeof p === "object" ? String(p.value) : String(p)
						);
						setPosition(
							mappedOptions.positions.filter(
								(o) =>
									posItems.includes(String(o.value)) ||
									(o.key && posItems.includes(String(o.key)))
							)
						);
					}

					if (Array.isArray(editData.stacks)) {
						const stackIds = editData.stacks.map((s) =>
							typeof s === "object" ? s.value : s
						);
						setSelectedStacks(stackIds);
					}
				}
			} catch (err) {
				console.error("데이터 로딩 실패", err);
			}
		};
		fetchEnumsAndSetData();
	}, [isEditMode, editData]);

	const handleStackToggle = (stackValue) => {
		setSelectedStacks((prev) =>
			prev.includes(stackValue)
				? prev.filter((id) => id !== stackValue)
				: [...prev, stackValue]
		);
	};

	const filteredStacks = options.stacks.filter((s) => {
		if (activeCategory === "모두보기") return true;
		const categoryMap = {
			프론트엔드: "FE",
			백엔드: "BE",
			모바일: "MOBILE",
			기타: "ETC",
		};
		return s.category === categoryMap[activeCategory];
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (content.replace(/<(.|\n)*?>/g, "").trim().length === 0) {
			alert("내용을 입력해주세요.");
			return;
		}

		const payload = {
			title,
			content,
			type: type?.value ?? null,
			positions: position.map((p) => p.value),
			progressType: progressType?.value ?? null,
			duration: duration?.value ?? null,
			stacks: selectedStacks,
			totalCount: totalCount ? Number(totalCount.value) : 0,
			deadLine,
			contactMethod: contactMethod?.value ?? null,
			contactInfo,
			imageUrl: editData?.imageUrl || "",
		};

		try {
			if (isEditMode) {
				await updateRecruit(editData.id, payload);
				alert("수정되었습니다.");
				navigate(`/recruits/${editData.id}`, { replace: true });
			} else {
				const res = await createRecruit(payload);
				alert("등록되었습니다.");
				navigate(`/recruits/${res.data.data.id}`);
			}
		} catch (err) {
			console.error("전송 에러:", err);
			alert("처리에 실패했습니다.");
		}
	};

	return (
		<div className="sns-page">
			<div className="sns-container">
				<div className="sns-surface auth-box" style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "left" }}>
					<h1 className="text-3xl font-black mb-8 text-gray-900">
						{isEditMode ? "모집글 수정" : "팀원 모집글 작성"}
					</h1>

					<form onSubmit={handleSubmit} className="space-y-10">
						<section className="space-y-4">
							<h2 className="font-bold text-lg flex items-center gap-2 text-gray-800">
								<span className="text-white bg-indigo-600 w-6 h-6 flex justify-center items-center rounded-full text-xs">
									1
								</span>
								프로젝트 기본 정보를 입력해주세요.
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<div>
									<label className="block mb-1 font-bold text-gray-700 text-sm">
										모집 구분
									</label>
									<Select
										options={options.types}
										value={type}
										onChange={setType}
										placeholder="선택"
										required
										styles={{
											control: (base) => ({
												...base,
												borderRadius: '10px',
												borderColor: '#e5e7eb',
												padding: '2px'
											})
										}}
									/>
								</div>
								<div>
									<label className="block mb-1 font-bold text-gray-700 text-sm">
										모집 인원
									</label>
									<Select
										options={options.members}
										value={totalCount}
										onChange={setTotalCount}
										placeholder="인원 선택"
										required
										styles={{
											control: (base) => ({
												...base,
												borderRadius: '10px',
												borderColor: '#e5e7eb',
												padding: '2px'
											})
										}}
									/>
								</div>
								<div>
									<label className="block mb-1 font-bold text-gray-700 text-sm">
										진행 방식
									</label>
									<Select
										options={options.progress}
										value={progressType}
										onChange={setProgressType}
										placeholder="선택"
										required
										styles={{
											control: (base) => ({
												...base,
												borderRadius: '10px',
												borderColor: '#e5e7eb',
												padding: '2px'
											})
										}}
									/>
								</div>
								<div>
									<label className="block mb-1 font-bold text-gray-700 text-sm">
										모집 마감일
									</label>
									<input
										type="date"
										value={deadLine}
										onChange={(e) => setDeadLine(e.target.value)}
										className="w-full border px-3 py-[0.55rem] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-100 border-gray-200"
										required
									/>
								</div>
								<div>
									<label className="block mb-1 font-bold text-gray-700 text-sm">
										모집 포지션
									</label>
									<Select
										options={options.positions}
										isMulti
										value={position}
										onChange={setPosition}
										placeholder="포지션 선택"
										styles={{
											control: (base) => ({
												...base,
												borderRadius: '10px',
												borderColor: '#e5e7eb',
												padding: '2px'
											})
										}}
									/>
								</div>
								<div>
									<label className="block mb-1 font-bold text-gray-700 text-sm">
										연락 방법
									</label>
									<Select
										options={options.contacts}
										value={contactMethod}
										onChange={setContactMethod}
										placeholder="선택"
										required
										styles={{
											control: (base) => ({
												...base,
												borderRadius: '10px',
												borderColor: '#e5e7eb',
												padding: '2px'
											})
										}}
									/>
								</div>
								<div>
									<label className="block mb-1 font-bold text-gray-700 text-sm">
										진행 기간
									</label>
									<Select
										options={options.durations}
										value={duration}
										onChange={setDuration}
										placeholder="선택"
										required
										styles={{
											control: (base) => ({
												...base,
												borderRadius: '10px',
												borderColor: '#e5e7eb',
												padding: '2px'
											})
										}}
									/>
								</div>
								<div>
									<label className="block mb-1 font-bold text-gray-700 text-sm">
										연락처
									</label>
									<input
										type="text"
										value={contactInfo}
										placeholder="링크 또는 연락처"
										onChange={(e) => setContactInfo(e.target.value)}
										className="w-full border px-3 py-[0.55rem] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-100 border-gray-200"
										required
									/>
								</div>
							</div>
						</section>

						{/* 기술 스택 섹션 */}
						<section className="space-y-4">
							<label className="block font-bold text-gray-700 text-sm">
								기술 스택
							</label>
							<div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
								<div className="flex bg-gray-50/50 border-b border-gray-100 overflow-x-auto no-scrollbar">
									{["모두보기", "프론트엔드", "백엔드", "모바일", "기타"].map(
										(cat) => (
											<button
												key={cat}
												type="button"
												className={`px-6 py-4 text-sm font-bold transition-all whitespace-nowrap ${
													activeCategory === cat
														? "bg-white text-indigo-600 border-b-2 border-indigo-600"
														: "text-gray-400 hover:text-gray-600"
												}`}
												onClick={() => setActiveCategory(cat)}
											>
												{cat}
											</button>
										)
									)}
								</div>

								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
										gap: "12px",
										padding: "24px",
										minHeight: "150px",
										alignContent: "start",
										justifyContent: "start",
									}}
								>
									{filteredStacks.length > 0 ? (
										filteredStacks.map((s) => {
											const isSelected = selectedStacks.includes(s.value);
											return (
												<button
													key={s.value}
													type="button"
													onClick={() => handleStackToggle(s.value)}
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "flex-start",
														gap: "10px",
														padding: "10px 16px",
														borderRadius: "14px",
														border: isSelected
															? "2px solid #6366f1"
															: "1px solid #f3f4f6",
														backgroundColor: isSelected ? "#f5f3ff" : "#fff",
														transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
														cursor: "pointer",
														width: "100%",
														boxSizing: "border-box",
														boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.12)' : 'none'
													}}
												>
													{s.imageUrl ? (
														<img
															src={s.imageUrl}
															alt={s.label}
															style={{
																width: "22px",
																height: "22px",
																objectFit: "contain",
															}}
														/>
													) : (
														<div
															style={{
																width: "22px",
																height: "22px",
																borderRadius: "50%",
																backgroundColor: "#f3f4f6",
															}}
														/>
													)}
													<span
														style={{
															fontSize: "13.5px",
															fontWeight: "700",
															color: isSelected ? "#4338ca" : "#4b5563",
															whiteSpace: "nowrap",
															overflow: "hidden",
															textOverflow: "ellipsis",
														}}
													>
														{s.label}
													</span>
												</button>
											);
										})
									) : (
										<div
											style={{
												gridColumn: "1 / -1",
												textAlign: "center",
												padding: "40px 0",
												color: "#9ca3af",
												fontWeight: "500"
											}}
										>
											등록된 스택이 없습니다.
										</div>
									)}
								</div>
							</div>

							{selectedStacks.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-3 p-4 bg-indigo-50/30 rounded-2xl border border-dashed border-indigo-200">
									<span className="w-full text-[11px] font-black text-indigo-400 mb-1 uppercase tracking-widest">
										선택된 기술 스택
									</span>
									{options.stacks
										.filter((s) => selectedStacks.includes(s.value))
										.map((s) => (
											<div
												key={s.value}
												className="flex items-center gap-2 bg-white border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm"
											>
												{s.imageUrl && (
													<img
														src={s.imageUrl}
														alt=""
														className="w-4 h-4 object-contain"
													/>
												)}
												{s.label}
												<button
													type="button"
													onClick={() => handleStackToggle(s.value)}
													className="ml-1 text-indigo-300 hover:text-indigo-600 font-black transition-colors"
												>
													×
												</button>
											</div>
										))}
								</div>
							)}
						</section>

						<section className="space-y-4">
							<h2 className="font-bold text-lg flex items-center gap-2 text-gray-800">
								<span className="text-white bg-indigo-600 w-6 h-6 flex justify-center items-center rounded-full text-xs">
									2
								</span>
								프로젝트에 대해 소개해주세요.
							</h2>
							<input
								type="text"
								placeholder="글 제목"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="w-full border border-gray-200 px-5 py-3 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300"
								required
							/>
							<div className="bg-white rounded-xl overflow-hidden border border-gray-200">
								<ReactQuill
									theme="snow"
									value={content}
									onChange={setContent}
									placeholder="내용을 입력해주세요."
									className="h-80 mb-12"
								/>
							</div>
						</section>

						<div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
							<button
								type="button"
								onClick={() => navigate(-1)}
								className="sns-btn sns-btn-secondary px-8"
							>
								취소
							</button>
							<button
								type="submit"
								className="sns-btn sns-btn-primary px-10"
							>
								{isEditMode ? "수정하기" : "등록하기"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
