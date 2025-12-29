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
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-[#6c5ce7]">🛠</span> 기술 스택
      </h3>
      
      {skills.length > 0 && (
        <div className="space-y-4 mb-8">
          {skills.map((skill, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group transition-all hover:border-[#a29bfe]">
              <div className="space-y-1 text-sm text-gray-600 flex items-center gap-2">
                <span className="font-bold text-gray-900">{skill.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  ['상', 'High'].includes(skill.level) ? 'bg-green-100 text-green-700' :
                  ['중', 'Medium'].includes(skill.level) ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {skill.level}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => handleEditItem(index)} className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">수정</button>
                <button type="button" onClick={() => handleDeleteItem(index)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          {editingIndex !== null ? '스킬 수정' : '새 스킬 추가'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">기술명</label>
            <input
              type="text"
              name="name"
              value={newSkill.name}
              onChange={handleInputChange}
              placeholder="예: React"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">숙련도</label>
            <select 
              name="level" 
              value={newSkill.level} 
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors appearance-none bg-white"
            >
              <option value="상">상</option>
              <option value="중">중</option>
              <option value="하">하</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button 
              type="button" 
              onClick={handleAddItem}
              className="w-full md:w-auto px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
            >
              {editingIndex !== null ? '수정 완료' : '추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsForm;
