/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { swal } from "../utils/swal";

const EducationForm = ({ initialData = [], onDataChange }) => {
  const [educations, setEducations] = useState(initialData);
  
  // 백엔드 엔티티의 major 필드명과 일치시킴
  const [newEducation, setNewEducation] = useState({
    major: '',      // degree -> major로 변경
    schoolName: '',
    startDate: '',
    endDate: '',
  });
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (initialData && JSON.stringify(initialData) !== JSON.stringify(educations)) {
      setEducations(initialData);
    }
  }, [initialData, educations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEducation((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newEducation.schoolName) {
      swal.warn('학교/교육명을 입력해주세요.');
      return;
    }

    let updatedEducations;
    if (editingIndex !== null) {
      updatedEducations = [...educations];
      updatedEducations[editingIndex] = newEducation;
    } else {
      updatedEducations = [...educations, newEducation];
    }
    
    setEducations(updatedEducations);
    onDataChange(updatedEducations);
    
    // 초기화
    setNewEducation({
      major: '',
      schoolName: '',
      startDate: '',
      endDate: '',
    });
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setNewEducation(educations[index]);
  };

  const handleDelete = (index) => {
    const updatedEducations = educations.filter((_, i) => i !== index);
    setEducations(updatedEducations);
    onDataChange(updatedEducations);
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-[#6c5ce7]">🎓</span> 학력
      </h3>
      
      {educations.length > 0 && (
        <div className="space-y-4 mb-8">
          {educations.map((edu, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group transition-all hover:border-[#a29bfe]">
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong className="text-gray-900 font-medium">학력:</strong> {edu.major}</p>
                <p><strong className="text-gray-900 font-medium">학교/교육명:</strong> {edu.schoolName}</p>
                <p><strong className="text-gray-900 font-medium">기간:</strong> {edu.startDate} ~ {edu.endDate}</p>
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(index)} className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">수정</button>
                <button onClick={() => handleDelete(index)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          {editingIndex !== null ? '학력 수정' : '학력 추가'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">학력정보(전공)</label>
            <input
              type="text"
              name="major"
              value={newEducation.major}
              onChange={handleInputChange}
              placeholder="예: 컴퓨터공학 학사, 고등학교 졸업"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">학교/교육명</label>
            <input
              type="text"
              name="schoolName"
              value={newEducation.schoolName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">시작년월</label>
            <input
              type="month"
              name="startDate"
              value={newEducation.startDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">종료년월</label>
            <input
              type="month"
              name="endDate"
              value={newEducation.endDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
        </div>
        <button 
          type="button" 
          onClick={handleSubmit}
          className="w-full md:w-auto px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
        >
          {editingIndex !== null ? '수정 완료' : '추가'}
        </button>
      </div>
    </div>
  );
};

export default EducationForm;