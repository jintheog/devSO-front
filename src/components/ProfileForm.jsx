/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { uploadFile, getImageUrl } from "../api";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfileForm = ({ initialData = {}, onDataChange }) => {
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profileImageUrl: "",
    phone: "",
    portfolio: "",
    email: "",
  });

  const [errors, setErrors] = useState({
    portfolio: "",
    image: "",
    email: "",
    phone: "",
  });
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
      const urlPattern =
        /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6}\.?)(\/[\w.-]*)*\/?$/i;
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
      setErrors((prev) => ({
        ...prev,
        image: "파일 크기는 2MB를 초과할 수 없습니다.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    try {
      const response = await uploadFile(file);
      const relativeUrl = response.data?.data?.url || response.data?.url;
      if (relativeUrl) {
        const updatedFormData = { ...formData, profileImageUrl: relativeUrl };
        setFormData(updatedFormData);
        onDataChange(updatedFormData);
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        image: "이미지 업로드에 실패했습니다.",
      }));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4 md:w-1/3">
        <div
          className="relative group cursor-pointer w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <img
            src={previewUrl || DEFAULT_AVATAR}
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-white font-semibold text-sm">사진 변경</span>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="text-center">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            프로필 사진
          </label>
          <p className="text-xs text-gray-500">2MB 이하의 이미지 파일</p>
          {errors.image && (
            <p className="text-red-500 text-xs mt-1">{errors.image}</p>
          )}
        </div>
      </div>

      {/* Profile Details Section */}
      <div className="flex-1 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              이름
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              readOnly
              className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg cursor-not-allowed focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              이름은 수정할 수 없습니다.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              이메일
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors ${
                errors.email
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              전화번호
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="010-0000-0000"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors ${
                errors.phone
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300"
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">
            포트폴리오 / SNS 링크
          </label>
          <input
            type="text"
            name="portfolio"
            value={formData.portfolio}
            onChange={handleInputChange}
            placeholder="https://github.com/..."
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors placeholder-gray-400 ${
              errors.portfolio
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300"
            }`}
          />
          {errors.portfolio && (
            <p className="text-red-500 text-xs mt-1">{errors.portfolio}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">
            자기 소개
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows="5"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
