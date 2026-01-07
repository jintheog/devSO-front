import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/PostList.css";
import { signup } from "../api";
import { swal } from "../utils/swal";

const SignupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
  });

  // 개별 필드 에러 메시지를 위한 상태
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // 사용자가 타이핑을 시작하면 해당 필드의 에러 메시지 삭제
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};

    // 1. 클라이언트 유효성 검사 (요구사항 반영)
    if (formData.password.length < 8) {
      newErrors.password = "비밀번호는 8자 이상입니다.";
    }
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    }
    if (!formData.name.trim()) {
      newErrors.name = "이름은 필수 입니다.";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "전화번호는 필수 입니다.";
    }
    if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = "사용자명은 3 ~ 20자 입니다.";
    }

    // 에러가 하나라도 있으면 중단
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await signup(formData);
      await swal.success("회원가입 완료", "로그인해주세요.");
      navigate("/login");
    } catch (err) {
      const serverMessage = err.response?.data?.error?.message || "";
      
      // 2. 서버 에러 처리 (중복 아이디 등)
      if (serverMessage.includes("중복") || serverMessage.includes("exists")) {
        setErrors({ username: "중복된 아이디 입니다." });
      } else {
        setErrors({ form: serverMessage || "회원가입에 실패했습니다." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sns-page auth-page">
      <div className="sns-container">
        <div className="sns-surface auth-surface">
          <div className="auth-logo-hero-wrap" aria-hidden="true">
            <div className="auth-logo-hero" data-text="DevSo">DevSo</div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* 1. 사용자명 */}
            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="아이디 (3~20자, 필수)"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <span className="error-text">{errors.username}</span>
              )}
            </div>

            {/* 2. 비밀번호 */}
            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="비밀번호 (8자 이상, 필수)"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            {/* 3. 비밀번호 확인 */}
            <div className="input-group">
              <input
                type="password"
                name="passwordConfirm"
                placeholder="비밀번호 확인 (필수)"
                value={formData.passwordConfirm}
                onChange={handleChange}
              />
              {errors.passwordConfirm && (
                <span className="error-text">{errors.passwordConfirm}</span>
              )}
            </div>

            {/* 4. 이름 */}
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="이름 (필수)"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* 5. 연락처 */}
            <div className="input-group">
              <input
                type="tel"
                name="phone"
                placeholder="연락처 (필수)"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            {errors.form && <p className="error-message general-error">{errors.form}</p>}

            <div className="auth-actions">
              <button className="sns-btn sns-btn-primary" type="submit" disabled={loading}>
                {loading ? "가입 중..." : "가입"}
              </button>
            </div>
          </form>

          <p className="auth-link">
            계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;