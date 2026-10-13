
import { Bell, Search, ChevronDown } from "lucide-react";

export default function Navbar() {
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
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

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
