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
    <div className="form-section">
      <h3>자격증</h3>
      <div className="item-list">
        {certificates.map((cert, index) => (
          <div key={index} className="item">
            <div className="item-details">
              <p><strong>자격증명:</strong> {cert.certiName}</p>
              <p><strong>발행처:</strong> {cert.issuer}</p>
              <p><strong>취득일:</strong> {cert.acquisitionDate}</p>
            </div>
            <div className="item-actions">
              <button onClick={() => handleEdit(index)} className="edit-btn">수정</button>
              <button onClick={() => handleDelete(index)} className="delete-btn">삭제</button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-item-form">
        <h4>{editingIndex !== null ? '자격증 수정' : '자격증 추가'}</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>자격증명</label>
            <input
              type="text"
              name="certiName" // name 속성을 certiName으로 변경
              value={newCertificate.certiName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>발행처</label>
            <input
              type="text"
              name="issuer"
              value={newCertificate.issuer}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>취득일</label>
            <input
              type="date"
              name="acquisitionDate"
              value={newCertificate.acquisitionDate}
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

export default CertificateForm;