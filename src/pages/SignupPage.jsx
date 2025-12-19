import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

const SignupPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordConfirm: "", 
    name: "",
    phone: "",
  
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 전공 선택지 (예시)
  const majors = ["컴퓨터공학", "경영학", "전자공학", "국어국문학"];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. 필수 필드 정의 및 검사 (서버 DTO 필드 기준)
    const requiredFields = ['username', 'password', 'passwordConfirm', 'name', 'phone'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError("모든 필수 항목을 입력해주세요.");
        return;
      }
    }

    // 2. 클라이언트 유효성 검사
    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 20) {
      setError("사용자명은 3 ~ 20자 입니다.");
      return;
    }

  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">DEVSO</h1>
        <p className="auth-subtitle">개발자 SNS</p>

        <form onSubmit={handleSubmit} className="auth-form">

          {/* 1. 사용자명 */}
          <input
            type="text"
            name="username"
            placeholder="사용자명 (3~20자, 필수)"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={20}
          />

          {/* 2. 비밀번호 */}
          <input
            type="password"
            name="password"
            placeholder="비밀번호 (8자 이상, 필수)"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />

          {/* 3. 비밀번호 확인 */}
          <input
            type="password"
            name="passwordConfirm"
            placeholder="비밀번호 확인 (필수)"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
            minLength={8}
          />

          {/* 4. 이름 */}
          <input
            type="text"
            name="name"
            placeholder="이름 (필수)"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          {/* 5. 연락처 */}
          <input
            type="tel"
            name="phone"
            placeholder="연락처 (필수)"
            value={formData.phone}
            onChange={handleChange}
            required
            maxLength={30} 
            pattern="[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}" 
          />




          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" disabled={loading}>
            {loading ? "가입 중..." : "가입"}
          </button>
        </form>

        <p className="auth-link">
          계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage; 