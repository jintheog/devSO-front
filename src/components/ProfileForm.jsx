/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { uploadFile, getImageUrl } from "../api";

const ProfileForm = ({ initialData = {}, onDataChange }) => {
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profileImageUrl: "",
    phone: "",
    portfolio: "",
    email: "",
  });

  const [errors, setErrors] = useState({ portfolio: "", image: "", email: "", phone: "" });
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || "",
        bio: initialData.bio || "",
        profileImageUrl: initialData.profileImageUrl || "",
        phone: initialData.phone || "",
        portfolio: initialData.portfolio || "",
        email: initialData.email || "",
      });
      if (initialData.profileImageUrl) {
        setPreviewUrl(getImageUrl(initialData.profileImageUrl));
      }
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = "";

    // 1. 포트폴리오 검증 (URL 또는 이메일 허용)
    if (name === "portfolio" && value !== "") {
      const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6}\.?)(\/[\w.-]*)*\/?$/i;
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!urlPattern.test(value) && !emailPattern.test(value)) {
        errorMsg = "유효한 링크(https://) 또는 이메일을 입력해주세요.";
      }
    }

    // 2. 이메일 유효성 검증
    if (name === "email" && value !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMsg = "올바른 이메일 형식이 아닙니다.";
      }
    }

    // 3. 전화번호 유효성 검증 (010-0000-0000)
    if (name === "phone" && value !== "") {
      const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
      if (!phoneRegex.test(value)) {
        errorMsg = "형식(010-0000-0000)을 확인해주세요.";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));

    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    onDataChange(newFormData);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrors((prev) => ({ ...prev, image: "" }));
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, image: "파일 크기는 2MB를 초과할 수 없습니다." }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    try {
      const response = await uploadFile(file);
      const relativeUrl = response.data?.data?.url || response.data?.url;
      if (relativeUrl) {
        // bio 등 다른 필드가 섞이지 않도록 명확히 profileImageUrl만 교체
        const updatedFormData = { ...formData, profileImageUrl: relativeUrl };
        setFormData(updatedFormData);
        onDataChange(updatedFormData);
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: "이미지 업로드에 실패했습니다." }));
    }
  };

  return (
    <div className="form-section edit-profile-header">
      <div className="profile-image-section">
        <div className="profile-image-container" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer", position: "relative" }}>
          <img src={previewUrl || "https://via.placeholder.com/150"} alt="Profile" className="profile-image" />
          <div className="image-overlay-text">사진 변경</div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
        <div className="form-group" style={{ marginTop: "10px" }}>
          <label>프로필 사진</label>
          {errors.image && <p className="error-text" style={{ color: "red", fontSize: "12px" }}>{errors.image}</p>}
        </div>
      </div>

      <div className="profile-details-section">
        <div className="form-grid">
          <div className="form-group">
            <label>이름</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label>이메일</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} 
                   style={{ borderColor: errors.email ? "red" : "" }} />
            {errors.email && <p style={{ color: "red", fontSize: "12px" }}>{errors.email}</p>}
          </div>

          <div className="form-group">
            <label>전화번호</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} 
                   placeholder="010-0000-0000" style={{ borderColor: errors.phone ? "red" : "" }} />
            {errors.phone && <p style={{ color: "red", fontSize: "12px" }}>{errors.phone}</p>}
          </div>

          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label>포트폴리오 / SNS 링크</label>
            <input type="text" name="portfolio" value={formData.portfolio} onChange={handleInputChange}
                   placeholder="https://github.com/..." style={{ borderColor: errors.portfolio ? "red" : "" }} />
            {errors.portfolio && <p style={{ color: "red", fontSize: "12px" }}>{errors.portfolio}</p>}
          </div>

          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label>자기 소개</label>
            <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;