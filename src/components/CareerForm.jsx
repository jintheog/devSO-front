/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { swal } from "../utils/swal";

const CareerForm = ({ initialData = [], onDataChange }) => {
  const [careers, setCareers] = useState(initialData);
  
  // 백엔드 엔티티의 필드명(task)과 일치하도록 수정
  const [newCareer, setNewCareer] = useState({
    companyName: '',
    department: '',
    startDate: '',
    endDate: '',
    position: '',
    task: '', // duties -> task로 변경
  });
  
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (initialData && JSON.stringify(initialData) !== JSON.stringify(careers)) {
      setCareers(initialData);
    }
  }, [initialData, careers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCareer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newCareer.companyName) {
      swal.warn('회사명을 입력해주세요.');
      return;
    }

    let updatedCareers;
    if (editingIndex !== null) {
      updatedCareers = [...careers];
      updatedCareers[editingIndex] = newCareer;
    } else {
      updatedCareers = [...careers, newCareer];
    }
    
    setCareers(updatedCareers);
    onDataChange(updatedCareers);
    
    // 초기화 시에도 task 필드 사용
    setNewCareer({
      companyName: '',
      department: '',
      startDate: '',
      endDate: '',
      position: '',
      task: '',
    });
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setNewCareer(careers[index]);
  };

  const handleDelete = (index) => {
    const updatedCareers = careers.filter((_, i) => i !== index);
    setCareers(updatedCareers);
    onDataChange(updatedCareers);
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-[#6c5ce7]">💼</span> 경력
      </h3>
      
      {careers.length > 0 && (
        <div className="space-y-4 mb-8">
          {careers.map((career, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group transition-all hover:border-[#a29bfe]">
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong className="text-gray-900 font-medium">회사명:</strong> {career.companyName}</p>
                <p><strong className="text-gray-900 font-medium">부서:</strong> {career.department}</p>
                <p><strong className="text-gray-900 font-medium">기간:</strong> {career.startDate} ~ {career.endDate}</p>
                <p><strong className="text-gray-900 font-medium">직급:</strong> {career.position}</p>
                <p><strong className="text-gray-900 font-medium">담당업무:</strong> {career.task}</p>
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
          {editingIndex !== null ? '경력 수정' : '경력 추가'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">회사명</label>
            <input
              type="text"
              name="companyName"
              value={newCareer.companyName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">부서명</label>
            <input
              type="text"
              name="department"
              value={newCareer.department}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">입사년월</label>
            <input
              type="month"
              name="startDate"
              value={newCareer.startDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">퇴사년월</label>
            <input
              type="month"
              name="endDate"
              value={newCareer.endDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">직급/직책</label>
            <input
              type="text"
              name="position"
              value={newCareer.position}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">담당직무</label>
            <textarea
              name="task"
              value={newCareer.task}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors resize-none"
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

export default CareerForm;