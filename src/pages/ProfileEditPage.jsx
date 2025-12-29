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

  const [profileData, setProfileData] = useState({
    name: '', bio: '', profileImageUrl: '', phone: '', portfolio: '', email: '',
  });

  const [educations, setEducations] = useState([]);
  const [careers, setCareers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [certis, setCertis] = useState([]); 
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (currentUser?.username) {
      getProfile(currentUser.username)
        .then((response) => {
          const data = response.data.data || response.data; 
          setProfileData({
            name: data.name || '', bio: data.bio || '', profileImageUrl: data.profileImageUrl || '',
            phone: data.phone || '', portfolio: data.portfolio || '', email: data.email || '',
          });
          setEducations(data.educations || []);
          setCareers(data.careers || []);
          setActivities(data.activities || []);
          setCertis(data.certis || []);
          setSkills(data.skills || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?.username) return;

    // --- 최종 유효성 검사 ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
    const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6}\.?)(\/[\w.-]*)*\/?$/i;

    if (profileData.email && !emailRegex.test(profileData.email)) {
      alert('올바른 이메일 형식이 아닙니다.'); return;
    }
    if (profileData.phone && !phoneRegex.test(profileData.phone)) {
      alert('전화번호 형식을 확인해주세요 (010-0000-0000).'); return;
    }
    if (profileData.portfolio && !urlPattern.test(profileData.portfolio) && !profileData.portfolio.includes('@')) {
      alert('포트폴리오에 유효한 링크 또는 이메일을 입력해주세요.'); return;
    }

    const totalData = {
      ...profileData, // name, bio, profileImageUrl, phone, portfolio, email 포함
      educations, careers, activities, certis, skills,
    };

    try {
      await updateProfile(currentUser.username, totalData);
      alert('프로필이 성공적으로 저장되었습니다.');
      navigate(`/profile/${currentUser.username}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || '저장 실패';
      alert(`저장 실패: ${errorMsg}`);
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="profile-edit-container">
      <h1>프로필 수정</h1>
      <ProfileForm initialData={profileData} onDataChange={setProfileData} />
      <EducationForm initialData={educations} onDataChange={setEducations} />
      <CareerForm initialData={careers} onDataChange={setCareers} />
      <ActivityForm initialData={activities} onDataChange={setActivities} />
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