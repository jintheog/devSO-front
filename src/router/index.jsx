import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/RootLayout";
import SignupPage from "../pages/SignupPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import KakaoCallback from "../pages/KakaoCallback.jsx";
import PostCreatePage from "../pages/PostCreatePage.jsx";
import RecentPostListPage from "../pages/RecentPostListPage.jsx";
import PostDetailPage from "../pages/PostDetailPage.jsx";
import ChatListPage from "../pages/ChatListPage.jsx";
import ChatRoomPage from "../pages/ChatRoomPage.jsx";
import ProfileEditPage from "../pages/ProfileEditPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
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
        index: true,
        element: <RecentPostListPage />,
      },
      {
        path: "posts",
        element: <RecentPostListPage />,
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
			{
				path: "recruits",
				element: <RecruitMainPage />,
			},
			{
				path: "recruits/create",
				element: <RecruitCreatePage />,
			},
			{
				path: "recruits/:id",
				element: <RecruitDetailPage />,
			},
      {
        element: <PrivateRoutes />,
        children: [
          {
            path: "chat",
            element: <ChatListPage />,
          },
          {
            path: "chat/:roomId",
            element: <ChatRoomPage />,
          },
          {
            path: "profile/edit", 
            element: <ProfileEditPage />,
          },
          {
            path: "profile", 
            element: <ProfilePage />,
          },
          {
            path: "profile/:username", 
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
]);

export default router;
