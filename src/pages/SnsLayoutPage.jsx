import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SnsTabs from "../components/SnsTabs.jsx";
import { getWeeklyNewPostCount } from "../api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/PostList.css";

export default function SnsLayoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [weeklyCount, setWeeklyCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    getWeeklyNewPostCount()
      .then((res) => {
        const count = res?.data?.data ?? 0;
        if (mounted) setWeeklyCount(count);
      })
      .catch(() => {
        if (mounted) setWeeklyCount(0);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="sns-page">
      <div className="sns-container">
        <div className="sns-hero-card">
          <div className="sns-hero-badge">이번 주 {weeklyCount}개의 새로운 게시글</div>
          <div className="sns-hero-title">오늘은 어떤 이야기를 공유할까요?</div>
          <div className="sns-hero-subtitle">
            개발 경험, 트러블슈팅, 회고까지 — 짧게라도 남겨보면 누군가에게 큰 도움이 될 수 있어요.
          </div>
          <div className="sns-hero-actions">
            <button
              className="sns-hero-primary"
              onClick={() => navigate(isAuthenticated ? "/posts/new" : "/login")}
            >
              게시글 작성 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <div className="sns-header">
          <SnsTabs />
        </div>
        <Outlet />
      </div>
    </div>
  );
}


