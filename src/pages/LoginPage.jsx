import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { login, getMe } from "../api";
import "../styles/Auth.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: loginUser } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 카카오 로그인 핸들러
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_KAKAO_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login(formData);
      const { accessToken } = response.data.data;

      localStorage.setItem("token", accessToken);
      const userResponse = await getMe();
      loginUser(accessToken, userResponse.data.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">DEVSO</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            name="username"
            placeholder="아이디"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 구분선 */}
        <div className="divider">
          <span>또는</span>
        </div>

        {/* 카카오 로그인 버튼 */}
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="kakao-login-btn"
        >
          <span className="kakao-icon">K</span>
          카카오로 로그인
        </button>

        <p className="auth-link">
          계정이 없으신가요? <Link to="/signup">가입하기</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
