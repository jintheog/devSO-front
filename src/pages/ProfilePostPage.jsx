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
import "../styles/PostList.css";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePostPage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  
  // 스킬 더보기 및 스크롤 버튼 상태
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

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
          const data = profileRes.data?.data || profileRes.data;
          const allStacks = techRes.data?.data || techRes.data;
          const posts = postsRes.data?.data || [];

          // ProfilePage와 동일한 스킬 이미지 및 라벨 매핑 로직
          if (data && data.skills) {
            data.skills = data.skills.map((mySkill) => {
              const match = allStacks.find(
                (s) => s.label === mySkill.name || s.value === mySkill.techStackValue
              );
              return {
                ...mySkill,
                imageUrl: match?.imageUrl || mySkill.imageUrl,
                name: match?.label || mySkill.name,
              };
            });
          }

          setProfileData(data);
          // 포스트 최신순 정렬
          const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setUserPosts(sorted);
          setLoading(false);
        })
        .catch((err) => {
          console.error("데이터 로딩 실패:", err);
          setLoading(false);
          Swal.fire("오류", "데이터를 불러오는 중 문제가 발생했습니다.", "error");
        });
    }
  }, [targetUsername, currentUser, authLoading]);

  // 스크롤 감지 핸들러
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollButtons(true);
      else setShowScrollButtons(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });

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

  if (loading || authLoading)
    return (
      <div className="sns-page">
        <div className="sns-container">
          <div className="text-center py-20 text-gray-400 font-bold">로딩 중...</div>
        </div>
      </div>
    );
  if (!profileData)
    return (
      <div className="sns-page">
        <div className="sns-container">
          <div className="text-center py-20">사용자를 찾을 수 없습니다.</div>
        </div>
      </div>
    );

  const isOwnProfile = currentUser?.username === profileData.username;
  const skills = profileData.skills || [];
  // 더보기 클릭 여부에 따라 노출될 스킬 결정
  const visibleSkills = showAllSkills ? skills : skills.slice(0, 3);

  return (
    <div className="sns-page">
      <div className="sns-container">
        <div className="max-w-6xl mx-auto font-sans min-h-screen relative">
      
      {/* 프로필 요약 카드 */}
      <section className="sns-hero-card">

        <div className="flex flex-col items-center mt-4 z-10 relative">
          {/* 프로필 이미지 (클릭 이벤트 제거) */}
          <div className="relative mb-4">
            <img 
              src={renderImage(profileData?.profileImageUrl || profileData?.avatarUrl, true)} 
              alt="Avatar" 
              className="w-28 h-28 rounded-full border-4 border-white/30 object-cover shadow-2xl bg-white/20"
            />
          </div>
          
          <h2 className="text-3xl font-black mb-2">{profileData?.username}</h2>

          {/* 기술 스택 리스트 */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-2xl">
            {visibleSkills.length > 0 ? (
              visibleSkills.map((tech, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[11px] font-bold border border-white/10 transition-all">
                  {tech.imageUrl && <img src={tech.imageUrl} className="w-3.5 h-3.5 object-contain" alt={tech.name} />}
                  <span>{tech.name}</span>
                </div>
              ))
            ) : (
              <span className="text-xs opacity-60">등록된 기술 스택이 없습니다.</span>
            )}
            
            {/* 더보기 / 접기 버튼 */}
            {!showAllSkills && skills.length > 3 && (
              <button 
                onClick={() => setShowAllSkills(true)}
                className="px-3 py-1 bg-indigo-900/30 hover:bg-indigo-900/50 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="더보기"
              >
                ...외 {skills.length - 3}개
              </button>
            )}
            
            {showAllSkills && skills.length > 3 && (
              <button 
                onClick={() => setShowAllSkills(false)}
                className="px-3 py-1 bg-indigo-900/30 hover:bg-indigo-900/50 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              >
                접기
              </button>
            )}
          </div>

          {/* 팔로워/팔로잉 카운트 */}
          <div className="flex justify-center gap-10 mb-8 font-bold">
            <button 
              onClick={() => setModalConfig({ isOpen: true, type: "followers" })} 
              className="flex flex-col items-center group cursor-pointer"
            >
              <span className="text-xs opacity-70 group-hover:underline">Followers</span>
              <span className="text-2xl">{profileData.followerCount ?? 0}</span>
            </button>
            <button 
              onClick={() => setModalConfig({ isOpen: true, type: "following" })} 
              className="flex flex-col items-center group cursor-pointer"
            >
              <span className="text-xs opacity-70 group-hover:underline">Following</span>
              <span className="text-2xl">{profileData.followingCount ?? 0}</span>
            </button>
          </div>

          {/* 액션 버튼 그룹 */}
          <div className="flex flex-wrap justify-center gap-3">
            {/* 프로필 상세보기 버튼 (항상 노출) */}
            <button 
              onClick={() => navigate(`/profile/${profileData.username}`)}
              className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white font-extrabold rounded-xl border border-white/30 transition-all shadow-md backdrop-blur-sm cursor-pointer"
            >
              프로필 상세보기
            </button>

            {/* 팔로우/언팔로우 버튼 (타인 프로필일 때만) */}
            {!isOwnProfile && (
              <button 
                onClick={handleFollowToggle} 
                disabled={followLoading}
                className={`px-10 py-2.5 font-extrabold rounded-xl shadow-lg transition-all cursor-pointer ${
                  profileData.isFollowing 
                  ? "bg-[#2d3436] text-white hover:bg-black" 
                  : "bg-white text-[#6c5ce7] hover:bg-gray-50"
                }`}
              >
                {followLoading ? "..." : profileData.isFollowing ? "언팔로우" : "팔로우"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 포스트 리스트 섹션 */}
      <section className="user-posts">
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            📝 작성한 포스트 <span className="text-[#6c5ce7] bg-[#6c5ce7]/10 px-3 py-1 rounded-full text-sm">{userPosts.length}</span>
          </h3>
        </div>
        
        {userPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => navigate(`/posts/${post.id}`)} 
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {post.imageUrl ? (
                    <img 
                      src={renderImage(post.imageUrl)} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={post.title} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold bg-gray-50">No Image</div>
                  )}
                </div>
                <div className="p-5">
                  <h4 className="font-black text-lg mb-2 line-clamp-1 group-hover:text-[#6c5ce7]">{post.title}</h4>
                  <p className="text-gray-500 text-sm line-clamp-2 h-10 leading-relaxed">
                    {post.content?.replace(/[#*`]/g, '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400">
            작성한 게시글이 없습니다.
          </div>
        )}
      </section>

      {/* 고정 스크롤 네비게이션 버튼 */}
      <div 
        className={`fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 transition-all duration-500 z-50 ${
          showScrollButtons ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'
        }`}
      >
        <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 p-1.5">
          <button 
            onClick={scrollToTop}
            className="w-10 h-10 bg-white text-[#6c5ce7] rounded-full flex items-center justify-center hover:bg-[#6c5ce7] hover:text-white transition-all group shadow-sm mb-1 cursor-pointer"
            title="맨 위로 가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          <div className="w-6 h-[1px] bg-gray-100 mx-auto mb-1"></div>
          
          <button 
            onClick={scrollToBottom}
            className="w-10 h-10 bg-white text-[#6c5ce7] rounded-full flex items-center justify-center hover:bg-[#6c5ce7] hover:text-white transition-all group shadow-sm cursor-pointer"
            title="맨 아래로 가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 팔로우 목록 모달 */}
      <FollowListModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        username={profileData.username}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
        </div>
      </div>
    </div>
  );
};

export default ProfilePostPage;