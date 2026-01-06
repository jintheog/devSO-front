import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // 이메일 중복 확인 상태 관리 (none, checking, available, duplicate)
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

  // 자기소개 핸들러 (500자 제한 로직 포함)
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
        await updateProfile(currentUser.username, totalData);
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
        <div className="sns-container">
          <div className="text-center py-20 text-gray-500">로딩 중...</div>
        </div>
      </div>
    );

  return (
    <div className="sns-page">
      <div className="sns-container">
        <div className="max-w-6xl mx-auto font-sans">
          <div className="sns-hero-card">
            <div className="sns-hero-badge">프로필 수정</div>
            <div className="sns-hero-title">프로필을 최신 정보로 업데이트하세요</div>
            <div className="sns-hero-subtitle">
              학력, 경력, 기술 스택을 잘 채워두면 더 많은 기회가 찾아올 수 있어요.
            </div>
          </div>

      <div className="space-y-8">
        <section className="sns-surface">
          <h2 className="sns-surface-title">기본 인적 사항</h2>
          <ProfileForm
            initialData={profileData}
            serverEmail={serverEmail}
            onDataChange={setProfileData}
            emailCheckStatus={emailCheckStatus}
            setEmailCheckStatus={setEmailCheckStatus}
          />
        </section>

        <section className="sns-surface">
          <h2 className="sns-surface-title">학력</h2>
          < EducationForm initialData={educations} onDataChange={setEducations} />
        </section>

        <section className="sns-surface">
          <h2 className="sns-surface-title">경력</h2>
          <CareerForm initialData={careers} onDataChange={setCareers} />
        </section>

        <section className="sns-surface">
          <h2 className="sns-surface-title">대외 활동</h2>
          <ActivityForm initialData={activities} onDataChange={setActivities} />
        </section>

        <section className="sns-surface">
          <h2 className="sns-surface-title">자격증</h2>
          <CertificateForm initialData={certis} onDataChange={setCertis} />
        </section>

        <section className="sns-surface">
          <h2 className="sns-surface-title">보유 기술</h2>
          <SkillsForm initialData={skills} options={{ stacks: stackOptions }} onDataChange={setSkills} />
        </section>

        {/* 자기소개 섹션 */}
        <section className="sns-surface">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
            <div>
              <h2 className="sns-surface-title" style={{ marginBottom: 6 }}>자기소개</h2>
              <p className="text-sm text-gray-600">
                💡 학력/경력/기술 스택을 자세히 작성할수록 AI가 더 정교한 소개글을 만들어줘요.
              </p>
            </div>
            <button
              onClick={handleAIGenerate}
              className="sns-hero-primary"
              style={{ boxShadow: "0 10px 22px rgba(79, 70, 229, 0.22)" }}
            >
              ✨ AI로 자동 완성하기
            </button>
          </div>
          
          <div className="relative">
            <textarea
              className={`w-full h-64 p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                profileData.bio.length >= 500 ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="자신을 소개하는 내용을 입력하거나 AI 자동 완성 기능을 이용해 보세요."
              value={profileData.bio}
              onChange={handleBioChange}
            />
            <div className="absolute bottom-4 right-4 text-sm font-medium">
              <span className={profileData.bio.length >= 500 ? "text-red-500" : "text-gray-400"}>
                {profileData.bio.length}
              </span>
              <span className="text-gray-400"> / 500자</span>
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-4 mt-12 mb-20">
        <button 
          className="px-8 py-3 rounded-xl border font-medium text-gray-600 hover:bg-gray-50" 
          onClick={() => navigate(-1)}
        >
          취소
        </button>
        <button 
          className="sns-hero-primary"
          style={{ height: 46, padding: "0 22px" }}
          onClick={handleSave}
        >
          전체 저장하기
        </button>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;