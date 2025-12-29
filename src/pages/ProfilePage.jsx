import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getProfile, getImageUrl } from "../api";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    const targetUsername = urlUsername || currentUser?.username;

    if (targetUsername) {
      setLoading(true);
      getProfile(targetUsername)
        .then((response) => {
          const data = response.data?.data || response.data;
          setProfileData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Profile fetch error:", err);
          setError(err);
          setLoading(false);
        });
    }
  }, [urlUsername, currentUser, authLoading]);

  if (loading || authLoading) return <div className="text-center py-20 text-xl text-gray-500">프로필을 불러오는 중...</div>;
  if (error) return <div className="text-center py-20 text-xl text-red-500">프로필을 불러오는데 실패했습니다.</div>;
  if (!profileData) return <div className="text-center py-20 text-xl text-gray-500">사용자 정보가 없습니다.</div>;

  const isOwnProfile = currentUser?.username === profileData.username;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 font-sans">
      {/* 1. 헤더 섹션 */}
      <header className="bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white rounded-2xl p-8 mb-8 shadow-lg flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="relative z-10 shrink-0">
          <img
            src={profileData.profileImageUrl ? getImageUrl(profileData.profileImageUrl) : DEFAULT_AVATAR}
            alt="Profile"
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/30 object-cover shadow-md"
          />
        </div>
        <div className="relative z-10 flex-grow text-center md:text-left space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {profileData.name || profileData.username}
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">
            {profileData.careers?.[0]?.position || ""}
          </p>
          
          {/* 링크 버튼 섹션 수정됨 */}
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            {profileData.portfolio && (
              <a 
                href={profileData.portfolio.startsWith('http') ? profileData.portfolio : `https://${profileData.portfolio}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-[#6c5ce7] border border-white/30 rounded-lg text-sm font-bold transition-all duration-300 shadow-sm group"
              >
                <span>Portfolio / SNS</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <button 
            className="relative z-10 mt-4 md:mt-0 px-5 py-2.5 bg-white text-[#6c5ce7] font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            onClick={() => navigate("/profile/edit")}
          >
            프로필 수정
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Bio, Contact, Skills, Certis) */}
        <div className="space-y-8 lg:col-span-1">
          <section className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-100">소개</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">
              {profileData.bio || "자기소개가 없습니다."}
            </p>
            <div className="space-y-3 text-sm text-gray-500">
              {profileData.phone && (
                <div className="flex items-center gap-2">
                  <span>📞</span> <span>{profileData.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>📧</span> <span>{profileData.email || "이메일 정보 없음"}</span>
              </div>
            </div>
          </section>

          {profileData.skills?.length > 0 && (
            <section className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-100">기술 스택</h2>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <div key={index} className="bg-[#edf2ff] text-[#5a67f2] px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <span>{skill.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      ['상', 'High'].includes(skill.level) ? 'bg-green-100 text-green-700' :
                      ['중', 'Medium'].includes(skill.level) ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {skill.level}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profileData.certis?.length > 0 && (
            <section className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-100">자격증</h2>
              <div className="space-y-4">
                {profileData.certis.map((cert, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <span className="block font-bold text-gray-800 text-sm mb-1">{cert.certiName}</span>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{cert.issuer}</span>
                      <span>{cert.acquisitionDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (Experience, Activities, Education) */}
        <div className="space-y-8 lg:col-span-2">
          {profileData.careers?.length > 0 && (
            <section className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-[#6c5ce7]">💼</span> 경력
              </h2>
              <div className="space-y-6">
                {profileData.careers.map((career, index) => (
                  <div key={index} className="relative pl-4 border-l-2 border-gray-100 hover:border-[#6c5ce7] transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-baseline mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{career.companyName}</h3>
                      <span className="text-sm text-gray-500 font-medium">
                        {career.startDate} ~ {career.endDate || "현재"}
                      </span>
                    </div>
                    <p className="text-[#6c5ce7] font-medium text-sm mb-2">{career.department} · {career.position}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{career.task}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profileData.activities?.length > 0 && (
            <section className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-[#6c5ce7]">🔥</span> 주요 활동
              </h2>
              <div className="space-y-6">
                {profileData.activities.map((activity, index) => (
                  <div key={index} className="group">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-baseline mb-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#6c5ce7] transition-colors">
                        <span className="text-sm font-normal text-gray-500 mr-2">[{activity.category}]</span>
                        {activity.projectName}
                      </h3>
                      <span className="text-sm text-gray-500">{activity.duration}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {activity.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profileData.educations?.length > 0 && (
            <section className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-[#6c5ce7]">🎓</span> 학력
              </h2>
              <div className="space-y-4">
                {profileData.educations.map((edu, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{edu.schoolName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{edu.major}</p>
                    </div>
                    <span className="text-sm text-gray-400 font-medium whitespace-nowrap ml-4">
                      {edu.startDate} ~ {edu.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;