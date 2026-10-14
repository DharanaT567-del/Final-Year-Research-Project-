import { useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, ChevronDown, Sun, Moon } from "lucide-react";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "dark";

  const savedTheme = localStorage.getItem("naada-theme");
  if (savedTheme) return savedTheme;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

export default function Navbar() {
  const [theme, setTheme] = useState(getInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("naada-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <span className="breadcrumb-separator">/</span>
        <strong>My learning space</strong>
      </div>

      <div className="topbar-actions">
        <label className="search-box">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search your songs..."
            aria-label="Search songs"
          />
          <kbd>⌘ K</kbd>
        </label>

        <button
          type="button"
          className="icon-button theme-toggle"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link
          to="/notifications"
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </Link>

        <div className="profile-menu">
          <div className="profile-avatar">L</div>
          <div className="profile-info">
            <strong>Learner</strong>
            <span>Language explorer</span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}
