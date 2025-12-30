import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  getProfile, 
  getImageUrl, 
  follow, 
  unfollow 
} from "../api";
import FollowListModal from "../components/FollowListModal"; 
import Swal from "sweetalert2";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: "followers" });
  
  const navigate = useNavigate();

  // 1. 대상 유저 결정 (URL 파라미터가 없으면 로그인 유저 정보 사용)
  const targetUsername = urlUsername || currentUser?.username;

  useEffect(() => {
    // Auth 정보가 로딩 중이거나, 타겟 유저가 결정되지 않았다면 대기
    if (authLoading) return;
    
    // 타겟 유저가 아예 없는 경우 (로그아웃 상태로 /profile 진입 등)
    if (!targetUsername) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getProfile(targetUsername);
        
        // 백엔드 ApiResponse 구조(data.data)에 맞춰 데이터 추출
        const fetchedData = res.data?.data || res.data;
        
        if (fetchedData) {
          setProfileData(fetchedData);
        }
      } catch (err) {
        console.error("Profile Load Error:", err);
        Swal.fire("오류", "프로필 정보를 불러오는데 실패했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUsername, authLoading]); 

  // 팔로우/언팔로우 토글 핸들러
  const handleFollowToggle = async () => {
    if (!currentUser) {
      Swal.fire("알림", "로그인이 필요합니다.", "info");
      return;
    }
    if (followLoading) return;

    try {
      setFollowLoading(true);
      
      // 현재 팔로우 상태에 따라 요청 결정
      const response = profileData.isFollowing 
        ? await unfollow(profileData.username) 
        : await follow(profileData.username);

      const followResult = response.data?.data;

      if (followResult) {
        setProfileData(prev => ({
          ...prev,
          isFollowing: followResult.following, // 서버에서 반환된 최신 상태 반영
          followerCount: followResult.followerCount,
          followingCount: followResult.followingCount
        }));
      }
    } catch (err) {
      console.error("Follow Toggle Error:", err);
      // 서버에서 내려주는 구체적인 에러 메시지 표시 (ex: 이미 팔로우한 사용자입니다)
      const errorMsg = err.response?.data?.message || "처리에 실패했습니다.";
      Swal.fire("오류", errorMsg, "error");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading || authLoading) return <div className="text-center py-20 font-bold">로딩 중...</div>;
  if (!profileData) return <div className="text-center py-20">프로필을 찾을 수 없습니다.</div>;

  const isOwnProfile = currentUser?.username === profileData.username;

  // 데이터 가공 (null 방지)
  const careers = profileData.careers || [];
  const educations = profileData.educations || [];
  const certificates = profileData.certis || profileData.certificates || [];
  const activities = profileData.activities || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans bg-[#fbfbfb]">
      {/* --- 프로필 헤더 --- */}
      <header className="bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white rounded-3xl p-8 md:p-12 mb-8 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <img 
          src={profileData.profileImageUrl ? getImageUrl(profileData.profileImageUrl) : DEFAULT_AVATAR} 
          className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white/30 object-cover shadow-2xl bg-white/20" 
          alt="Profile"
        />
        
        <div className="flex-grow text-center md:text-left z-10">
          <h1 className="text-4xl font-black mb-2">{profileData.name || profileData.username}</h1>
          <p className="text-xl opacity-90 font-medium mb-6">
            {careers.length > 0 ? careers[0].position : "반갑습니다!"}
          </p>

          <div className="flex justify-center md:justify-start gap-10 mb-8 font-bold">
            <button 
              onClick={() => setModalConfig({ isOpen: true, type: "followers" })}
              className="flex flex-col items-center md:items-start group transition-all"
            >
              <span className="text-xs opacity-70 uppercase tracking-widest group-hover:underline">Followers</span>
              <span className="text-2xl">{profileData.followerCount ?? 0}</span>
            </button>
            <button 
              onClick={() => setModalConfig({ isOpen: true, type: "following" })}
              className="flex flex-col items-center md:items-start group transition-all"
            >
              <span className="text-xs opacity-70 uppercase tracking-widest group-hover:underline">Following</span>
              <span className="text-2xl">{profileData.followingCount ?? 0}</span>
            </button>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {isOwnProfile ? (
              <button 
                onClick={() => navigate("/profile/edit")}
                className="px-8 py-3 bg-white text-[#6c5ce7] font-extrabold rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
              >
                프로필 수정하기
              </button>
            ) : (
              <button 
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-10 py-3 font-extrabold rounded-xl shadow-lg transition-all ${
                  profileData.isFollowing ? "bg-[#2d3436] text-white" : "bg-white text-[#6c5ce7]"
                }`}
              >
                {followLoading ? "..." : profileData.isFollowing ? "언팔로우" : "팔로우"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* --- 하단 상세 섹션 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <h2 className="text-lg font-black mb-4">📝 소개</h2>
            <p className="text-gray-600 text-sm italic whitespace-pre-wrap">{profileData.bio || "아직 소개글이 없습니다."}</p>
          </section>
          
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <h2 className="text-lg font-black mb-4">🛠 기술 스택</h2>
            <div className="flex flex-wrap gap-2">
              {profileData.techStacks && profileData.techStacks.length > 0 ? (
                profileData.techStacks.map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 text-[#6c5ce7] rounded-full text-xs font-bold border border-indigo-100">
                    {tech.techName}
                  </span>
                ))
              ) : <p className="text-gray-400 text-xs">등록된 기술이 없습니다.</p>}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">💼 경력사항</h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-[11px] before:w-[2px] before:bg-gray-50">
              {careers.length > 0 ? (
                careers.map((item, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-4 border-[#6c5ce7] rounded-full z-10 shadow-sm"></div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{item.companyName}</h3>
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{item.startDate} ~ {item.endDate || '현재'}</span>
                    </div>
                    <p className="text-[#6c5ce7] font-bold text-sm mb-2">{item.position}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))
              ) : <p className="text-gray-400 text-sm pl-8">등록된 정보가 없습니다.</p>}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6">🎓 학력</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {educations.length > 0 ? educations.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold">{item.schoolName}</h3>
                  <p className="text-sm">{item.major} ({item.status})</p>
                </div>
              )) : <p className="text-gray-400 text-sm">학력 정보가 없습니다.</p>}
            </div>
          </section>
        </div>
      </div>

      {/* 팔로우 리스트 모달 */}
      <FollowListModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        username={profileData.username}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
};

export default ProfilePage;