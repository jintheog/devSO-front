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

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    profileImageUrl: "",
    phone: "",
    portfolio: "",
    email: "",
  });

  // 서버에서 처음 가져온 이메일 원본을 저장 (중복 확인 비교 기준점)
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
          
          setServerEmail(data.email || ""); // 원본 이메일 고정 저장
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
        html: `<div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 0.9rem; line-height: 1.6; max-height: 300px; overflow-y: auto;">${generatedBio.replace(/\n/g, "<br>")}</div>`,
        showCancelButton: true,
        confirmButtonText: "적용하기",
        cancelButtonText: "취소",
      });

      if (result.isConfirmed) {
        setProfileData((prev) => ({ ...prev, bio: generatedBio }));
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "생성 실패" });
    }
  };

  const handleSave = async () => {
    if (!currentUser?.username) return;

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

  if (loading) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-sans">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 pb-4 border-b">프로필 수정</h1>
      <div className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">기본 인적 사항</h2>
          <ProfileForm
            initialData={profileData}
            serverEmail={serverEmail} // ✅ 서버 원본 이메일 전달
            onDataChange={setProfileData}
          />
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">학력</h2>
          <EducationForm initialData={educations} onDataChange={setEducations} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">경력</h2>
          <CareerForm initialData={careers} onDataChange={setCareers} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">대외 활동</h2>
          <ActivityForm initialData={activities} onDataChange={setActivities} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">자격증</h2>
          <CertificateForm initialData={certis} onDataChange={setCertis} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">보유 기술</h2>
          <SkillsForm initialData={skills} options={{ stacks: stackOptions }} onDataChange={setSkills} />
        </section>

        <div className="pt-10 border-t-4 border-double">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-900">자기소개</h2>
            <button onClick={handleAIGenerate} className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700">✨ AI로 자동 완성하기</button>
          </div>
          <textarea
            className="w-full h-64 p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-12 mb-20">
        <button className="px-8 py-3 rounded-xl border" onClick={() => navigate(-1)}>취소</button>
        <button className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold" onClick={handleSave}>전체 저장하기</button>
      </div>
    </div>
  );
};

export default ProfileEditPage;