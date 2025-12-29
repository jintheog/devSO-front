/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

const CertificateForm = ({ initialData = [], onDataChange }) => {
  const [certificates, setCertificates] = useState(initialData);
  
  // 백엔드 엔티티의 certiName과 필드명 일치
  const [newCertificate, setNewCertificate] = useState({
    certiName: '', // name -> certiName으로 변경
    issuer: '',
    acquisitionDate: '',
  });
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (initialData && JSON.stringify(initialData) !== JSON.stringify(certificates)) {
      setCertificates(initialData);
    }
  }, [initialData, certificates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCertificate((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newCertificate.certiName) {
      alert('자격증명을 입력해주세요.');
      return;
    }

    let updatedCertificates;
    if (editingIndex !== null) {
      updatedCertificates = [...certificates];
      updatedCertificates[editingIndex] = newCertificate;
    } else {
      updatedCertificates = [...certificates, newCertificate];
    }
    
    setCertificates(updatedCertificates);
    onDataChange(updatedCertificates);
    
    // 초기화 시에도 certiName 사용
    setNewCertificate({
      certiName: '',
      issuer: '',
      acquisitionDate: '',
    });
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setNewCertificate(certificates[index]);
  };

  const handleDelete = (index) => {
    const updatedCertificates = certificates.filter((_, i) => i !== index);
    setCertificates(updatedCertificates);
    onDataChange(updatedCertificates);
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-[#6c5ce7]">📜</span> 자격증
      </h3>
      
      {certificates.length > 0 && (
        <div className="space-y-4 mb-8">
          {certificates.map((cert, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group transition-all hover:border-[#a29bfe]">
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong className="text-gray-900 font-medium">자격증명:</strong> {cert.certiName}</p>
                <p><strong className="text-gray-900 font-medium">발행처:</strong> {cert.issuer}</p>
                <p><strong className="text-gray-900 font-medium">취득일:</strong> {cert.acquisitionDate}</p>
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
          {editingIndex !== null ? '자격증 수정' : '자격증 추가'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">자격증명</label>
            <input
              type="text"
              name="certiName"
              value={newCertificate.certiName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">발행처</label>
            <input
              type="text"
              name="issuer"
              value={newCertificate.issuer}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">취득일</label>
            <input
              type="date"
              name="acquisitionDate"
              value={newCertificate.acquisitionDate}
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

export default CertificateForm;