import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout as logoutApi } from '../api';
import { swal } from '../utils/swal';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((response) => {
          setUser(response.data.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logoutUser = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("서버 로그아웃 실패:", error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      swal.toast({ icon: "success", title: "로그아웃 되었습니다." });
      navigate('/login');
    }
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    login: loginUser,
    logout: logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
