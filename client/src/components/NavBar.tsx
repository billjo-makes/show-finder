import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function NavBar() {
  const { user, activeProfile, profiles, switchProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileMenuOpen) return;
    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [profileMenuOpen]);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleSwitch(profileId: string) {
    setProfileMenuOpen(false);
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
        <NavLink to="/watchlist">Watch List</NavLink>
        <NavLink to="/account">Account</NavLink>
      </div>
      <div className="navbar-actions">
        {activeProfile && (
          <div
            className={`navbar-profile-switcher${profileMenuOpen ? " open" : ""}`}
            ref={switcherRef}
          >
            <button
              type="button"
              className="navbar-profile-name"
              onClick={() => setProfileMenuOpen((open) => !open)}
              aria-expanded={profileMenuOpen}
            >
              {activeProfile.name}
            </button>
            <div className="navbar-profile-dropdown">
              {otherProfiles.map((profile) => (
                <button key={profile.id} onClick={() => handleSwitch(profile.id)}>
                  {profile.name}
                </button>
              ))}
              <NavLink to="/profiles" onClick={() => setProfileMenuOpen(false)}>
                Manage Profiles
              </NavLink>
            </div>
          </div>
        )}
        <span className="navbar-email">{user.email}</span>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
