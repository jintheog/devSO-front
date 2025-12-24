import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/RootLayout";
import SignupPage from "../pages/SignupPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import KakaoCallback from "../pages/KakaoCallback.jsx";
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
        path: "/",
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
