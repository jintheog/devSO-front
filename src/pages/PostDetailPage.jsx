import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  deletePost,
  getPost,
  getImageUrl,
  likePost,
  unlikePost,
  recordPostView,
} from "../api";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import "../styles/PostDetail.css";

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await getPost(id);
        const postData = response.data?.data;
        if (postData) {
          setPost(postData);
          // 조회수 기록 (StrictMode에서 mount가 2번 발생하므로, 클라이언트에서 중복 호출 방지)
          // 같은 5초 버킷에서는 1번만 호출
          const bucketSeconds = 5;
          const bucket = Math.floor(Date.now() / 1000 / bucketSeconds);
          const ssKey = `devso_post_view_sent:${id}:${bucket}`;
          if (!sessionStorage.getItem(ssKey)) {
            sessionStorage.setItem(ssKey, "1");
            try {
              const viewRes = await recordPostView(id);
              const viewCount = viewRes.data?.data?.viewCount;
              if (viewCount !== undefined) {
                setPost((prev) => (prev ? { ...prev, viewCount } : prev));
              }
            } catch {
              // 조회수 실패는 UX에 치명적이지 않으므로 무시
            }
          }
        } else {
          setError("게시글을 찾을 수 없습니다.");
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || "게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  const normalizeImageUrl = (url) => {
    if (!url) return "";
    const abs = getImageUrl(String(url).trim());
    // 비교를 위해 query/hash 제거
    return abs.split("#")[0].split("?")[0];
  };

  const extractFirstMarkdownImageUrl = (markdown) => {
    if (!markdown) return null;
    const match = String(markdown).match(/!\[[^\]]*]\(([^)]+)\)/);
    return match?.[1]?.trim() || null;
  };

  const removeFirstMarkdownImageIfMatches = (markdown, imageUrlToMatch) => {
    if (!markdown) return "";
    if (!imageUrlToMatch) return String(markdown);

    const firstUrl = extractFirstMarkdownImageUrl(markdown);
    if (!firstUrl) return String(markdown);

    if (normalizeImageUrl(firstUrl) !== normalizeImageUrl(imageUrlToMatch)) {
      return String(markdown);
    }

    // 첫 번째 이미지 마크다운만 1회 제거 (앞뒤 공백/줄바꿈도 같이 정리)
    const escaped = firstUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return String(markdown).replace(
      new RegExp(String.raw`^\s*!\[[^\]]*]\(${escaped}\)\s*\n?`, "m"),
      ""
    );
  };

  // 마크다운 이미지 URL을 절대 URL로 변환
  const processMarkdown = (markdown) => {
    if (!markdown) return "";
    return String(markdown).replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
      const absoluteUrl = getImageUrl(url);
      return `![${alt}](${absoluteUrl})`;
    });
  };

  if (loading) {
    return (
      <div className="post-detail-container">
        <div className="post-detail-loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-detail-container">
        <div className="post-detail-error">{error}</div>
        <button onClick={() => navigate(-1)} className="post-detail-back-button">
          뒤로 가기
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <div className="post-detail-error">게시글을 찾을 수 없습니다.</div>
        <button onClick={() => navigate(-1)} className="post-detail-back-button">
          뒤로 가기
        </button>
      </div>
    );
  }

  // 상세에서 썸네일(첫 이미지) + 본문 첫 이미지가 중복으로 보이는 문제 방지:
  // 썸네일과 동일한 "첫 이미지"가 본문에 있으면 본문에서 1회 제거하고 렌더링
  const markdownWithoutDuplicatedFirstImage = removeFirstMarkdownImageIfMatches(
    post.content,
    post.imageUrl
  );
  const processedMarkdown = processMarkdown(markdownWithoutDuplicatedFirstImage);
  const isOwner = Boolean(isAuthenticated && user?.id && post?.author?.id && user.id === post.author.id);

  const handleDeletePost = async () => {
    if (!isOwner) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "게시글 삭제",
      text: "정말 삭제할까요?",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await deletePost(id);
      await Swal.fire({
        icon: "success",
        title: "삭제 완료",
        text: "게시글이 삭제되었습니다.",
        confirmButtonText: "확인",
      });
      navigate("/posts");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "오류",
        text: err.response?.data?.error?.message || "삭제에 실패했습니다.",
        confirmButtonText: "확인",
      });
    }
  };

  // 좋아요 토글 핸들러
  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      Swal.fire({
        icon: "info",
        title: "로그인 필요",
        text: "좋아요를 하려면 로그인이 필요합니다.",
        confirmButtonText: "확인",
      });
      return;
    }

    if (liking || !post) return;

    try {
      setLiking(true);
      const response = post.liked
        ? await unlikePost(id)
        : await likePost(id);
      
      const likeData = response.data?.data;
      if (likeData) {
        setPost((prev) => ({
          ...prev,
          liked: likeData.liked,
          likeCount: likeData.likeCount !== undefined ? likeData.likeCount : prev.likeCount,
        }));
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "오류",
        text: err.response?.data?.error?.message || "좋아요 처리에 실패했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="post-detail-container">
      {/* Floating Like Button */}
      <div className="post-detail-floating-actions">
        <button
          className={`post-detail-like-button ${post?.liked ? "liked" : ""}`}
          onClick={handleLikeToggle}
          disabled={liking || !post}
          aria-label={post?.liked ? "좋아요 취소" : "좋아요"}
        >
          <span className="post-detail-like-icon">
            {post?.liked ? "❤️" : "🤍"}
          </span>
          <span className="post-detail-like-count">{post?.likeCount || 0}</span>
        </button>
      </div>

      <button onClick={() => navigate(-1)} className="post-detail-back-button">
        ← 뒤로 가기
      </button>
      
      <article className="post-detail">
        <header className="post-detail-header">
          <h1 className="post-detail-title">{post.title}</h1>
          <div className="post-detail-meta">
            <div className="post-detail-author">
              <span className="post-detail-author-name">
                {post.author?.name || post.author?.username}
              </span>
              <span className="post-detail-date">
                {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="post-detail-stats">
              <span className="post-detail-stat-item">
                <span>♥️</span>
                <span>{post.likeCount || 0}</span>
              </span>
              <span className="post-detail-stat-item">
                <span>💬</span>
                <span>{post.commentCount || 0}</span>
              </span>
              <span className="post-detail-stat-item">
                <span>👁️‍🗨️</span>
                <span>{post.viewCount || 0}</span>
              </span>
              {isOwner && (
                <button
                  type="button"
                  className="post-detail-edit-button"
                  onClick={() => navigate(`/posts/${id}/edit`)}
                >
                  수정
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  className="post-detail-edit-button"
                  onClick={handleDeletePost}
                  style={{ marginLeft: "0.5px" }}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </header>

        {post.imageUrl && (
          <div className="post-detail-image-wrapper">
            <img
              src={getImageUrl(post.imageUrl)}
              alt={post.title}
              className="post-detail-image"
            />
          </div>
        )}

        <div className="post-detail-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 코드 블록 스타일링
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <pre className="post-detail-codeblock">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="post-detail-inline-code" {...props}>
                    {children}
                  </code>
                );
              },
              // 이미지 스타일링
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  className="post-detail-content-image"
                  alt={props.alt || ""}
                />
              ),
            }}
          >
            {processedMarkdown}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
};

export default PostDetailPage;

