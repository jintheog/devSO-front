/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

const ProfileForm = ({ initialData = {}, onDataChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profileImageUrl: '',
    phone: '',      // phoneNumber -> phone
    portfolio: '',  // blogUrl + githubUrl 통합 필드
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        bio: initialData.bio || '',
        profileImageUrl: initialData.profileImageUrl || '',
        phone: initialData.phone || '',
        portfolio: initialData.portfolio || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    onDataChange(newFormData); // 부모 컴포넌트(ProfileEditPage)로 변경 사항 전달
  };

  return (
    <div className="form-section edit-profile-header">
      <div className="profile-image-section">
        <img
          src={formData.profileImageUrl || 'https://via.placeholder.com/150'}
          alt="Profile"
          className="profile-image"
        />
        <div className="form-group">
          <label>프로필 이미지 URL</label>
          <input
            type="text"
            name="profileImageUrl"
            value={formData.profileImageUrl}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="profile-details-section">
        <div className="form-grid">
          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label>전화번호</label>
            <input
              type="tel"
              name="phone" // phoneNumber -> phone
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="010-0000-0000"
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>포트폴리오 / SNS 링크</label>
            <input
              type="url"
              name="portfolio" // blogUrl/githubUrl -> portfolio
              value={formData.portfolio}
              onChange={handleInputChange}
              placeholder="GitHub 또는 블로그 주소"
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>한 줄 소개</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows="3"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;