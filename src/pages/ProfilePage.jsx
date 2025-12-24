import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // useParams 추가 확인
import { useAuth } from "../contexts/AuthContext";
import { getProfile } from "../api";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  // 1. URL 파라미터 추출 (ReferenceError 해결 핵심)
  const { username: urlUsername } = useParams(); 
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    // URL에 이름이 있으면 그 사람을, 없으면 내 프로필을 조회
    const targetUsername = urlUsername || currentUser?.username;

    if (targetUsername) {
      setLoading(true);
      getProfile(targetUsername)
        .then((response) => {
          // api.js 응답 구조에 따라 데이터 추출
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

  if (loading || authLoading)
    return <div className="loading">프로필을 불러오는 중...</div>;
  if (error)
    return <div className="error">프로필을 불러오는데 실패했습니다.</div>;
  if (!profileData)
    return <div className="no-data">사용자 정보가 없습니다.</div>;

  const isOwnProfile = currentUser?.username === profileData.username;

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-left">
          <img
            src={profileData.profileImageUrl || "https://via.placeholder.com/150"}
            alt="Profile"
            className="profile-avatar"
          />
          <div className="header-info">
            <h1 className="profile-name">
              {profileData.name || profileData.username}
            </h1>
            <p className="profile-position">
              {profileData.careers?.[0]?.position || "개발자"}
            </p>
            <div className="profile-links">
              {profileData.portfolio && (
                <a href={profileData.portfolio} target="_blank" rel="noopener noreferrer">
                  Portfolio / SNS
                </a>
              )}
            </div>
          </div>
        </div>
        {isOwnProfile && (
          <button className="edit-button" onClick={() => navigate("/profile/edit")}>
            프로필 수정
          </button>
        )}
      </header>

      <section className="profile-bio-section">
        <p className="bio-text">{profileData.bio || "자기소개가 없습니다."}</p>
        <div className="contact-info">
          {profileData.phone && <span>📞 {profileData.phone}</span>}
          <span>📧 {profileData.email || "이메일 정보 없음"}</span>
        </div>
      </section>

      <div className="profile-content-grid">
        {/* 2. 기술 스택 섹션 추가 (새로 만든 Skill 엔티티 반영) */}
        {profileData.skills?.length > 0 && (
          <section className="content-section">
            <h2 className="section-title">기술 스택 (Skills)</h2>
            <div className="skills-grid">
              {profileData.skills.map((skill, index) => (
                <div key={index} className="skill-item">
                  <span className="skill-name">{skill.name}</span>
                  <span className={`skill-level level-${skill.level}`}>
                    {skill.level}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 경력 */}
        {profileData.careers?.length > 0 && (
          <section className="content-section">
            <h2 className="section-title">경력 (Experience)</h2>
            <div className="experience-list">
              {profileData.careers.map((career, index) => (
                <div key={index} className="experience-item">
                  <div className="item-header">
                    <h3>{career.companyName}</h3>
                    <span className="item-date">
                      {career.startDate} ~ {career.endDate || "현재"}
                    </span>
                  </div>
                  <p className="item-sub">{career.department} · {career.position}</p>
                  <p className="item-desc">{career.task}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 주요 활동 */}
       {profileData.activities?.length > 0 && (
  <section className="content-section">
    <h2 className="section-title">주요 활동 (Activities)</h2>
    <div className="activity-list">
      {profileData.activities.map((activity, index) => (
        <div key={index} className="activity-item">
          <div className="item-header">
            {/* activityName -> projectName */}
            <h3>[{activity.category}] {activity.projectName}</h3>
            {/* startDate/endDate 대신 duration 사용 */}
            <span className="item-date">{activity.duration}</span>
          </div>
          {/* description -> content */}
          <p className="item-desc">{activity.content}</p>
        </div>
      ))}
    </div>
  </section>
)}

        {/* 학력 */}
        {profileData.educations?.length > 0 && (
          <section className="content-section">
            <h2 className="section-title">학력 (Education)</h2>
            <div className="education-list">
              {profileData.educations.map((edu, index) => (
                <div key={index} className="education-item">
                  <div className="item-header">
                    <h3>{edu.schoolName}</h3>
                    <span className="item-date">{edu.startDate} ~ {edu.endDate}</span>
                  </div>
                  <p className="item-sub">{edu.major}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 자격증 */}
        {profileData.certis?.length > 0 && (
          <section className="content-section">
            <h2 className="section-title">자격증 (Certificates)</h2>
            <div className="certificate-grid">
              {profileData.certis.map((cert, index) => (
                <div key={index} className="certificate-item">
                  <span className="cert-name">{cert.certiName}</span>
                  <span className="cert-issuer">{cert.issuer}</span>
                  <span className="cert-date">{cert.acquisitionDate}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;