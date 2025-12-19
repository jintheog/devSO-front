import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { kakaoLogin, getMe } from '../api';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const isProcessing = useRef(false);

  useEffect(() => {
    // StrictMode로 인한 중복 실행 방지
    if (isProcessing.current) return;

    const code = new URLSearchParams(window.location.search).get('code');
    const errorParam = new URLSearchParams(window.location.search).get('error');

    // 사용자가 로그인을 취소한 경우
    if (errorParam) {
      navigate('/login');
      return;
    }

    if (code) {
      isProcessing.current = true;
      handleKakaoLogin(code);
    }
  }, []);

  const handleKakaoLogin = async (code) => {
    try {
      // 1. 백엔드에 code 전달하여 JWT 획득
      const response = await kakaoLogin(code);
      const { accessToken } = response.data.data;

      // 2. 토큰 저장
      localStorage.setItem('token', accessToken);

      // 3. 사용자 정보 조회
      const userResponse = await getMe();

      // 4. AuthContext 상태 업데이트
      login(accessToken, userResponse.data.data);

      // 5. 메인 페이지로 이동
      navigate('/');
    } catch (err) {
      console.error('카카오 로그인 실패:', err);
      setError('카카오 로그인에 실패했습니다.');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <p>카카오 로그인 중...</p>
      </div>
    </div>
  );
};

export default KakaoCallback;