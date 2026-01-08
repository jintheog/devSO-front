import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getProfile,
  getImageUrl,
  getTechStacks,
  getUserPostsByUsername,
  follow,
  unfollow,
  getRecruits,
  getTypes,
  getPositions,
  toggleBookmark,
} from "../api";
import FollowListModal from "../components/FollowListModal";
import RecruitCard from "../components/RecruitCard";
import Swal from "sweetalert2";
import "../styles/PostList.css";
import "../styles/Recruit.css";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfilePostPage = () => {
  const { username: urlUsername } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userRecruits, setUserRecruits] = useState([]);
  const [recruitCount, setRecruitCount] = useState(0);
  const [recruitOptions, setRecruitOptions] = useState({
    types: [],
    positions: [],
  });
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
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
        getUserPostsByUsername(targetUsername),
        getRecruits({ onlyMyRecruits: true, currentUsername: targetUsername }),
        getTypes(),
        getPositions(),
      ])
        .then(
          ([profileRes, techRes, postsRes, recruitsRes, typesRes, posRes]) => {
            const data = profileRes.data?.data || profileRes.data;
            const allStacks = techRes.data?.data || techRes.data;
            const posts = postsRes.data?.data || [];
            const recruitsData = recruitsRes.data?.data;
            const recruits = recruitsData?.content || recruitsData || [];
            const rCount = recruitsData?.totalElements ?? recruits.length;

            if (data && data.skills) {
              data.skills = data.skills.map((mySkill) => {
                const match = allStacks.find(
                  (s) =>
                    s.label === mySkill.name ||
                    s.value === mySkill.techStackValue
                );
                return {
                  ...mySkill,
                  imageUrl: match?.imageUrl || mySkill.imageUrl,
                  name: match?.label || mySkill.name,
                  techStackValue: match?.value || mySkill.techStackValue,
                };
              });
            }

            setProfileData(data);
            const sortedPosts = [...posts].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setUserPosts(sortedPosts);
            setUserRecruits(recruits);
            setRecruitCount(rCount);
            setRecruitOptions({
              types: typesRes.data || [],
              positions: posRes.data || [],
            });
            setLoading(false);
          }
        )
        .catch((err) => {
          console.error("데이터 로딩 실패:", err);
          setLoading(false);
          Swal.fire(
            "오류",
            "데이터를 불러오는 중 문제가 발생했습니다.",
            "error"
          );
        });
    }
  }, [targetUsername, currentUser, authLoading]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollButtons(true);
      else setShowScrollButtons(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

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

  const handleRecruitBookmarkClick = async (recruitId) => {
    if (!currentUser) {
      Swal.fire("알림", "로그인이 필요합니다.", "info");
      return;
    }
    try {
      const response = await toggleBookmark(recruitId);
      const isBookmarked = response.data?.data;
      setUserRecruits((prev) =>
        prev.map((r) =>
          r.id === recruitId ? { ...r, bookmarked: isBookmarked } : r
        )
      );
    } catch (error) {
      console.error("북마크 실패:", error);
      Swal.fire("오류", "북마크 처리에 실패했습니다.", "error");
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
          <div className="text-center py-20 text-gray-400 font-bold">
            로딩 중...
          </div>
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
  const visibleSkills = isSkillsExpanded ? skills : skills.slice(0, 6);

  return (
    <div className="sns-page">
      <div className="sns-container">
        <div className="max-w-6xl mx-auto font-sans min-h-screen relative">
          <header className="sns-hero-card relative flex flex-col md:flex-row items-center gap-8 p-8 mb-10">
            {/* 프로필 이미지 */}
            <img
              src={renderImage(profileData?.profileImageUrl, true)}
              alt="Avatar"
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 object-cover shadow-2xl bg-white/10"
            />

            <div className="flex-grow text-center md:text-left">
              {/* 상단 라인: 이름 + 수정/팔로우 버튼 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <h1 className="text-4xl font-black">
                    {profileData.name}
                  </h1>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm mb-1">
                    📧 {profileData.email || "No Email"}
                  </span>
                </div>

                {/* 수정 버튼: 우측 상단 배치 */}
                {isOwnProfile && (
                  <button
                    onClick={() => navigate("/profile/edit")}
                    className="px-6 py-2.5 bg-white text-[#6c5ce7] font-extrabold rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer text-sm"
                  >
                    ⚙️ 프로필 수정하기
                  </button>
                )}
              </div>

              {/* 기술 스택 */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {skills.length > 0 ? (
                  <>
                    {visibleSkills.map((tech, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[11px] font-bold border border-white/10"
                      >
                        {tech.imageUrl && (
                          <img
                            src={tech.imageUrl}
                            className="w-3.5 h-3.5 object-contain"
                            alt={tech.name}
                          />
                        )}
                        <span>{tech.name}</span>
                      </div>
                    ))}
                    {skills.length > 6 && (
                      <button
                        onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                        className="inline-flex items-center px-3 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[11px] font-bold border border-white/10 cursor-pointer transition-colors"
                      >
                        {isSkillsExpanded ? "접기" : `+${skills.length - 6}`}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-xs opacity-60">
              
                  </span>
                )}
              </div>

              <p className="text-lg opacity-90 font-bold mb-4">
                {profileData?.careers?.[0]?.position || ""}
              </p>

              {/* 팔로워/팔로잉 정보 */}
              <div className="flex justify-center md:justify-start gap-10 font-bold mb-6">
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

              {/* 하단 버튼 영역: 상세보기 및 팔로우(본인이 아닐 때) */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <button
                  onClick={() => navigate(`/profile/${profileData.username}`)}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-extrabold rounded-xl border border-white/30 transition-all shadow-md backdrop-blur-sm cursor-pointer"
                >
                  👤 프로필 상세보기
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

          {/* 탭 및 게시글 리스트 섹션 */}
          <section className="user-posts">
            <div className="recruit-header-tabs flex border-b border-gray-100 mb-8 gap-8">
              <button
                className={`pb-4 text-lg font-bold transition-all relative ${
                  activeTab === "posts" ? "text-[#6c5ce7]" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("posts")}
              >
                작성한 게시글{" "}
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {userPosts.length}
                </span>
                {activeTab === "posts" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#6c5ce7] rounded-full" />
                )}
              </button>
              <button
                className={`pb-4 text-lg font-bold transition-all relative ${
                  activeTab === "recruits" ? "text-[#6c5ce7]" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("recruits")}
              >
                작성한 모집글{" "}
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {recruitCount}
                </span>
                {activeTab === "recruits" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#6c5ce7] rounded-full" />
                )}
              </button>
            </div>

            {activeTab === "posts" ? (
              userPosts.length > 0 ? (
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
                          <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold bg-gray-50">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h4 className="font-black text-lg mb-2 line-clamp-1 group-hover:text-[#6c5ce7]">
                          {post.title}
                        </h4>
                        <p className="text-gray-500 text-sm line-clamp-2 h-10 leading-relaxed">
                          {post.content?.replace(/[#*`]/g, "")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400">
                  작성한 게시글이 없습니다.
                </div>
              )
            ) : userRecruits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRecruits.map((recruit) => (
                  <RecruitCard
                    key={recruit.id}
                    recruit={recruit}
                    options={recruitOptions}
                    onClick={() => navigate(`/recruits/${recruit.id}`)}
                    onBookmarkClick={() =>
                      handleRecruitBookmarkClick(recruit.id)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400">
                작성한 모집글이 없습니다.
              </div>
            )}
          </section>

          {/* 플로팅 스크롤 버튼 */}
          <div
            className={`fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 transition-all duration-500 z-50 ${
              showScrollButtons
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10 pointer-events-none"
            }`}
          >
            <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200 p-1.5">
              <button
                onClick={scrollToTop}
                className="w-10 h-10 bg-white text-[#6c5ce7] rounded-full flex items-center justify-center hover:bg-[#6c5ce7] hover:text-white transition-all group mb-1 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 group-hover:-translate-y-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
              <button
                onClick={scrollToBottom}
                className="w-10 h-10 bg-white text-[#6c5ce7] rounded-full flex items-center justify-center hover:bg-[#6c5ce7] hover:text-white transition-all group cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 group-hover:translate-y-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
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

export default ProfilePostPage;
