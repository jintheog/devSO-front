import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

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
	uploadFile,
	getImageUrl,
} from "../api";

const List = Quill.import("formats/list");
Quill.register(List, true);

export default function RecruitCreatePage() {
	const navigate = useNavigate();
	const location = useLocation();
	const quillRef = useRef(null);

	const editData = location.state?.editData;
	const isEditMode = !!editData;

	const [title, setTitle] = useState(editData?.title || "");
	const [content, setContent] = useState(editData?.content || "");
	const [deadLine, setDeadLine] = useState(
		editData?.deadLine ? editData.deadLine.split("T")[0] : ""
	);
	const [contactInfo, setContactInfo] = useState(editData?.contactInfo || "");

	const [type, setType] = useState(null);
	const [position, setPosition] = useState([]);
	const [progressType, setProgressType] = useState(null);
	const [duration, setDuration] = useState(null);
	const [totalCount, setTotalCount] = useState(null);
	const [contactMethod, setContactMethod] = useState(null);
	const [selectedStacks, setSelectedStacks] = useState([]);
	const [activeCategory, setActiveCategory] = useState("모두보기");

	const [options, setOptions] = useState({
		types: [],
		positions: [],
		stacks: [],
		progress: [],
		contacts: [],
		durations: [],
		members: [],
	});

	// 이미지 핸들러: 서버 응답 { data: { url: "..." } } 구조 반영
	const imageHandler = () => {
		const input = document.createElement("input");
		input.setAttribute("type", "file");
		input.setAttribute("accept", "image/*");
		input.click();

		input.onchange = async () => {
			const file = input.files[0];
			if (!file) return;

			try {
				const res = await uploadFile(file);

				// 서버 응답 구조에서 'url' 필드 추출
				let path = "";
				if (res.data && res.data.data && res.data.data.url) {
					path = res.data.data.url;
				} else if (res.data && res.data.url) {
					path = res.data.url;
				}

				if (!path || typeof path !== "string") {
					console.error("서버 응답에서 url을 찾을 수 없습니다:", res.data);
					return;
				}

				const url = getImageUrl(path);

				const quill = quillRef.current.getEditor();
				const range = quill.getSelection();
				quill.insertEmbed(range.index, "image", url);
				quill.setSelection(range.index + 1);
			} catch (err) {
				console.error("이미지 업로드 실패:", err);
				alert("이미지 업로드에 실패했습니다.");
			}
		};
	};

	const modules = useMemo(
		() => ({
			toolbar: {
				container: [
					[{ header: [1, 2, false] }],
					["bold", "italic", "underline", "strike"],
					[{ list: "ordered" }, { list: "bullet" }],
					["image", "link"],
				],
				handlers: {
					image: imageHandler,
				},
			},
		}),
		[]
	);

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
		<div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
			<h1 className="text-3xl font-bold mb-8">
				{isEditMode ? "모집글 수정" : "팀원 모집글 작성"}
			</h1>
			<form onSubmit={handleSubmit} className="space-y-10">
				<section className="space-y-4">
					<h2 className="font-bold text-lg flex items-center gap-2">
						<span className="text-white bg-yellow-400 w-6 h-6 flex justify-center items-center rounded-full text-sm">
							1
						</span>
						프로젝트 기본 정보를 입력해주세요.
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<div>
							<label className="block mb-1 font-semibold text-gray-700 text-sm">
								모집 구분
							</label>
							<Select
								options={options.types}
								value={type}
								onChange={setType}
								placeholder="선택"
								required
							/>
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700 text-sm">
								모집 인원
							</label>
							<Select
								options={options.members}
								value={totalCount}
								onChange={setTotalCount}
								placeholder="인원 선택"
								required
							/>
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700 text-sm">
								진행 방식
							</label>
							<Select
								options={options.progress}
								value={progressType}
								onChange={setProgressType}
								placeholder="선택"
								required
							/>
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700 text-sm">
								모집 마감일
							</label>
							<input
								type="date"
								value={deadLine}
								onChange={(e) => setDeadLine(e.target.value)}
								className="w-full border px-3 py-[0.38rem] rounded-md focus:outline-none border-gray-300"
								required
							/>
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700 text-sm">
								모집 포지션
							</label>
							<Select
								options={options.positions}
								isMulti
								value={position}
								onChange={setPosition}
								placeholder="포지션 선택"
							/>
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700 text-sm">
								연락 방법
							</label>
							<Select
								options={options.contacts}
								value={contactMethod}
								onChange={setContactMethod}
								placeholder="선택"
								required
							/>
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700 text-sm">
								진행 기간
							</label>
							<Select
								options={options.durations}
								value={duration}
								onChange={setDuration}
								placeholder="선택"
								required
							/>
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700 text-sm">
								연락처
							</label>
							<input
								type="text"
								value={contactInfo}
								placeholder="링크 또는 연락처"
								onChange={(e) => setContactInfo(e.target.value)}
								className="w-full border px-3 py-[0.38rem] rounded-md focus:outline-none border-gray-300"
								required
							/>
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<label className="block font-semibold text-gray-700 text-sm">
						기술 스택
					</label>
					<div className="border rounded-xl overflow-hidden shadow-sm bg-white">
						<div className="flex bg-gray-50 border-b overflow-x-auto no-scrollbar">
							{["모두보기", "프론트엔드", "백엔드", "모바일", "기타"].map(
								(cat) => (
									<button
										key={cat}
										type="button"
										className={`px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
											activeCategory === cat
												? "bg-white text-indigo-600 border-b-2 border-indigo-600"
												: "text-gray-500 hover:text-gray-700"
										}`}
										onClick={() => setActiveCategory(cat)}
									>
										{cat}
									</button>
								)
							)}
						</div>
						<div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 p-5 min-h-37.5">
							{filteredStacks.map((s) => {
								const isSelected = selectedStacks.includes(s.value);
								return (
									<button
										key={s.value}
										type="button"
										onClick={() => handleStackToggle(s.value)}
										className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border transition-all ${
											isSelected
												? "border-indigo-600 bg-indigo-50"
												: "border-gray-200 bg-white"
										}`}
									>
										{s.imageUrl ? (
											<img
												src={s.imageUrl}
												alt={s.label}
												className="w-6 h-6 object-contain"
											/>
										) : (
											<div className="w-6 h-6 rounded-full bg-gray-100" />
										)}
										<span
											className={`text-sm font-medium ${
												isSelected ? "text-indigo-700" : "text-gray-700"
											}`}
										>
											{s.label}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="font-bold text-lg flex items-center gap-2">
						<span className="text-white bg-yellow-400 w-6 h-6 flex justify-center items-center rounded-full text-sm">
							2
						</span>
						프로젝트에 대해 소개해주세요.
					</h2>
					<input
						type="text"
						placeholder="글 제목"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full border border-gray-300 px-4 py-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
						required
					/>
					<div className="bg-white">
						<ReactQuill
							ref={quillRef}
							theme="snow"
							value={content}
							onChange={setContent}
							placeholder="내용을 입력해주세요."
							modules={modules}
							className="h-80 mb-12"
						/>
					</div>
				</section>

				<div className="flex justify-end gap-4 pt-4">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="px-6 py-2 border rounded-lg hover:bg-gray-100 font-bold text-gray-600"
					>
						취소
					</button>
					<button
						type="submit"
						className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold transition"
					>
						{isEditMode ? "수정하기" : "등록하기"}
					</button>
				</div>
			</form>
		</div>
	);
}