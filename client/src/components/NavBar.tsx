import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">Show Finder</div>
      <div className="navbar-links">
        <NavLink to="/" end>
          Browse
        </NavLink>
        <NavLink to="/for-you">For You</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </div>
      <div className="navbar-actions">
        <span className="navbar-email">{user.email}</span>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
