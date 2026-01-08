import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getProfile,
  getImageUrl,
  follow,
  unfollow,
  getTechStacks,
} from "../api";
import FollowListModal from "../components/FollowListModal";
import Swal from "sweetalert2";
import "../styles/PostList.css";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [profileData, setProfileData] = useState(null);
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
    if (!targetUsername) {
      setLoading(false);
      return;
    }

    const fetchProfileAndStacks = async () => {
      try {
        setLoading(true);
        const [profileRes, stackRes] = await Promise.all([
          getProfile(targetUsername),
          getTechStacks(),
        ]);

        const data = profileRes.data?.data || profileRes.data;
        const allStacks = stackRes.data?.data || stackRes.data;

        if (data && data.skills) {
          data.skills = data.skills.map((mySkill) => {
            const match = allStacks.find(
              (s) =>
                s.label === mySkill.name || s.value === mySkill.techStackValue
            );
            return {
              ...mySkill,
              imageUrl: match?.imageUrl || mySkill.imageUrl,
              name: match?.label || mySkill.name,
            };
          });
        }

        setProfileData(data);
      } catch (err) {
        console.error("Profile Load Error:", err);
        Swal.fire("오류", "프로필 정보를 불러오는데 실패했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStacks();
  }, [targetUsername, authLoading]);

  const handleFollowToggle = async () => {
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

  if (loading || authLoading)
    return (
      <div className="sns-page">
        <div className="sns-container">
          <div className="text-center py-20 font-bold">로딩 중...</div>
        </div>
      </div>
    );
  if (!profileData)
    return (
      <div className="sns-page">
        <div className="sns-container">
          <div className="text-center py-20">프로필을 찾을 수 없습니다.</div>
        </div>
      </div>
    );

  const isOwnProfile = currentUser?.username === profileData.username;
  const careers = profileData.careers || [];
  const educations = profileData.educations || [];
  const activities = profileData.activities || [];
  const skills = profileData.skills || [];
  const certis = profileData.certis || [];

  return (
    <div className="sns-page">
      <div className="sns-container">
        <div className="max-w-6xl mx-auto font-sans">
          {/* --- 프로필 헤더 --- */}
          <header className="sns-hero-card flex flex-col md:flex-row items-center gap-8 p-8 mb-10 relative">
            <img
              src={
                profileData.profileImageUrl
                  ? getImageUrl(profileData.profileImageUrl)
                  : DEFAULT_AVATAR
              }
              className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white/20 object-cover shadow-2xl bg-white/10"
              alt="Profile"
            />

            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <h1 className="text-4xl font-black">
                    {profileData.name}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-1">
                    {profileData.email && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
                        <span>📧 {profileData.email}</span>
                      </div>
                    )}
                    {profileData.portfolio && (
                      <a
                        href={
                          profileData.portfolio.startsWith("http")
                            ? profileData.portfolio
                            : `https://${profileData.portfolio}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold backdrop-blur-sm transition-all"
                      >
                        <span>🔗 Portfolio / SNS</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* 프로필 수정하기 버튼: 우측 상단 위치 */}
                {isOwnProfile && (
                  <button
                    onClick={() => navigate("/profile/edit")}
                    className="px-6 py-2.5 bg-white text-[#6c5ce7] font-extrabold rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer text-sm"
                  >
                    ⚙️ 프로필 수정하기
                  </button>
                )}
              </div>

              <p className="text-base opacity-90 font-medium mt-3">
                {careers.length > 0 ? careers[0].position : ""}
              </p>

              <div className="flex justify-center md:justify-start gap-10 mt-6 font-bold">
                <button
                  onClick={() =>
                    setModalConfig({ isOpen: true, type: "followers" })
                  }
                  className="flex flex-col items-center md:items-start group transition-all cursor-pointer"
                >
                  <span className="text-xs opacity-70 uppercase tracking-widest group-hover:underline">
                    Followers
                  </span>
                  <span className="text-2xl">
                    {profileData.followerCount ?? 0}
                  </span>
                </button>
                <button
                  onClick={() =>
                    setModalConfig({ isOpen: true, type: "following" })
                  }
                  className="flex flex-col items-center md:items-start group transition-all cursor-pointer"
                >
                  <span className="text-xs opacity-70 uppercase tracking-widest group-hover:underline">
                    Following
                  </span>
                  <span className="text-2xl">
                    {profileData.followingCount ?? 0}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                <button
                  onClick={() =>
                    navigate(`/profile/${profileData.username}/posts`)
                  }
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-extrabold rounded-xl border border-white/30 transition-all shadow-md backdrop-blur-sm cursor-pointer"
                >
                  📝 작성한 글 보기
                </button>

                {!isOwnProfile && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-10 py-3 font-extrabold rounded-xl shadow-lg transition-all cursor-pointer ${
                      profileData.isFollowing
                        ? "bg-[#2d3436] text-white"
                        : "bg-white text-[#6c5ce7]"
                    }`}
                  >
                    {followLoading
                      ? "..."
                      : profileData.isFollowing
                      ? "언팔로우"
                      : "팔로우"}
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* --- 메인 콘텐츠 --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            {/* 왼쪽 사이드바: 소개, 기술스택만 남김 */}
            <div className="lg:col-span-1 space-y-8">
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <h2 className="text-lg font-black mb-4">📝 소개</h2>
                <p className="text-gray-600 text-sm italic whitespace-pre-wrap">
                  {profileData.bio || "아직 소개글이 없습니다."}
                </p>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  <span className="text-[#6c5ce7]">🛠</span> 기술 스택
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((tech, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-[#6c5ce7] rounded-lg text-xs font-bold border border-indigo-100"
                      >
                        {tech.imageUrl && (
                          <img
                            src={tech.imageUrl}
                            className="w-4 h-4 object-contain"
                            alt={tech.name}
                          />
                        )}
                        <span>{tech.name}</span>
                        <span className="text-[9px] opacity-60 ml-1 border-l border-indigo-200 pl-1">
                          {tech.level}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs">
                      등록된 기술이 없습니다.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* 오른쪽 메인 콘텐츠: 경력사항, 주요활동, 학력, 자격증 */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
                  💼 경력사항
                </h2>
                <div className="space-y-8 relative before:absolute before:inset-0 before:left-[11px] before:w-[2px] before:bg-gray-50">
                  {careers.length > 0 ? (
                    careers.map((item, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-4 border-[#6c5ce7] rounded-full z-10 shadow-sm"></div>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {item.companyName}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {item.department}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                            {item.startDate} ~ {item.endDate || "현재"}
                          </span>
                        </div>
                        <p className="text-[#6c5ce7] font-bold text-sm mb-2">
                          {item.position}
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                          {item.task}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm pl-8">
                      등록된 경력이 없습니다.
                    </p>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
                  🚀 주요 활동
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  {activities.length > 0 ? (
                    activities.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-5 bg-gray-50 rounded-2xl border border-gray-100"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-1 bg-indigo-100 text-[#6c5ce7] text-[10px] font-bold rounded-md uppercase">
                            {act.category}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {act.duration}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {act.projectName}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {act.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">
                      등록된 활동이 없습니다.
                    </p>
                  )}
                </div>
              </section>

              {/* 학력 섹션 */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-black mb-6">🎓 학력</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {educations.length > 0 ? (
                    educations.map((item, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-bold">{item.schoolName}</h3>
                        <p className="text-sm text-gray-600">
                          {item.major} {item.status && `(${item.status})`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.startDate} ~ {item.endDate}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">
                      학력 정보가 없습니다.
                    </p>
                  )}
                </div>
              </section>

              {/* 자격증 섹션 (학력 밑으로 이동) */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <span className="text-[#6c5ce7]">📜</span> 자격증
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certis.length > 0 ? (
                    certis.map((cert, i) => (
                      <div
                        key={i}
                        className="flex flex-col p-4 bg-gray-50 rounded-xl border-l-4 border-indigo-400"
                      >
                        <h4 className="text-base font-bold text-gray-800">
                          {cert.certiName}
                        </h4>
                        <p className="text-sm text-gray-600">{cert.issuer}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          취득일: {cert.acquisitionDate}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">
                      등록된 자격증이 없습니다.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>

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

export default ProfilePage;