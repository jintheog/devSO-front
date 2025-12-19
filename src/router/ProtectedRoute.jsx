import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 비로그인 전용 라우트
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/" />;
};

export const PrivateRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};
