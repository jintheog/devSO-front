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
    // 포트폴리오는 URL 또는 @(이메일) 중 하나라도 만족해야 함
    if (profileData.portfolio && !urlPattern.test(profileData.portfolio) && !profileData.portfolio.includes('@')) {
      alert('포트폴리오에 유효한 링크(https://) 또는 이메일을 입력해주세요.'); return;
    }

    const totalData = {
      ...profileData, 
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

  if (loading) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-sans">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 pb-4 border-b border-gray-200">프로필 수정</h1>
      
      <div className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <ProfileForm initialData={profileData} onDataChange={setProfileData} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <EducationForm initialData={educations} onDataChange={setEducations} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <CareerForm initialData={careers} onDataChange={setCareers} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <ActivityForm initialData={activities} onDataChange={setActivities} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <CertificateForm initialData={certis} onDataChange={setCertis} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SkillsForm initialData={skills} onDataChange={setSkills} />
        </section>
      </div>

      <div className="flex justify-end gap-4 mt-10">
        <button 
          className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          onClick={() => navigate(-1)}
        >
          취소
        </button>
        <button 
          className="px-6 py-2.5 rounded-lg bg-[#6c5ce7] text-white font-bold shadow-md hover:bg-[#5a50c9] transition-all transform hover:-translate-y-0.5" 
          onClick={handleSave}
        >
          저장하기
        </button>
      </div>
    </div>
  );
};

export default ProfileEditPage;