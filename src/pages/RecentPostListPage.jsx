import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getPosts } from "../api";
import "../styles/PostList.css";

const RecentPostListPage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 마크다운에서 텍스트만 추출하는 함수
  const extractTextFromMarkdown = (markdown) => {
    if (!markdown) return "";
    
    // 이미지 링크 제거
    let text = markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
    // 코드 블록 제거
    text = text.replace(/```[\s\S]*?```/g, "");
    // 인라인 코드 제거
    text = text.replace(/`[^`]*`/g, "");
    // 링크 제거 (링크 텍스트는 유지)
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    // 강조 제거
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
    text = text.replace(/\*([^*]+)\*/g, "$1");
    text = text.replace(/__([^_]+)__/g, "$1");
    text = text.replace(/_([^_]+)_/g, "$1");
    // 제목 마커 제거
    text = text.replace(/^#{1,6}\s+/gm, "");
    // 리스트 마커 제거
    text = text.replace(/^[\s]*[-*+]\s+/gm, "");
    text = text.replace(/^[\s]*\d+\.\s+/gm, "");
    // 인용 마커 제거
    text = text.replace(/^>\s+/gm, "");
    // 수평선 제거
    text = text.replace(/^---$/gm, "");
    // 줄바꿈을 공백으로 변환
    text = text.replace(/\n+/g, " ");
    // 연속된 공백 제거
    text = text.replace(/\s+/g, " ").trim();
    
    return text;
  };

  // 미리보기 텍스트 생성 (이미지 유무에 따라 길이 조정)
  const getPreviewText = (content, hasImage) => {
    const text = extractTextFromMarkdown(content);
    const maxLength = hasImage ? 80 : 150; // 이미지 있으면 짧게, 없으면 길게
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // 상대 시간 표시 함수 (몇 분 전, 몇 시간 전 등)
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) {
      return "방금 전";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}주 전`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}개월 전`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}년 전`;
  };

  // 첫 로드 (page=0)
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await getPosts(0, 10);
        const pageData = response.data?.data || {};
        const newPosts = pageData.content || [];
        setPosts(newPosts);
        setHasMore(!pageData.last);
        setPage(0);
      } catch (err) {
        setError(err.response?.data?.error?.message || "게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 다음 페이지 로드 함수 - useCallback으로 메모이제이션
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      const response = await getPosts(nextPage, 10);
      const pageData = response.data?.data || {};
      const newPosts = pageData.content || [];
      
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(nextPage);
        setHasMore(!pageData.last);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);  // 의존성 명시

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        if (!loading && hasMore) {
          loadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, loadMore]);  // loadMore는 이제 안정적

  // ... 나머지 코드는 동일

  if (loading && posts.length === 0) {
    return (
      <div className="post-list-container">
        <div className="post-list-loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-list-container">
        <div style={{ padding: "20px", color: "red" }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="post-list-container">
      <h1 className="post-list-title">최신 게시글</h1>
      {posts.length === 0 ? (
        <div className="post-list-empty">게시글이 없습니다.</div>
      ) : (
        <>
          <div className="post-grid">
            {posts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`} className="post-card">
                {post.imageUrl && (
                  <div className="post-card-image-wrapper">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="post-card-image"
                    />
                  </div>
                )}
                <div className="post-card-content">
                  <div className="post-card-body">
                    <h2 className="post-card-title">{post.title}</h2>
                    {post.content && (
                      <p className="post-card-preview">
                        {getPreviewText(post.content, !!post.imageUrl)}
                      </p>
                    )}
                  </div>
                  <div className="post-card-relative-time">
                    {getRelativeTime(post.createdAt)}
                  </div>
                  <div className="post-card-footer">
                    <div className="post-card-footer-bottom">
                      <div className="post-card-meta">
                        <span className="post-card-author">
                          {post.author?.name || post.author?.username}
                        </span>
                        <span className="post-card-date">
                          · {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="post-card-stats">
                        <span className="post-card-stat-item">
                          <span>♥️</span>
                          <span>{post.likeCount}</span>
                        </span>
                        <span className="post-card-stat-item">
                          <span>💬</span>
                          <span>{post.commentCount}</span>
                        </span>
                        <span className="post-card-stat-item">
                          <span>👁️‍🗨️</span>
                          <span>{post.viewCount || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {loading && posts.length > 0 && (
            <div className="post-list-loading">더 불러오는 중...</div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="post-list-end">모든 게시글을 불러왔습니다.</div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentPostListPage;