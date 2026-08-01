import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function NavBar() {
  const { user, activeProfile, profiles, switchProfile, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleSwitch(profileId: string) {
    await switchProfile(profileId);
    navigate("/");
  }

  const otherProfiles = profiles.filter((p) => p.id !== activeProfile?.id);

  return (
    <nav className="navbar">
      <div className="navbar-brand">Show Finder</div>
      <div className="navbar-links">
        <NavLink to="/" end>
          Browse
        </NavLink>
        <NavLink to="/for-you">For You</NavLink>
        <NavLink to="/account">Account</NavLink>
      </div>
      <div className="navbar-actions">
        {activeProfile && (
          <div className="navbar-profile-switcher">
            <span className="navbar-profile-name">{activeProfile.name}</span>
            <div className="navbar-profile-dropdown">
              {otherProfiles.map((profile) => (
                <button key={profile.id} onClick={() => handleSwitch(profile.id)}>
                  {profile.name}
                </button>
              ))}
              <NavLink to="/profiles">Manage Profiles</NavLink>
            </div>
          </div>
        )}
        <span className="navbar-email">{user.email}</span>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
