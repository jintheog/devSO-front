import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getProfile, getImageUrl, getTechStacks, getUserPostsByUsername } from "../api";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePostPage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    // URL에 username이 없으면 내 username 사용
    const targetUsername = urlUsername || currentUser?.username;
    
    if (targetUsername) {
      setLoading(true);
      Promise.all([
        getProfile(targetUsername),
        getTechStacks(),
        getUserPostsByUsername(targetUsername)
      ])
        .then(([profileRes, techRes, postsRes]) => {
          setProfileData(profileRes.data?.data || profileRes.data);
          setUserPosts(postsRes.data?.data || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("데이터 로딩 실패:", err);
          setLoading(false);
        });
    }
  }, [urlUsername, currentUser, authLoading]);

  const renderImage = (path, isAvatar = false) => {
    if (!path) return isAvatar ? DEFAULT_AVATAR : null;
    if (path.startsWith("http")) return path;
    return getImageUrl(path);
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="profile-container" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <section className="profile-info" style={{ textAlign: "center", marginBottom: "40px" }}>
        <img 
          src={renderImage(profileData?.avatarUrl, true)} 
          alt="avatar" 
          style={{ width: "120px", height: "120px", borderRadius: "50%" }} 
        />
        <h2>{profileData?.username}</h2>
        <p>{profileData?.bio || "소개글이 없습니다."}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: "10px" }}>뒤로가기</button>
      </section>

      <hr />

      <section className="user-posts" style={{ marginTop: "30px" }}>
        <h3>작성한 포스트 ({userPosts.length})</h3>
        <div className="post-grid" style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => navigate(`/posts/${post.id}`)}
                style={{ 
                  border: "1px solid #ddd", 
                  padding: "15px", 
                  borderRadius: "8px", 
                  cursor: "pointer",
                  display: "flex",
                  gap: "15px"
                }}
              >
                {post.imageUrl && (
                  <img 
                    src={renderImage(post.imageUrl)} 
                    alt="thumbnail" 
                    style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }} 
                  />
                )}
                <div className="post-content">
                  <h4 style={{ margin: "0 0 10px 0" }}>{post.title}</h4>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    {new Date(post.createdAt).toLocaleDateString()} · 조회수 {post.viewCount} · 좋아요 {post.likeCount}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p>작성한 게시글이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePostPage;