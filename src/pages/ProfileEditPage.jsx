import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // useAuth 임포트 확인
import {
  getProfile,
  updateProfile,
  getTechStacks,
  generateAiBio,
} from "../api";
import ProfileForm from "../components/ProfileForm";
import EducationForm from "../components/EducationForm";
import CareerForm from "../components/CareerForm";
import ActivityForm from "../components/ActivityForm";
import CertificateForm from "../components/CertificateForm";
import SkillsForm from "../components/SkillsForm";
import Swal from "sweetalert2";
import "../styles/PostList.css";

const ProfileEditPage = () => {
  const navigate = useNavigate();
  // 핵심: setUser를 추가로 가져옵니다.
  const { user: currentUser, setUser } = useAuth(); 
  const [loading, setLoading] = useState(true);

  const [emailCheckStatus, setEmailCheckStatus] = useState("available");

  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    profileImageUrl: "",
    phone: "",
    portfolio: "",
    email: "",
  });

  const [serverEmail, setServerEmail] = useState("");
  const [educations, setEducations] = useState([]);
  const [careers, setCareers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [certis, setCertis] = useState([]);
  const [skills, setSkills] = useState([]);
  const [stackOptions, setStackOptions] = useState([]);

  useEffect(() => {
    if (currentUser?.username) {
      Promise.all([getProfile(currentUser.username), getTechStacks()])
        .then(([profileRes, stackRes]) => {
          const data = profileRes.data.data || profileRes.data;
          const stacks = stackRes.data.data || stackRes.data;

          setProfileData({
            name: data.name || "",
            bio: data.bio || "",
            profileImageUrl: data.profileImageUrl || "",
            phone: data.phone || "",
            portfolio: data.portfolio || "",
            email: data.email || "",
          });
          
          setServerEmail(data.email || ""); 
          setEmailCheckStatus("available");
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
            icon: "error",
            title: "데이터 로딩 실패",
            text: "프로필 정보를 불러오는 데 문제가 발생했습니다.",
          });
        });
    }
  }, [currentUser]);

  const handleBioChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setProfileData({ ...profileData, bio: value });
    }
  };

  const handleAIGenerate = async () => {
    if (!currentUser?.username) return;
    try {
      Swal.fire({
        title: "AI 생성 중...",
        text: "작성하신 이력을 바탕으로 최적의 소개글을 추출합니다.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const currentTotalData = { ...profileData, educations, careers, activities, certis, skills };
      await updateProfile(currentUser.username, currentTotalData);

      const response = await generateAiBio(currentUser.username);
      const generatedBio = response.data.data;
      Swal.close();

      const result = await Swal.fire({
        title: "✨ AI 추천 자기소개",
        html: `
          <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 0.9rem; line-height: 1.6; max-height: 300px; overflow-y: auto;">
            ${generatedBio.replace(/\n/g, "<br>")}
          </div>
          <p style="font-size: 0.8rem; color: #ef4444; margin-top: 10px;">* 500자가 넘을 경우 뒷부분이 생략되어 적용될 수 있습니다.</p>
        `,
        showCancelButton: true,
        confirmButtonText: "적용하기",
        cancelButtonText: "취소",
      });

      if (result.isConfirmed) {
        setProfileData((prev) => ({ ...prev, bio: generatedBio.substring(0, 500) }));
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "생성 실패" });
    }
  };

  const handleSave = async () => {
    if (!currentUser?.username) return;

    if (emailCheckStatus !== "available") {
      Swal.fire({
        icon: "warning",
        title: "이메일 중복 확인 필요",
        text: "변경된 이메일의 중복 확인을 진행해주세요.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "변경사항을 저장할까요?",
      text: "수정된 모든 내용이 서버에 반영됩니다.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#6c5ce7",
      confirmButtonText: "저장",
      cancelButtonText: "취소",
    });

    if (result.isConfirmed) {
      const totalData = { ...profileData, educations, careers, activities, certis, skills };
      try {
        Swal.fire({ title: "저장 중...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        // 1. 서버 데이터 업데이트
        await updateProfile(currentUser.username, totalData);
        
        // 2. 핵심: RootLayout(네비바)에 반영하기 위해 AuthContext 유저 상태 업데이트
        // 기존 유저 정보에 새로운 이름과 프로필 이미지를 덮어씌웁니다.
        setUser((prev) => ({
          ...prev,
          name: profileData.name,
          profileImageUrl: profileData.profileImageUrl
        }));

        Swal.close();
        await Swal.fire({ icon: "success", title: "저장 완료!", timer: 1500, showConfirmButton: false });
        navigate(`/profile/${currentUser.username}`);
      } catch (err) {
        Swal.close();
        const serverErrorMsg = err.response?.data?.message || "";
        Swal.fire({
          icon: "error",
          title: "저장 실패",
          text: serverErrorMsg.includes("이메일") ? "이미 사용 중인 이메일입니다." : "오류가 발생했습니다.",
        });
      }
    }
  };

  if (loading)
    return (
      <div className="sns-page">
        <div className="sns-container flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-500 font-medium">프로필 정보를 불러오고 있습니다...</div>
        </div>
      </div>
    );

  return (
    <div className="sns-page">
      <div className="sns-container">
        <div className="max-w-5xl mx-auto font-sans">
          <div className="sns-hero-card">
            <div className="sns-hero-badge">내 프로필 관리</div>
            <h1 className="sns-hero-title">나의 전문성을<br />기록하고 공유하세요</h1>
            <p className="sns-hero-subtitle">
              상세한 프로필은 팀 매칭과 네트워킹의 핵심입니다. <br className="hidden md:block"/>
              작성한 내용을 바탕으로 AI가 최적화된 자기소개서를 생성해 드려요.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <section className="sns-surface p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="sns-surface-title !mb-0">기본 인적 사항</h2>
              </div>
              <ProfileForm
                initialData={profileData}
                serverEmail={serverEmail}
                onDataChange={setProfileData}
                emailCheckStatus={emailCheckStatus}
                setEmailCheckStatus={setEmailCheckStatus}
              />
            </section>

            <section className="sns-surface p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="sns-surface-title !mb-0">학력 및 교육</h2>
              </div>
              <EducationForm initialData={educations} onDataChange={setEducations} />
            </section>

            <section className="sns-surface p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="sns-surface-title !mb-0">경력 사항</h2>
              </div>
              <CareerForm initialData={careers} onDataChange={setCareers} />
            </section>

            <section className="sns-surface p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="sns-surface-title !mb-0">대외 활동</h2>
              </div>
              <ActivityForm initialData={activities} onDataChange={setActivities} />
            </section>

            <section className="sns-surface p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="sns-surface-title !mb-0">자격증 및 수상</h2>
              </div>
              <CertificateForm initialData={certis} onDataChange={setCertis} />
            </section>

            <section className="sns-surface p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="sns-surface-title !mb-0">핵심 기술 스택</h2>
              </div>
              <SkillsForm initialData={skills} options={{ stacks: stackOptions }} onDataChange={setSkills} />
            </section>

            <section className="sns-surface p-8 border-2 border-indigo-50 bg-indigo-50/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                    <h2 className="sns-surface-title !mb-0">자기소개</h2>
                  </div>
                  <p className="text-sm text-indigo-600/80 font-medium">
                    💡 이력을 먼저 채운 뒤 AI 버튼을 클릭하면 전문적인 문장으로 다듬어 드려요.
                  </p>
                </div>
                <button
                  onClick={handleAIGenerate}
                  className="sns-hero-primary !h-12 !px-6 flex items-center gap-2"
                  style={{ boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)" }}
                >
                  <span className="text-lg">✨</span>
                  AI 자동 완성 사용하기
                </button>
              </div>
              
              <div className="relative group">
                <textarea
                  className={`w-full h-72 p-5 border-2 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none leading-relaxed ${
                    profileData.bio.length >= 500 ? "border-red-400 bg-red-50/30" : "border-gray-200 focus:border-indigo-400"
                  }`}
                  placeholder="자신을 가장 잘 표현하는 소개글을 작성해 주세요."
                  value={profileData.bio}
                  onChange={handleBioChange}
                />
                <div className="absolute bottom-5 right-5 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                  <span className={`text-xs font-bold ${profileData.bio.length >= 500 ? "text-red-500" : "text-gray-500"}`}>
                    {profileData.bio.length}
                  </span>
                  <span className="text-xs text-gray-300 font-bold">/</span>
                  <span className="text-xs text-gray-400 font-bold">500자</span>
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end items-center gap-4 mt-16 mb-24 pt-8 border-t border-gray-200">
            <button 
              className="px-10 py-3.5 rounded-xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              onClick={() => navigate(-1)}
            >
              취소
            </button>
            <button 
              className="sns-hero-primary !h-14 !px-12 !text-lg shadow-xl"
              onClick={handleSave}
            >
              프로필 저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;