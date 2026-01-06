import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SnsTabs() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="sns-header-tabs">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `sns-header-tab ${isActive ? "active" : ""}`}
      >
        최신 게시글
      </NavLink>
      {isAuthenticated && (
        <NavLink
          to="/feed"
          className={({ isActive }) => `sns-header-tab ${isActive ? "active" : ""}`}
        >
          피드
        </NavLink>
      )}
      <NavLink
        to="/trending"
        className={({ isActive }) => `sns-header-tab ${isActive ? "active" : ""}`}
      >
        트렌딩
      </NavLink>
    </div>
  );
}


