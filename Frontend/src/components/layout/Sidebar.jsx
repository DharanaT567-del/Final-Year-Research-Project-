import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AudioLines,
  BookOpenText,
  History,
  Settings,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Process Lyrics", path: "/process", icon: AudioLines },
  { label: "Lyrics Results", path: "/results", icon: BookOpenText },
  { label: "Learning History", path: "/history", icon: History },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand">
        <div>
          <h2>
            naada<span>.</span>
          </h2>
          <p>LEARN THROUGH MUSIC</p>
        </div>
      </NavLink>

      <div className="sidebar-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-promo">
        <h3>Learn beyond the lyrics</h3>
        <p>Discover new words and meanings through the songs you love.</p>
        <NavLink to="/process" className="promo-link">
          Start learning <span>→</span>
        </NavLink>
      </div>

      <div className="sidebar-bottom">
        <div>
          <strong>Multilingual learning</strong>
          <span>English · සිංහල · தமிழ்</span>
        </div>
      </div>

      <NavLink to="/history" className="settings-link">
        <Settings size={18} />
        <span>My learning activity</span>
      </NavLink>
    </aside>
  );
}
