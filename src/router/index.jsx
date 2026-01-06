import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/RootLayout";
import SignupPage from "../pages/SignupPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import KakaoCallback from "../pages/KakaoCallback.jsx";
import PostCreatePage from "../pages/PostCreatePage.jsx";
import SnsLayoutPage from "../pages/SnsLayoutPage.jsx";
import RecentPostListPage from "../pages/RecentPostListPage.jsx";
import PostDetailPage from "../pages/PostDetailPage.jsx";
import FeedPage from "../pages/FeedPage.jsx";
import TrendingPage from "../pages/TrendingPage.jsx";
import ChatListPage from "../pages/ChatListPage.jsx";
import ChatRoomPage from "../pages/ChatRoomPage.jsx";
import ProfileEditPage from "../pages/ProfileEditPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import ProfilePostPage from "../pages/ProfilePostPage.jsx";
import RecruitMainPage from "../pages/RecruitMainPage.jsx";
import RecruitCreatePage from "../pages/RecruitCreatePage.jsx";
import RecruitDetailPage from "../pages/RecruitDetailPage.jsx";
import { PublicRoute, PrivateRoutes } from "./ProtectedRoute.jsx";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import { ChatProvider } from "../contexts/ChatContext.jsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: (
			<AuthProvider>
				<ChatProvider>
					<RootLayout />
				</ChatProvider>
			</AuthProvider>
		),
		children: [
			{
				// SNS(=최신) 영역: 헤더 탭 고정 + 아래만 라우팅으로 교체
				element: <SnsLayoutPage />,
				children: [
					{
						index: true,
						element: <RecentPostListPage />,
					},
					{
						path: "posts",
						element: <RecentPostListPage />,
					},
					{
						path: "trending",
						element: <TrendingPage />,
					},
					{
						path: "feed",
						element: (
							<PrivateRoutes>
								<FeedPage />
							</PrivateRoutes>
						),
					},
				],
			},
			{
				path: "posts/new",
				element: (
					<PrivateRoutes>
						<PostCreatePage />
					</PrivateRoutes>
				),
			},
			{
				path: "posts/:id/edit",
				element: (
					<PrivateRoutes>
						<PostCreatePage />
					</PrivateRoutes>
				),
			},
			{
				path: "posts/:id",
				element: <PostDetailPage />,
			},
			{
				path: "login",
				element: (
					<PublicRoute>
						<LoginPage />
					</PublicRoute>
				),
			},
			{
				path: "signup",
				element: (
					<PublicRoute>
						<SignupPage />
					</PublicRoute>
				),
			},
			{
				path: "oauth/kakao/callback",
				element: <KakaoCallback />,
			},
			// 누구나 볼 수 있는 모집글 경로
			{
				path: "recruits",
				element: <RecruitMainPage />,
			},
			{
				path: "recruits/:id",
				element: <RecruitDetailPage />,
			},
			{
				// 인증이 필요한 보호된 루트들
				element: <PrivateRoutes />,
				children: [
					{
						path: "recruits/create", // 작성 페이지를 보호 구역으로 이동
						element: <RecruitCreatePage />,
					},
					{
						path: "chat",
						element: <ChatListPage />,
					},
					{
						path: "chat/:roomId",
						element: <ChatRoomPage />,
					},
					{
						path: "profile",
						children: [
							{
								index: true,
								element: <ProfilePage />,
							},
							{
								path: "edit",
								element: <ProfileEditPage />,
							},
							{
								path: "my/posts",
								element: <ProfilePostPage />,
							},
							{
								path: ":username",
								element: <ProfilePage />,
							},
							{
								path: ":username/posts",
								element: <ProfilePostPage />,
							},
						],
					},
				],
			},
		],
	},
]);

export default router;
