/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

const ActivityForm = ({ initialData = [], onDataChange }) => {
  const [activities, setActivities] = useState(initialData);
  
  // 백엔드 엔티티 필드명과 일치시킴
  const [newActivity, setNewActivity] = useState({
    category: '',      // type -> category
    projectName: '',   // name -> projectName
    duration: '',      // startDate/endDate -> duration (문자열로 합침)
    content: '',       // description -> content
  });

  // 기간 입력을 위해 임시로 사용할 로컬 상태
  const [dates, setDates] = useState({ start: '', end: '' });
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (initialData && JSON.stringify(initialData) !== JSON.stringify(activities)) {
      setActivities(initialData);
    }
  }, [initialData, activities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 기간(start, end) 입력 처리
    if (name === 'start' || name === 'end') {
      const updatedDates = { ...dates, [name]: value };
      setDates(updatedDates);
      // duration 필드에 "YYYY-MM ~ YYYY-MM" 형태로 저장
      setNewActivity(prev => ({
        ...prev,
        duration: `${updatedDates.start} ~ ${updatedDates.end}`
      }));
    } else {
      setNewActivity((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newActivity.projectName) {
      alert('프로젝트 이름을 입력해주세요.');
      return;
    }

    let updatedActivities;
    if (editingIndex !== null) {
      updatedActivities = [...activities];
      updatedActivities[editingIndex] = newActivity;
    } else {
      updatedActivities = [...activities, newActivity];
    }
    
    setActivities(updatedActivities);
    onDataChange(updatedActivities);
    
    // 초기화
    setNewActivity({
      category: '',
      projectName: '',
      duration: '',
      content: '',
    });
    setDates({ start: '', end: '' });
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    const item = activities[index];
    setNewActivity(item);
    
    // "YYYY-MM ~ YYYY-MM" 형태를 다시 분리해서 input에 넣어줌
    if (item.duration && item.duration.includes(' ~ ')) {
      const [start, end] = item.duration.split(' ~ ');
      setDates({ start, end });
    }
  };

  const handleDelete = (index) => {
    const updatedActivities = activities.filter((_, i) => i !== index);
    setActivities(updatedActivities);
    onDataChange(updatedActivities);
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-[#6c5ce7]">🔥</span> 주요 활동
      </h3>
      
      {activities.length > 0 && (
        <div className="space-y-4 mb-8">
          {activities.map((activity, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group transition-all hover:border-[#a29bfe]">
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong className="text-gray-900 font-medium">활동 구분:</strong> {activity.category}</p>
                <p><strong className="text-gray-900 font-medium">프로젝트명:</strong> {activity.projectName}</p>
                <p><strong className="text-gray-900 font-medium">기간:</strong> {activity.duration}</p>
                <p><strong className="text-gray-900 font-medium">내용:</strong> {activity.content}</p>
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
          {editingIndex !== null ? '활동 수정' : '활동 추가'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">활동 구분</label>
            <input
              type="text"
              name="category"
              value={newActivity.category}
              onChange={handleInputChange}
              placeholder="예: 프로젝트, 스터디"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">프로젝트 이름</label>
            <input
              type="text"
              name="projectName"
              value={newActivity.projectName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">시작일</label>
            <input
              type="month"
              name="start"
              value={dates.start}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">종료일</label>
            <input
              type="month"
              name="end"
              value={dates.end}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">내용</label>
            <textarea
              name="content"
              value={newActivity.content}
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

export default ActivityForm;