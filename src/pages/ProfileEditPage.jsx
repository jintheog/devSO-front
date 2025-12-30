import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile, getTechStacks } from '../api'; // getTechStacks 추가됨
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
  
  // API에서 가져온 전체 스택 리스트 상태
  const [stackOptions, setStackOptions] = useState([]);

  useEffect(() => {
    if (currentUser?.username) {
      // 1. 프로필 정보 및 2. 전체 스택 목록 동시 호출
      Promise.all([
        getProfile(currentUser.username),
        getTechStacks()
      ])
      .then(([profileRes, stackRes]) => {
        const data = profileRes.data.data || profileRes.data; 
        const stacks = stackRes.data.data || stackRes.data;

        setProfileData({
          name: data.name || '', bio: data.bio || '', profileImageUrl: data.profileImageUrl || '',
          phone: data.phone || '', portfolio: data.portfolio || '', email: data.email || '',
        });
        setEducations(data.educations || []);
        setCareers(data.careers || []);
        setActivities(data.activities || []);
        setCertis(data.certis || []);
        setSkills(data.skills || []);
        
        setStackOptions(stacks); // API로 받은 스택 목록 저장
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?.username) return;

    const totalData = {
      ...profileData, 
      educations, careers, activities, certis, skills,
    };

    try {
      await updateProfile(currentUser.username, totalData);
      alert('프로필이 성공적으로 저장되었습니다.');
      navigate(`/profile/${currentUser.username}`);
    } catch (err) {
      alert(`저장 실패: ${err.response?.data?.message || '알 수 없는 오류'}`);
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
          {/* options에 stacks 전달 */}
          <SkillsForm 
            initialData={skills} 
            options={{ stacks: stackOptions }} 
            onDataChange={setSkills} 
          />
        </section>
      </div>

      <div className="flex justify-end gap-4 mt-10">
        <button className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50" onClick={() => navigate(-1)}>취소</button>
        <button className="px-6 py-2.5 rounded-lg bg-[#6c5ce7] text-white font-bold shadow-md hover:bg-[#5a50c9]" onClick={handleSave}>저장하기</button>
      </div>
    </div>
  );
};

export default ProfileEditPage;