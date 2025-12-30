import React, { useState, useEffect } from "react";
import { getFollowers, getFollowing, getImageUrl } from "../api";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const FollowListModal = ({ isOpen, onClose, username, type }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && username) {
      setLoading(true);
      const fetchApi = type === "followers" ? getFollowers : getFollowing;
      
      fetchApi(username)
        .then((res) => {
          setUsers(res.data?.data || res.data || []);
        })
        .catch((err) => console.error(`${type} fetch error:`, err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, username, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-black text-xl text-gray-800">
            {type === "followers" ? "팔로워" : "팔로잉"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center py-20 space-y-3">
              <div className="w-8 h-8 border-4 border-[#6c5ce7] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 font-medium">불러오는 중...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    window.location.href = `/profile/${user.username}`;
                  }}
                >
                  <img 
                    src={user.profileImageUrl ? getImageUrl(user.profileImageUrl) : DEFAULT_AVATAR} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-100" 
                    alt={user.username}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 leading-tight">{user.name || user.username}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 font-medium">목록이 비어있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;