import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "../styles/AiChecklistModal.css";

const AiChecklistModal = ({
	isOpen,
	onClose,
	data, // 백엔드에서 받은 전체 데이터 (score 포함)
	isLoading,
	onRefresh,
	onCalculate,
}) => {
	const [checkedQuestions, setCheckedQuestions] = useState([]);
	const [isCalculating, setIsCalculating] = useState(false);

	// 모달이 열릴 때 체크박스 초기화
	useEffect(() => {
		if (isOpen) {
			setCheckedQuestions([]);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	// 백엔드에서 온 데이터 내부에 점수가 있는지 확인
	// data.score가 0일 수도 있으므로 null/undefined 체크
	const hasSavedScore = data && data.score !== null && data.score !== undefined;

	const checklist = data?.checkList || [];
	const tip = data?.matchTip || "분석 결과를 불러오는 중입니다.";
	const displayScore = data?.score;

	const handleCheckChange = (questionText) => {
		setCheckedQuestions((prev) =>
			prev.includes(questionText)
				? prev.filter((q) => q !== questionText)
				: [...prev, questionText]
		);
	};

	const handleGetScore = async () => {
		setIsCalculating(true);
		try {
			// onCalculate 호출 시 백엔드에서 점수를 계산하고 data 상태를 업데이트함
			await onCalculate(checkedQuestions);
		} catch (error) {
			alert("점수 계산 중 오류가 발생했습니다.");
		} finally {
			setIsCalculating(false);
		}
	};

	return (
		<div className="ai-modal-overlay" onClick={onClose}>
			<div className="ai-modal-container" onClick={(e) => e.stopPropagation()}>
				<div className="ai-modal-header flex justify-between items-center">
					<h2 className="flex items-center gap-2">
						<Icon icon="hugeicons:ai-cloud" className="text-indigo-600" />
						AI 자가진단
					</h2>
					<div className="flex items-center gap-2">
						{!isLoading && (
							<button
								onClick={() => onRefresh(true)} // true 전달하여 서버에서 새 질문 생성
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								title="새로고침"
							>
								<Icon
									icon="mdi:refresh"
									width="20"
									height="20"
									className="text-gray-400 hover:text-indigo-600"
								/>
							</button>
						)}
						<button className="close-x-btn" onClick={onClose}>
							&times;
						</button>
					</div>
				</div>

				{isLoading ? (
					<div className="ai-modal-loading">
						<div className="ai-spinner"></div>
						<p className="text-gray-500 text-sm">Gemini가 분석 중입니다...</p>
					</div>
				) : (
					<div className="ai-modal-content" style={{ marginTop: "20px" }}>
						{/* 1. 결과 화면 (저장된 점수가 있을 때) */}
						{hasSavedScore ? (
							<div className="ai-score-result text-center py-6">
								<div
									className="score-circle mb-4"
									style={{
										fontSize: "48px",
										fontWeight: 800,
										color: "#4f46e5",
									}}
								>
									{displayScore}
									<span style={{ fontSize: "20px" }}>점</span>
								</div>
								<h3 className="font-bold text-lg mb-2">
									{displayScore >= 80
										? "🎉 최고의 파트너 후보입니다!"
										: displayScore >= 50
										? "👍 긍정적인 시너지가 기대됩니다."
										: "🤔 조금 더 고민이 필요해 보여요."}
								</h3>
								<div
									className="ai-match-tip"
									style={{ textAlign: "left", marginTop: "20px" }}
								>
									<strong>💡 AI 조언</strong>
									<p>{tip}</p>
								</div>
								<div className="flex gap-2 mt-6">
									<button
										className="ai-retry-btn flex-1 p-3 bg-gray-100 rounded-xl font-bold"
										onClick={() => onRefresh(true)} // '다시 체크' 클릭 시 서버 데이터 리프레시
									>
										다시 체크
									</button>
									<button className="ai-done-btn flex-1" onClick={onClose}>
										확인 완료
									</button>
								</div>
							</div>
						) : (
							/* 2. 질문지 화면 (점수가 없을 때) */
							<>
								<div
									className="ai-check-list"
									style={{ maxHeight: "350px", overflowY: "auto" }}
								>
									{checklist.map((item, idx) => (
										<label
											key={idx}
											className="ai-check-item"
											style={{
												display: "flex",
												gap: "10px",
												cursor: "pointer",
												marginBottom: "12px",
											}}
										>
											<input
												type="checkbox"
												checked={checkedQuestions.includes(item.question)}
												onChange={() => handleCheckChange(item.question)}
												style={{ marginTop: "4px" }}
											/>
											<div className="ai-info">
												<span className="ai-tag">#{item.target}</span>
												<div
													className="ai-question"
													style={{ fontWeight: 600 }}
												>
													{item.question}
												</div>
											</div>
										</label>
									))}
								</div>
								<div className="ai-match-tip">
									<strong>💡 AI 조언</strong>
									<p>{tip}</p>
								</div>
								<button
									className="ai-done-btn"
									onClick={handleGetScore}
									disabled={isCalculating}
								>
									{isCalculating ? "계산 중..." : "나의 적합도 점수 확인하기"}
								</button>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default AiChecklistModal;
