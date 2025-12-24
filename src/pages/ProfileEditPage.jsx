import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile } from '../api';
import ProfileForm from '../components/ProfileForm';
import EducationForm from '../components/EducationForm';
import CareerForm from '../components/CareerForm';
import ActivityForm from '../components/ActivityForm';
import CertificateForm from '../components/CertificateForm';
import SkillsForm from '../components/SkillsForm';
import '../styles/ProfileForm.css';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // 1. 백엔드 엔티티(User) 필드명과 일치시키기
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    profileImageUrl: '',
    phone: '',      // phoneNumber -> phone
    portfolio: '',  // blogUrl/githubUrl -> portfolio
  });

  const [educations, setEducations] = useState([]);
  const [careers, setCareers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [certis, setCertis] = useState([]); // certificates -> certis (백엔드 필드명 일치)
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (currentUser?.username) {
      getProfile(currentUser.username)
        .then((response) => {
          // axios 응답 구조에 따라 response.data 또는 response.data.data 확인 필요
          const data = response.data; 
          
          setProfileData({
            name: data.name || '',
            bio: data.bio || '',
            profileImageUrl: data.profileImageUrl || '',
            phone: data.phone || '',
            portfolio: data.portfolio || '',
          });
          setEducations(data.educations || []);
          setCareers(data.careers || []);
          setActivities(data.activities || []);
          setCertis(data.certis || []); // 필드명 변경 반영
          setSkills(data.skills || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err);
          setLoading(false);
        });
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?.username) return;

    // 2. 백엔드 DTO(ProfileUpdateRequest) 구조와 정확히 일치시켜 구성
    const totalData = {
      ...profileData,
      educations,
      careers,
      activities,
      certis,
      skills,// certificates -> certis
      // skills 필드가 백엔드 User 엔티티에 없다면 무시되거나 추가 구현 필요
    };

    try {
      await updateProfile(currentUser.username, totalData);
      alert('프로필이 성공적으로 저장되었습니다.');
      navigate(`/profile/${currentUser.username}`); // 수정 후 본인 프로필 페이지로 이동
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('프로필 저장에 실패했습니다.');
    }
  };

  if (loading) return <div className="loading">데이터를 불러오는 중...</div>;

  return (
    <div className="profile-edit-container">
      <h1>프로필 수정</h1>
      
      {/* 각 폼에 전달되는 props 명칭 확인 */}
      <ProfileForm initialData={profileData} onDataChange={setProfileData} />
      <EducationForm initialData={educations} onDataChange={setEducations} />
      <CareerForm initialData={careers} onDataChange={setCareers} />
      <ActivityForm initialData={activities} onDataChange={setActivities} />
      {/* 백엔드와 맞춘 Certi 폼 전달 */}
      <CertificateForm initialData={certis} onDataChange={setCertis} />
      <SkillsForm initialData={skills} onDataChange={setSkills} />

      <div className="button-group">
        <button className="save-btn" onClick={handleSave}>저장하기</button>
        <button className="cancel-btn" onClick={() => navigate(-1)}>취소</button>
      </div>
    </div>
  );
};

export default ProfileEditPage;