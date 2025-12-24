/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

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
      alert('학교/교육명을 입력해주세요.');
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
    <div className="form-section">
      <h3>학력</h3>
      <div className="item-list">
        {educations.map((edu, index) => (
          <div key={index} className="item">
            <div className="item-details">
              {/* major 필드 출력 */}
              <p><strong>학력:</strong> {edu.major}</p>
              <p><strong>학교/교육명:</strong> {edu.schoolName}</p>
              <p><strong>기간:</strong> {edu.startDate} ~ {edu.endDate}</p>
            </div>
            <div className="item-actions">
              <button onClick={() => handleEdit(index)} className="edit-btn">수정</button>
              <button onClick={() => handleDelete(index)} className="delete-btn">삭제</button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-item-form">
        <h4>{editingIndex !== null ? '학력 수정' : '학력 추가'}</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>학력정보(전공)</label>
            <input
              type="text"
              name="major" // name 속성을 major로 변경
              value={newEducation.major}
              onChange={handleInputChange}
              placeholder="예: 컴퓨터공학 학사, 고등학교 졸업"
            />
          </div>
          <div className="form-group">
            <label>학교/교육명</label>
            <input
              type="text"
              name="schoolName"
              value={newEducation.schoolName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>시작년월</label>
            <input
              type="month"
              name="startDate"
              value={newEducation.startDate}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>종료년월</label>
            <input
              type="month"
              name="endDate"
              value={newEducation.endDate}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <button type="button" onClick={handleSubmit}>
          {editingIndex !== null ? '수정 완료' : '추가'}
        </button>
      </div>
    </div>
  );
};

export default EducationForm;