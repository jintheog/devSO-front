import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getProfile, getImageUrl, getTechStacks } from "../api";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [techStackOptions, setTechStackOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    const targetUsername = urlUsername || currentUser?.username;
    
    if (targetUsername) {
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

  // 기술 스택 아이콘/이름 매칭 함수
  const getFullSkillInfo = (userSkill) => {
    const match = techStackOptions.find(
      (opt) => opt.value === userSkill.value || opt.label === userSkill.name || opt.name === userSkill.name
    );
    
    return {
      name: match?.label || userSkill.name,
      imageUrl: match?.imageUrl || userSkill.imageUrl,
      level: userSkill.level
    };
  };

  // 이미지 경로 처리 함수
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
            {profileData.careers?.[0]?.position || ""}
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
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽 사이드바 */}
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
                  const skill = getFullSkillInfo(s);
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

        {/* 오른쪽 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* CareerForm 관련 - 경력 섹션 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-[#6c5ce7]">💼</span> 경력사항
            </h2>
            {profileData.careers?.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:inset-0 before:left-[11px] before:w-[2px] before:bg-gray-100">
                {profileData.careers.map((item, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-4 border-[#6c5ce7] rounded-full z-10"></div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{item.companyName}</h3>
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                        {item.startDate} ~ {item.endDate || '재직 중'}
                      </span>
                    </div>
                    <p className="text-[#6c5ce7] font-bold text-sm mb-2">{item.position}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4">등록된 경력 정보가 없습니다.</p>
            )}
          </section>

          {/* EducationForm 관련 - 학력 섹션 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-[#6c5ce7]">🎓</span> 학력
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileData.educations?.length > 0 ? (
                profileData.educations.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900">{item.schoolName}</h3>
                    <p className="text-sm text-gray-600">{item.major} · {item.status}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.graduationDate}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">등록된 학력 정보가 없습니다.</p>
              )}
            </div>
          </section>

          {/* CertificateForm 관련 - 수상 및 자격증 섹션 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-[#6c5ce7]">📜</span> 수상 및 자격증
            </h2>
            <div className="space-y-4">
              {profileData.certificates?.length > 0 ? (
                profileData.certificates.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                    <div>
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.issuer}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-400">{item.date}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">등록된 자격증이 없습니다.</p>
              )}
            </div>
          </section>

          {/* ActivityForm 관련 - 주요 활동 섹션 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-[#6c5ce7]">🚀</span> 주요 활동
            </h2>
            <div className="space-y-6">
              {profileData.activities?.length > 0 ? (
                profileData.activities.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-bold text-gray-800 group-hover:text-[#6c5ce7] transition-colors">{item.title}</h3>
                      <span className="text-xs text-gray-400">{item.startDate} ~ {item.endDate}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-[#6c5ce7] font-bold mt-2 inline-block hover:underline">
                        관련 링크 바로가기 ↗
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">등록된 활동 정보가 없습니다.</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;