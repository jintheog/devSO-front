import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile, getTechStacks, generateAiBio } from '../api'; // generateAiBio 추가
import ProfileForm from '../components/ProfileForm';
import EducationForm from '../components/EducationForm';
import CareerForm from '../components/CareerForm';
import ActivityForm from '../components/ActivityForm';
import CertificateForm from '../components/CertificateForm';
import SkillsForm from '../components/SkillsForm';
import Swal from 'sweetalert2';

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
  const [stackOptions, setStackOptions] = useState([]);

  useEffect(() => {
    if (currentUser?.username) {
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
        setStackOptions(stacks);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: '데이터 로딩 실패',
          text: '프로필 정보를 불러오는 데 문제가 발생했습니다.',
          confirmButtonColor: '#6c5ce7',
        });
      });
    }
  }, [currentUser]);

  // --- AI 자소서 생성 핸들러 추가 ---
  const handleAIGenerate = async () => {
    if (!currentUser?.username) return;

    try {
      Swal.fire({
        title: 'AI가 자기소개를 작성 중입니다',
        text: '회원님의 이력을 분석하고 있습니다. 잠시만 기다려주세요.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await generateAiBio(currentUser.username);
      const generatedBio = response.data.data;

      Swal.close();

      const result = await Swal.fire({
        title: '✨ AI 추천 자기소개',
        text: generatedBio,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#6c5ce7',
        confirmButtonText: '이 내용으로 적용하기',
        cancelButtonText: '취소',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        setProfileData(prev => ({ ...prev, bio: generatedBio }));
        Swal.fire({
          icon: 'success',
          title: '적용되었습니다!',
          text: '하단의 저장하기 버튼을 눌러야 최종 반영됩니다.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: '생성 실패',
        text: 'AI 서비스를 일시적으로 사용할 수 없습니다.',
      });
    }
  };

  const handleSave = async () => {
    if (!currentUser?.username) return;

    if (profileData.bio.length > 500) {
      Swal.fire({
        icon: 'warning',
        title: '글자수 초과',
        text: '자기소개는 500자 이내로 작성해주세요.',
        confirmButtonColor: '#6c5ce7',
      });
      return;
    }

    const result = await Swal.fire({
      title: '변경사항을 저장할까요?',
      text: "수정된 정보가 프로필에 즉시 반영됩니다.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6c5ce7',
      cancelButtonColor: '#d33',
      confirmButtonText: '저장',
      cancelButtonText: '취소',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      const totalData = {
        ...profileData, 
        educations, careers, activities, certis, skills,
      };

      try {
        await updateProfile(currentUser.username, totalData);
        
        await Swal.fire({
          icon: 'success',
          title: '저장 완료!',
          text: '프로필이 성공적으로 업데이트되었습니다.',
          timer: 1500,
          showConfirmButton: false
        });
        
        navigate(`/profile/${currentUser.username}`);
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: '저장 실패',
          text: err.response?.data?.message || '알 수 없는 오류가 발생했습니다.',
          confirmButtonColor: '#6c5ce7',
        });
      }
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-sans">
      <div className="flex justify-between items-end mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-900">프로필 수정</h1>
        {/* AI 생성 버튼 - 상단 배치 */}
        <button 
          onClick={handleAIGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:-translate-y-0.5 font-semibold text-sm"
        >
          <span>✨</span> AI 자소서 자동 완성
        </button>
      </div>
      
      <div className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">기본 정보</h2>
          </div>
          <ProfileForm initialData={profileData} onDataChange={setProfileData} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">학력</h2>
          <EducationForm initialData={educations} onDataChange={setEducations} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">경력</h2>
          <CareerForm initialData={careers} onDataChange={setCareers} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">대외 활동</h2>
          <ActivityForm initialData={activities} onDataChange={setActivities} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">자격증</h2>
          <CertificateForm initialData={certis} onDataChange={setCertis} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">보유 기술</h2>
          <SkillsForm 
            initialData={skills} 
            options={{ stacks: stackOptions }} 
            onDataChange={setSkills} 
          />
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
          className="px-6 py-2.5 rounded-lg bg-[#6c5ce7] text-white font-bold shadow-md hover:bg-[#5a50c9] transition-all hover:-translate-y-0.5" 
          onClick={handleSave}
        >
          저장하기
        </button>
      </div>
    </div>
  );
};

export default ProfileEditPage;