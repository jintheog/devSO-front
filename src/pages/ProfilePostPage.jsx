import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  getProfile, 
  getImageUrl, 
  getTechStacks, 
  getUserPostsByUsername, 
  follow, 
  unfollow 
} from "../api";
import FollowListModal from "../components/FollowListModal";
import Swal from "sweetalert2";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePostPage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "followers",
  });

  const navigate = useNavigate();
  const targetUsername = urlUsername || currentUser?.username;

  useEffect(() => {
    if (authLoading) return;
    
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
  }, [targetUsername, currentUser, authLoading]);

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      Swal.fire("알림", "로그인이 필요합니다.", "info");
      return;
    }
    if (followLoading) return;

    try {
      setFollowLoading(true);
      const response = profileData.isFollowing
        ? await unfollow(profileData.username)
        : await follow(profileData.username);

      const followResult = response.data?.data;

      if (followResult) {
        setProfileData((prev) => ({
          ...prev,
          isFollowing: followResult.following,
          followerCount: followResult.followerCount,
          followingCount: followResult.followingCount,
        }));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "처리에 실패했습니다.";
      Swal.fire("오류", errorMsg, "error");
    } finally {
      setFollowLoading(false);
    }
  };

  const renderImage = (path, isAvatar = false) => {
    if (!path) return isAvatar ? DEFAULT_AVATAR : null;
    if (path.startsWith("http")) return path;
    return getImageUrl(path);
  };

  if (loading || authLoading) return <div className="text-center py-20 text-gray-400 font-bold">로딩 중...</div>;
  if (!profileData) return <div className="text-center py-20">사용자를 찾을 수 없습니다.</div>;

  const isOwnProfile = currentUser?.username === profileData.username;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans bg-[#fbfbfb]">
      {/* 1. 상단 프로필 요약 카드 */}
      <section className="bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white rounded-3xl p-8 md:p-12 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 text-white/80 hover:text-white transition-colors text-sm font-bold flex items-center gap-1 z-20"
        >
          ← 뒤로가기
        </button>
        
        <div className="flex flex-col items-center mt-4 z-10 relative">
          {/* 이미지를 클릭하면 해당 사용자의 프로필 페이지로 이동 */}
          <button 
            onClick={() => navigate(`/profile/${profileData.username}`)}
            className="relative group mb-4 transition-transform hover:scale-105 active:scale-95"
            title="프로필 상세보기"
          >
            <img 
              src={renderImage(profileData?.profileImageUrl || profileData?.avatarUrl, true)} 
              alt="Avatar" 
              className="w-28 h-28 rounded-full border-4 border-white/30 object-cover shadow-2xl bg-white/20"
            />
            {/* 호버 시 안내 레이어 */}
            <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold">VIEW</span>
            </div>
          </button>
          
          <h2 className="text-3xl font-black mb-1">{profileData?.username}</h2>
          <p className="text-white/80 text-sm mb-6 max-w-md text-center line-clamp-2 italic">
            {profileData?.bio ? `"${profileData.bio}"` : "등록된 소개글이 없습니다."}
          </p>

          <div className="flex justify-center gap-10 mb-8 font-bold">
            <button 
              onClick={() => setModalConfig({ isOpen: true, type: "followers" })} 
              className="flex flex-col items-center group transition-all"
            >
              <span className="text-xs opacity-70 uppercase tracking-widest group-hover:underline">Followers</span>
              <span className="text-2xl">{profileData.followerCount ?? 0}</span>
            </button>
            <button 
              onClick={() => setModalConfig({ isOpen: true, type: "following" })} 
              className="flex flex-col items-center group transition-all"
            >
              <span className="text-xs opacity-70 uppercase tracking-widest group-hover:underline">Following</span>
              <span className="text-2xl">{profileData.followingCount ?? 0}</span>
            </button>
          </div>

          {!isOwnProfile && (
            <button 
              onClick={handleFollowToggle} 
              disabled={followLoading}
              className={`px-10 py-2.5 font-extrabold rounded-xl shadow-lg transition-all ${
                profileData.isFollowing ? "bg-[#2d3436] text-white" : "bg-white text-[#6c5ce7]"
              }`}
            >
              {followLoading ? "..." : profileData.isFollowing ? "언팔로우" : "팔로우"}
            </button>
          )}
        </div>
      </section>

      {/* 2. 포스트 리스트 섹션 */}
      <section className="user-posts">
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            📝 작성한 포스트 
            <span className="text-[#6c5ce7] bg-[#6c5ce7]/10 px-3 py-1 rounded-full text-sm">
              {userPosts.length}
            </span>
          </h3>
        </div>

        {userPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => navigate(`/posts/${post.id}`)}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {post.imageUrl ? (
                    <img 
                      src={renderImage(post.imageUrl)} 
                      alt="thumbnail" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold bg-gray-50">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-lg font-bold">
                      👁️ {post.viewCount}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="font-black text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-[#6c5ce7] transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">
                    {post.content?.replace(/[#*`]/g, '').substring(0, 60)}...
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-[11px] font-bold text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#ff7675] flex items-center gap-1">
                        ❤️ {post.likeCount || 0}
                      </span>
                      <span className="text-xs font-bold text-[#6c5ce7] flex items-center gap-1">
                        💬 {post.commentCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">아직 작성한 게시글이 없습니다.</p>
          </div>
        )}
      </section>

      <FollowListModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        username={profileData.username}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
};

export default ProfilePostPage;