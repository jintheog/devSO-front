/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

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
      alert('회사명을 입력해주세요.');
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
    <div className="form-section">
      <h3>경력</h3>
      <div className="item-list">
        {careers.map((career, index) => (
          <div key={index} className="item">
            <div className="item-details">
              <p><strong>회사명:</strong> {career.companyName}</p>
              <p><strong>부서:</strong> {career.department}</p>
              <p><strong>기간:</strong> {career.startDate} ~ {career.endDate}</p>
              <p><strong>직급:</strong> {career.position}</p>
              <p><strong>담당업무:</strong> {career.task}</p>
            </div>
            <div className="item-actions">
              <button onClick={() => handleEdit(index)} className="edit-btn">수정</button>
              <button onClick={() => handleDelete(index)} className="delete-btn">삭제</button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-item-form">
        <h4>{editingIndex !== null ? '경력 수정' : '경력 추가'}</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>회사명</label>
            <input
              type="text"
              name="companyName"
              value={newCareer.companyName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>부서명</label>
            <input
              type="text"
              name="department"
              value={newCareer.department}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>입사년월</label>
            <input
              type="month"
              name="startDate"
              value={newCareer.startDate}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>퇴사년월</label>
            <input
              type="month"
              name="endDate"
              value={newCareer.endDate}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>직급/직책</label>
            <input
              type="text"
              name="position"
              value={newCareer.position}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>담당직무</label>
            <textarea
              name="task" // name 속성을 task로 변경
              value={newCareer.task}
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

export default CareerForm;