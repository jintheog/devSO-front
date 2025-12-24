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
    <div className="form-section">
      <h3>주요 활동</h3>
      <div className="item-list">
        {activities.map((activity, index) => (
          <div key={index} className="item">
            <div className="item-details">
              <p><strong>활동 구분:</strong> {activity.category}</p>
              <p><strong>프로젝트명:</strong> {activity.projectName}</p>
              <p><strong>기간:</strong> {activity.duration}</p>
              <p><strong>내용:</strong> {activity.content}</p>
            </div>
            <div className="item-actions">
              <button onClick={() => handleEdit(index)} className="edit-btn">수정</button>
              <button onClick={() => handleDelete(index)} className="delete-btn">삭제</button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-item-form">
        <h4>{editingIndex !== null ? '활동 수정' : '활동 추가'}</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>활동 구분</label>
            <input
              type="text"
              name="category"
              value={newActivity.category}
              onChange={handleInputChange}
              placeholder="예: 프로젝트, 스터디"
            />
          </div>
          <div className="form-group">
            <label>프로젝트 이름</label>
            <input
              type="text"
              name="projectName"
              value={newActivity.projectName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>시작일</label>
            <input
              type="month"
              name="start"
              value={dates.start}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>종료일</label>
            <input
              type="month"
              name="end"
              value={dates.end}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>내용</label>
          <textarea
            name="content"
            value={newActivity.content}
            onChange={handleInputChange}
          />
        </div>
        <button type="button" onClick={handleSubmit}>
          {editingIndex !== null ? '수정 완료' : '추가'}
        </button>
      </div>
    </div>
  );
};

export default ActivityForm;