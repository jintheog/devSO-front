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
          const fetchedData = profileRes.data?.data || profileRes.data;
          console.log("Full Profile Data:", fetchedData); // 데이터 구조 확인용
          setProfileData(fetchedData);
          setTechStackOptions(techRes.data?.data || techRes.data || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Fetch Error:", err);
          setLoading(false);
        });
    }
  }, [urlUsername, currentUser, authLoading]);

  const renderImage = (path, isAvatar = false) => {
    if (!path) return isAvatar ? DEFAULT_AVATAR : null;
    if (path.startsWith("http")) return path;
    return getImageUrl(path);
  };

  if (loading || authLoading) return <div className="text-center py-20 text-gray-500 font-bold">데이터를 불러오는 중입니다...</div>;
  if (!profileData) return <div className="text-center py-20 text-gray-500">프로필 정보가 없습니다.</div>;

  const isOwnProfile = currentUser?.username === profileData.username;

  // ✅ 각 섹션별 데이터 추출 (백엔드 필드명 유연하게 대응)
  const careers = profileData.careers || [];
  const educations = profileData.educations || [];
  const certificates = profileData.certis || profileData.certificates || [];
  const activities = profileData.activities || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans bg-[#fbfbfb]">
      {/* 1. 헤더 섹션 */}
      <header className="bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white rounded-3xl p-8 md:p-12 mb-8 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="relative group">
          <img src={renderImage(profileData.profileImageUrl, true)} alt="Profile" className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white/30 object-cover shadow-2xl" />
        </div>
        <div className="flex-grow text-center md:text-left z-10">
          <h1 className="text-4xl font-black tracking-tight">{profileData.name || profileData.username}</h1>
          <p className="text-xl opacity-90 font-medium mb-6">
            {/* 첫 번째 경력의 직함 표시 */}
            {careers[0]?.position || careers[0]?.job_title || ""}
          </p>
          {isOwnProfile && (
            <button className="px-6 py-2.5 bg-white text-[#6c5ce7] font-extrabold rounded-xl shadow-lg" onClick={() => navigate("/profile/edit")}>프로필 수정하기</button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <h2 className="text-lg font-black mb-4">📝 소개</h2>
            <p className="text-gray-600 text-sm italic">"{profileData.bio || "아직 소개글이 없습니다."}"</p>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* ✅ 경력 섹션 (Career) */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">💼 경력사항</h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-[11px] before:w-[2px] before:bg-gray-100">
              {careers.length > 0 ? (
                careers.map((item, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-4 border-[#6c5ce7] rounded-full z-10"></div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-gray-900">
                        {item.companyName || item.company_name}
                      </h3>
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                        {item.startDate || item.start_date} ~ {item.endDate || item.end_date || '재직 중'}
                      </span>
                    </div>
                    <p className="text-[#6c5ce7] font-bold text-sm mb-2">{item.position || item.job_title}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">등록된 경력 정보가 없습니다.</p>
              )}
            </div>
          </section>

          {/* ✅ 학력 섹션 (Education) */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">🎓 학력</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {educations.length > 0 ? (
                educations.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900">{item.schoolName || item.school_name}</h3>
                    <p className="text-sm text-gray-600">{item.major} · {item.status}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.graduationDate || item.graduation_date}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">등록된 학력 정보가 없습니다.</p>
              )}
            </div>
          </section>

          {/* ✅ 자격증 섹션 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">📜 수상 및 자격증</h2>
            <div className="space-y-4">
              {certificates.length > 0 ? (
                certificates.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                    <div>
                      <h3 className="font-bold text-gray-800">{item.certiName || item.certi_name}</h3>
                      <p className="text-xs text-gray-500">{item.issuer}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-400">{item.acquisitionDate || item.acquisition_date}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">등록된 자격증이 없습니다.</p>
              )}
            </div>
          </section>

          {/* ✅ 주요 활동 섹션 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">🚀 주요 활동</h2>
            <div className="space-y-6">
              {activities.length > 0 ? (
                activities.map((item, idx) => (
                  <div key={idx} className="group pb-4 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold">{item.category}</span>
                        <h3 className="font-bold text-gray-800">{item.projectName || item.title}</h3>
                      </div>
                      <span className="text-xs text-gray-400">{item.duration}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{item.content || item.description}</p>
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