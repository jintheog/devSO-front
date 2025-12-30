import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getProfile, getImageUrl, getTechStacks } from "../api"; // 🌟 getTechStacks 추가

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [techStackOptions, setTechStackOptions] = useState([]); // 🌟 Enum 옵션 저장
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    const targetUsername = urlUsername || currentUser?.username;
    
    if (targetUsername) {
      // 🌟 프로필 데이터와 기술 스택 옵션을 동시에 가져옴
      Promise.all([
        getProfile(targetUsername),
        getTechStacks()
      ])
        .then(([profileRes, techRes]) => {
          setProfileData(profileRes.data?.data || profileRes.data);
          setTechStackOptions(techRes.data?.data || techRes.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [urlUsername, currentUser, authLoading]);

  // 🌟 스킬 데이터에 아이콘 URL을 매칭시키는 함수
  const getFullSkillInfo = (userSkill) => {
    // 백엔드 Enum 리스트에서 사용자의 스킬과 일치하는 항목을 찾음
    const match = techStackOptions.find(
      (opt) => opt.value === userSkill.value || opt.label === userSkill.name || opt.name === userSkill.name
    );
    
    return {
      name: match?.label || userSkill.name,
      imageUrl: match?.imageUrl || userSkill.imageUrl, // 매칭된 아이콘이 있으면 사용
      level: userSkill.level
    };
  };

  const renderImage = (path, isAvatar = false) => {
    if (!path) return isAvatar ? DEFAULT_AVATAR : null;
    if (path.startsWith("http")) return path;
    return getImageUrl(path);
  };

  if (loading || authLoading) return <div className="text-center py-20 text-gray-500 font-bold">데이터를 불러오는 중입니다...</div>;
  if (!profileData) return <div className="text-center py-20 text-gray-500">프로필 정보가 없습니다.</div>;

  const isOwnProfile = currentUser?.username === profileData.username;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans bg-[#fbfbfb]">
      {/* 1. 헤더 섹션 */}
      <header className="bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white rounded-3xl p-8 md:p-12 mb-8 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="relative group">
          <img
            src={renderImage(profileData.profileImageUrl, true)}
            alt="Profile"
            className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white/30 object-cover shadow-2xl transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex-grow text-center md:text-left z-10">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
            <h1 className="text-4xl font-black tracking-tight">{profileData.name || profileData.username}</h1>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
              @{profileData.username}
            </span>
          </div>
          <p className="text-xl opacity-90 font-medium mb-6">
            {profileData.careers?.[0]?.position || "프리랜서 / 구직 중"}
          </p>
          {isOwnProfile && (
            <button 
              className="px-6 py-2.5 bg-white text-[#6c5ce7] font-extrabold rounded-xl shadow-lg hover:bg-gray-50 transition-all active:scale-95" 
              onClick={() => navigate("/profile/edit")}
            >
              프로필 수정하기
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8 lg:col-span-1">
          {/* 소개 섹션 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-800">
              <span className="text-xl">📝</span> 소개
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm italic">
              "{profileData.bio || "아직 등록된 소개글이 없습니다."}"
            </p>
          </section>

          {/* 기술 스택 섹션 */}
          {profileData.skills?.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-800">
                <span className="text-xl">🛠</span> 기술 스택
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {profileData.skills.map((s, index) => {
                  const skill = getFullSkillInfo(s); // 🌟 Enum과 매칭하여 아이콘 확보
                  const iconPath = renderImage(skill.imageUrl);
                  return (
                    <div key={index} className="bg-gray-50 border border-gray-100 pl-2 pr-3 py-1.5 rounded-xl flex items-center gap-2 group hover:border-[#6c5ce7] transition-colors">
                      {iconPath ? (
                        <img src={iconPath} className="w-4 h-4 object-contain" alt="" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      )}
                      <span className="text-xs font-bold text-gray-700">{skill.name}</span>
                      <span className="text-[9px] px-1 bg-white border border-gray-200 rounded text-[#6c5ce7] font-black">{skill.level}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* 오른쪽 메인 콘텐츠 (경력, 학력 등 - 기존 코드 유지) */}
        <div className="lg:col-span-2 space-y-8">
          {/* ... 경력사항, 학력, 자격증, 활동 섹션은 이전 답변 코드와 동일하게 추가 ... */}
          {/* 복사 편의를 위해 생략되었으나 전체 코드 흐름은 위와 동일합니다. */}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;