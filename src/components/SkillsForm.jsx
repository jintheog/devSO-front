/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useEffect } from 'react';

const SkillsForm = ({ initialData = [], onDataChange }) => {
  const [skills, setSkills] = useState(initialData);
  const [newSkill, setNewSkill] = useState({ name: '', level: '중' });
  const [editingIndex, setEditingIndex] = useState(null);


useEffect(() => {
  if (initialData) {
    setSkills(initialData);
  }
}, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSkill({ ...newSkill, [name]: value });
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newSkill.name) return;

    let updatedSkills;
    if (editingIndex !== null) {
      updatedSkills = [...skills];
      updatedSkills[editingIndex] = newSkill;
    } else {
      updatedSkills = [...skills, newSkill];
    }
    setSkills(updatedSkills);
    onDataChange(updatedSkills);
    setNewSkill({ name: '', level: '중' });
    setEditingIndex(null);
  };

  const handleEditItem = (index) => {
    setNewSkill(skills[index]);
    setEditingIndex(index);
  };

  const handleDeleteItem = (index) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    setSkills(updatedSkills);
    onDataChange(updatedSkills);
  };

  return (
    <div className="form-section">
      <h3>기술 스택 (Skills)</h3>
      <div className="item-list">
        {skills.map((skill, index) => (
          <div key={index} className="item">
            <div className="item-details">
              <p><strong>{skill.name}</strong> ({skill.level})</p>
            </div>
            <div className="item-actions">
              <button type="button" onClick={() => handleEditItem(index)} className="edit-btn">수정</button>
              <button type="button" onClick={() => handleDeleteItem(index)} className="delete-btn">삭제</button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-item-form">
        <h4>{editingIndex !== null ? '스킬 수정' : '새 스킬 추가'}</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>기술명</label>
            <input
              type="text"
              name="name"
              value={newSkill.name}
              onChange={handleInputChange}
              placeholder="예: React"
            />
          </div>
          <div className="form-group">
            <label>숙련도</label>
            <select name="level" value={newSkill.level} onChange={handleInputChange}>
              <option value="상">상</option>
              <option value="중">중</option>
              <option value="하">하</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <button type="button" onClick={handleAddItem}>
              {editingIndex !== null ? '수정 완료' : '추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsForm;
