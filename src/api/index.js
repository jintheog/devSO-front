import axios from "axios";
import { data } from "react-router-dom";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// 이미지 URL에 API 서버 주소 추가
export const getImageUrl = (path) => {
	if (!path) return null;
	if (path.startsWith("http")) return path;
	return `${API_URL}${path}`;
};

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// 요청 인터셉터 - JWT 토큰 추가
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error("API Error:", error.response || error.message);
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

// 인증 API
export const signup = (data) =>
	api.post("/api/auth/signup", data).then((res) => res.data);
export const login = (data) => api.post("/api/auth/login", data);
export const getMe = () => api.get("/api/auth/me");
export const logout = (data) => api.post("/api/auth/logout", data);

// 카카오 로그인 API
export const kakaoLogin = (code) => api.post("/api/auth/kakao", { code });

// 게시물 API
export const getPosts = (page = 0, size = 10) =>
	api.get(`/api/posts?page=${page}&size=${size}`);
export const getPost = (id) => api.get(`/api/posts/${id}`);
export const createPost = (data) => api.post("/api/posts", data);
export const updatePost = (id, data) => api.put(`/api/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/api/posts/${id}`);

// 사용자 API
export const getProfile = (username) => {
	try {
		return api.get(`/api/users/${username}`).then((res) => {
			return res;
		});
	} catch (e) {
		console.error("Error fetching profile:", e);
	}
};
export const updateProfile = (username, data) =>
	api.put(`/api/users/${username}`, data);
export const getUserPosts = (username) =>
	api.get(`/api/users/${username}/posts`);
export const searchUsers = (query) => api.get(`/api/users/search?q=${query}`);

// 댓글 API
export const getComments = (postId) => api.get(`/api/posts/${postId}/comments`);
export const createComment = (postId, data) =>
	api.post(`/api/posts/${postId}/comments`, data);
export const deleteComment = (postId, commentId) =>
	api.delete(`/api/posts/${postId}/comments/${commentId}`);

// 좋아요 API
export const likePost = (postId) => api.post(`/api/posts/${postId}/like`);
export const unlikePost = (postId) => api.delete(`/api/posts/${postId}/like`);

// 팔로우 API
export const follow = (username) => api.post(`/api/users/${username}/follow`);
export const unfollow = (username) =>
	api.delete(`/api/users/${username}/follow`);
export const getFollowers = (username) =>
	api.get(`/api/users/${username}/followers`);
export const getFollowing = (username) =>
	api.get(`/api/users/${username}/following`);

// 피드 API
export const getFeed = (page = 0, size = 10) =>
	api.get(`/api/feed?page=${page}&size=${size}`);
export const getExplore = (page = 0, size = 10) =>
	api.get(`/api/explore?page=${page}&size=${size}`);

// 파일 업로드
export const uploadFile = (file) => {
	const formData = new FormData();
	formData.append("file", file);
	return api.post("/api/files/upload", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
};

// 채팅 API
export const getMyChatRooms = () => api.get("/api/chat/rooms");
export const enterChatRoom = (opponentId) =>
	api.post(`/api/chat/rooms/${opponentId}`);
export const getChatMessages = (roomId, page = 0, size = 20) =>
	api.get(`/api/chat/rooms/${roomId}/messages?page=${page}&size=${size}`);
export const markChatAsRead = (roomId) =>
	api.post(`/api/chat/rooms/${roomId}/read`);

// 팀 모집 API
export const getRecruits = () => api.get("/api/recruits");
export const getRecruitDetail = (id) => api.get(`/api/recruits/${id}`);
export const createRecruit = (data) => api.post("/api/recruits", data);
export const updateRecruit = (id, data) => api.put(`/api/recruits/${id}`, data);
export const deleteRecruit = (id) => api.delete(`/api/recruits/${id}`);
export const toggleBookmark = (id) => api.post(`/api/recruits/${id}/bookmark`);
export const toggleStatus = (id) => api.put(`/api/recruits/${id}/status`);
export const getRecruitComments = (recruitId) => {
	return api.get(`/api/recruits/${recruitId}/comments`);
};
export const createRecruitComment = (recruitId, data) => {
	return api.post(`/api/recruits/${recruitId}/comments`, data);
};
export const updateRecruitComment = (recruitId, commentId, data) => {
	return api.put(`/api/recruits/${recruitId}/comments/${commentId}`, data);
};
export const deleteRecruitComment = (recruitId, commentId) => {
	return api.delete(`/api/recruits/${recruitId}/comments/${commentId}`);
};
// enum
export const getPositions = () => api.get("/api/recruits/enum/position");
export const getTypes = () => api.get("/api/recruits/enum/type");
export const getProgress = () => api.get("/api/recruits/enum/progress-type");
export const getTechStacks = () => api.get("/api/recruits/enum/tech-stacks");
export const getContactTypes = () => api.get("/api/recruits/enum/contact");
export const getDurationTypes = () => api.get("/api/recruits/enum/duration");
export const getMemberCount = () => api.get("/api/recruits/enum/memberCount");

export default api;
