/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';

const SkillsForm = ({ initialData = [], options = {}, onDataChange }) => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', level: '중', imageUrl: '' });
  const [editingIndex, setEditingIndex] = useState(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("모두보기");
  const dropdownRef = useRef(null);
  
  const { stacks = [] } = options;

  const getEnrichedSkill = (skill) => {
    const match = stacks.find(s => s.label === skill.name || s.name === skill.name || s.value === skill.value);
    return {
      ...skill,
      name: match?.label || skill.name,
      imageUrl: match?.imageUrl || skill.imageUrl || ''
    };
  };

  useEffect(() => {
    if (initialData && stacks.length > 0) {
      const enriched = initialData.map(getEnrichedSkill);
      setSkills(enriched);
    } else if (initialData) {
      setSkills(initialData);
    }
  }, [initialData, stacks]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSkill({ ...newSkill, [name]: value });
  };

  const handleSelectStack = (stack) => {
    setNewSkill({
      ...newSkill,
      name: stack.label || stack.name,
      imageUrl: stack.imageUrl || ''
    });
    setIsDropdownOpen(false);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newSkill.name) return;

    // ✅ 입력 시에도 중복 체크 (직접 타이핑 방지)
    const isDuplicate = skills.some((s, idx) => 
      idx !== editingIndex && s.name.toLowerCase() === newSkill.name.toLowerCase()
    );
    
    if (isDuplicate) {
      alert("이미 추가된 기술입니다.");
      return;
    }

    let updatedSkills;
    if (editingIndex !== null) {
      updatedSkills = [...skills];
      updatedSkills[editingIndex] = newSkill;
    } else {
      updatedSkills = [...skills, newSkill];
    }
    
    setSkills(updatedSkills);
    onDataChange(updatedSkills);
    setNewSkill({ name: '', level: '중', imageUrl: '' });
    setEditingIndex(null);
  };

  const handleDeleteItem = (index) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    onDataChange(updated);
  };

  // 🌟 [수정됨] 드롭다운 목록 필터링 로직
  const filteredStacks = stacks.filter((s) => {
    // 1. 이미 추가된 기술인지 확인 (이름 또는 라벨 기준)
    const isAlreadyAdded = skills.some(skill => 
      skill.name === (s.label || s.name)
    );

    // 2. 이미 추가된 것이라면 목록에서 제외
    if (isAlreadyAdded) return false;

    // 3. 카테고리 필터링
    if (activeCategory === "모두보기") return true;
    const categoryMap = { "프론트엔드": "FE", "백엔드": "BE", "모바일": "MOBILE", "기타": "ETC" };
    return s.category === categoryMap[activeCategory];
  });

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-[#6c5ce7]">🛠</span> 기술 스택
      </h3>
      
      {/* 등록된 스킬 배지 리스트 (기존 코드와 동일) */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {skills.map((skill, index) => {
            const displaySkill = getEnrichedSkill(skill);
            return (
              <div key={index} className="flex items-center gap-2 bg-[#f8f9fa] border border-[#e9ecef] pl-2 pr-3 py-1.5 rounded-lg shadow-sm hover:border-[#6c5ce7] transition-all group">
                {displaySkill.imageUrl && <img src={displaySkill.imageUrl} className="w-4 h-4 object-contain" alt="" />}
                <span className="text-sm font-semibold text-gray-700">{displaySkill.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-bold">{displaySkill.level}</span>
                <button type="button" onClick={() => handleDeleteItem(index)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* 입력 섹션 (기존 코드와 동일) */}
      <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-200 hover:border-[#a29bfe] transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 relative" ref={dropdownRef}>
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-gray-700">기술명</label>
              <button 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-xs font-bold text-[#6c5ce7] hover:underline flex items-center gap-1"
              >
                🔍 목록에서 선택하기
              </button>
            </div>
            
            <div className="relative flex items-center">
              {newSkill.imageUrl && (
                <div className="absolute left-3 flex items-center justify-center">
                  <img src={newSkill.imageUrl} className="w-5 h-5 object-contain" alt="" />
                </div>
              )}
              <input
                type="text"
                name="name"
                value={newSkill.name}
                onChange={handleInputChange}
                placeholder="직접 입력 또는 목록 선택"
                className={`w-full ${newSkill.imageUrl ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6c5ce7] focus:bg-white outline-none transition-all font-medium`}
              />
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-50 top-[100%] left-0 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex bg-gray-50 p-1 gap-1">
                  {["모두보기", "프론트엔드", "백엔드", "모바일", "기타"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeCategory === cat ? "bg-white text-[#6c5ce7] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="max-h-[240px] overflow-y-auto p-2 grid grid-cols-2 gap-1 bg-white">
                  {filteredStacks.length > 0 ? filteredStacks.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="flex items-center gap-3 p-2.5 hover:bg-[#f3f0ff] rounded-xl text-sm font-medium text-gray-600 hover:text-[#6c5ce7] transition-all text-left group"
                      onClick={() => handleSelectStack(s)}
                    >
                      {s.imageUrl ? <img src={s.imageUrl} className="w-5 h-5 object-contain group-hover:scale-110 transition-transform" alt="" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1.5" />}
                      <span className="truncate">{s.label || s.name}</span>
                    </button>
                  )) : (
                    <div className="col-span-2 py-8 text-center text-xs text-gray-400">
                      {stacks.length > 0 ? "선택할 수 있는 기술이 없습니다." : "데이터가 없습니다."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">숙련도</label>
            <div className="flex gap-2">
              {['하', '중', '상'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setNewSkill({ ...newSkill, level: lvl })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    newSkill.level === lvl 
                    ? "bg-[#6c5ce7] border-[#6c5ce7] text-white shadow-lg shadow-purple-100" 
                    : "bg-gray-50 border-gray-200 text-gray-400 hover:border-[#a29bfe] hover:text-[#6c5ce7]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <button 
              type="button" 
              onClick={handleAddItem}
              className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span> {editingIndex !== null ? '기술 수정 완료' : '기술 스택에 추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsForm;