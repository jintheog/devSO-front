/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { uploadFile, getImageUrl, checkEmailDuplicate } from "../api";
import Swal from "sweetalert2";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfileForm = ({
  initialData = {},
  serverEmail,
  onDataChange,
  emailCheckStatus,
  setEmailCheckStatus,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profileImageUrl: "",
    phone: "",
    portfolio: "",
    email: "",
  });

  const [errors, setErrors] = useState({ email: "", portfolio: "" });
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
      if (initialData.profileImageUrl) {
        setPreviewUrl(getImageUrl(initialData.profileImageUrl));
      }

      if (initialData.email === serverEmail && serverEmail !== "") {
        setEmailCheckStatus("available");
      } else {
        setEmailCheckStatus("none");
      }
    }
  }, [initialData, serverEmail, setEmailCheckStatus]);

  const handleEmailCheck = async () => {
    if (!formData.email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        email: "올바른 이메일 형식이 아닙니다.",
      }));
      return;
    }

    setEmailCheckStatus("checking");
    try {
      const res = await checkEmailDuplicate(formData.email);
      const isAvailable =
        res.data?.data?.available === true || res.data?.available === true;
      if (isAvailable) {
        setEmailCheckStatus("available");
        setErrors((prev) => ({ ...prev, email: "" }));
        Swal.fire({
          icon: "success",
          title: "사용 가능",
          text: "사용 가능한 이메일입니다.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        setEmailCheckStatus("duplicate");
        setErrors((prev) => ({
          ...prev,
          email: "이미 사용 중인 이메일입니다.",
        }));
        Swal.fire({
          icon: "error",
          title: "중복 확인",
          text: "이미 사용 중인 이메일입니다.",
        });
      }
    } catch (err) {
      setEmailCheckStatus("none");
      Swal.fire({
        icon: "error",
        title: "오류",
        text: "중복 확인 중 에러가 발생했습니다.",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = "";

    if (name === "email") {
      if (value === serverEmail && serverEmail !== "") {
        setEmailCheckStatus("available");
      } else {
        setEmailCheckStatus("none");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value !== "" && !emailRegex.test(value))
        errorMsg = "올바른 이메일 형식이 아닙니다.";
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    onDataChange(newFormData);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const response = await uploadFile(file);
      const relativeUrl = response.data?.data?.url || response.data?.url;
      if (relativeUrl) {
        const updatedFormData = { ...formData, profileImageUrl: relativeUrl };
        setFormData(updatedFormData);
        onDataChange(updatedFormData);
        setPreviewUrl(URL.createObjectURL(file));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* 프로필 이미지 섹션 */}
      <div className="flex flex-col items-center space-y-4 md:w-1/3">
        <div
          className="relative group cursor-pointer w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <img
            src={previewUrl || DEFAULT_AVATAR}
            alt="Profile"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>

      {/* 입력 폼 섹션 */}
      <div className="flex-1 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 이름 - 이제 수정 가능합니다 */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              이름
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] outline-none transition-colors"
            />
          </div>

          {/* 이메일 */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              이메일
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`flex-1 min-w-0 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6c5ce7] outline-none transition-colors ${
                  emailCheckStatus === "available"
                    ? "border-green-500"
                    : emailCheckStatus === "duplicate" || errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={handleEmailCheck}
                disabled={emailCheckStatus === "checking"}
                className="shrink-0 px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg h-[42px] hover:bg-gray-700 transition-colors disabled:bg-gray-400"
              >
                {emailCheckStatus === "checking" ? "확인 중..." : "중복 확인"}
              </button>
            </div>
            <div className="min-h-[1.25rem]">
              {errors.email || emailCheckStatus === "duplicate" ? (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email || "이미 사용 중인 이메일입니다."}
                </p>
              ) : emailCheckStatus === "available" && formData.email ? (
                <p className="text-green-600 text-xs mt-1">
                  사용 가능한 이메일입니다.
                </p>
              ) : emailCheckStatus === "none" && formData.email ? (
                <p className="text-gray-400 text-xs mt-1">
                  중복 확인이 필요합니다.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* 전화번호 */}
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">
            전화번호
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="010-1234-5678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#6c5ce7]"
          />
        </div>

        {/* 포트폴리오 */}
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">
            포트폴리오 / SNS 링크
          </label>
          <input
            type="text"
            name="portfolio"
            value={formData.portfolio}
            onChange={handleInputChange}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#6c5ce7]"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
