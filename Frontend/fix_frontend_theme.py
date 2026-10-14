from pathlib import Path

root = Path(r'd:\SLIIT\Research\J26-IT-365\Frontend')

# Update App.jsx
p = root / 'src' / 'App.jsx'
text = p.read_text(encoding='utf-8')
old = 'import History from "./pages/History";\nimport "./App.css";\n'
new = 'import History from "./pages/History";\nimport Notifications from "./pages/Notifications";\nimport "./App.css";\n'
if old not in text:
    raise SystemExit('App.jsx import block not found')
text = text.replace(old, new)
old = '            <Route path="/history" element={<History />} />\n            <Route path="*" element={<Navigate to="/" replace />} />\n'
new = '            <Route path="/history" element={<History />} />\n            <Route path="/notifications" element={<Notifications />} />\n            <Route path="*" element={<Navigate to="/" replace />} />\n'
if old not in text:
    raise SystemExit('App.jsx routes block not found')
text = text.replace(old, new)
p.write_text(text, encoding='utf-8')

# Update Navbar.jsx
p = root / 'src' / 'components' / 'layout' / 'Navbar.jsx'
text = p.read_text(encoding='utf-8')
old = 'import { useEffect, useState } from "react";\nimport { Bell, Search, ChevronDown, Sun, Moon } from "lucide-react";\n'
new = 'import { useEffect, useState } from "react";\nimport { Link } from "react-router-dom";\nimport { Bell, Search, ChevronDown, Sun, Moon } from "lucide-react";\n'
if old not in text:
    raise SystemExit('Navbar import block not found')
text = text.replace(old, new)
old = '''        <button\n          type="button"\n          className="icon-button"\n          aria-label="Notifications"\n          title="Notifications"\n        >\n          <Bell size={19} />\n          <span className="notification-dot" />\n        </button>\n'''
new = '''        <Link\n          to="/notifications"\n          className="icon-button"\n          aria-label="Notifications"\n          title="Notifications"\n        >\n          <Bell size={19} />\n          <span className="notification-dot" />\n        </Link>\n'''
if old not in text:
    raise SystemExit('Navbar button block not found')
text = text.replace(old, new)
p.write_text(text, encoding='utf-8')

# Append CSS rules to App.css
p = root / 'src' / 'App.css'
css = p.read_text(encoding='utf-8')
append = '''\n\n.main-area {\n  flex: 1;\n  min-width: 0;\n  position: relative;\n}\n\n.topbar {\n  position: sticky;\n  top: 0;\n  z-index: 30;\n  backdrop-filter: blur(8px);\n}\n\n:root[data-theme="light"] .breadcrumb strong {\n  color: var(--text);\n}\n\n:root[data-theme="light"] body,\n:root[data-theme="light"] .main-area,\n:root[data-theme="light"] .page-content,\n:root[data-theme="light"] .dashboard,\n:root[data-theme="light"] .lyrics-page,\n:root[data-theme="light"] .upload-card,\n:root[data-theme="light"] .history-card,\n:root[data-theme="light"] .song-card,\n:root[data-theme="light"] .feature-card,\n:root[data-theme="light"] .stat-card,\n:root[data-theme="light"] .result-song-card,\n:root[data-theme="light"] .result-summary,\n:root[data-theme="light"] .transcription-card,\n:root[data-theme="light"] .next-steps-card,\n:root[data-theme="light"] .workflow-step,\n:root[data-theme="light"] .processing-notice,\n:root[data-theme="light"] .demo-note,\n:root[data-theme="light"] .welcome-note,\n:root[data-theme="light"] .hero-card,\n:root[data-theme="light"] .dropzone,\n:root[data-theme="light"] .language-display,\n:root[data-theme="light"] .selected-audio,\n:root[data-theme="light"] .summary-note,\n:root[data-theme="light"] .transcription-placeholder,\n:root[data-theme="light"] .level-option,\n:root[data-theme="light"] .empty-results {\n  background: var(--card-bg);\n  color: var(--text);\n}\n\n:root[data-theme="light"] .page-intro h1,\n:root[data-theme="light"] .welcome-row h1,\n:root[data-theme="light"] .welcome-row h1 span,\n:root[data-theme="light"] .eyebrow,\n:root[data-theme="light"] .section-heading h2,\n:root[data-theme="light"] .song-title-row h3,\n:root[data-theme="light"] .feature-card h3,\n:root[data-theme="light"] .component-heading h3,\n:root[data-theme="light"] .result-song-info h2,\n:root[data-theme="light"] .history-song-info strong,\n:root[data-theme="light"] .stat-copy > strong,\n:root[data-theme="light"] .level-option strong,\n:root[data-theme="light"] .language-display strong,\n:root[data-theme="light"] .hero-content h2,\n:root[data-theme="light"] .page-intro h1 span,\n:root[data-theme="light"] .processing-notice strong,\n:root[data-theme="light"] .demo-status,\n:root[data-theme="light"] .pipeline-item strong,\n:root[data-theme="light"] .empty-results h1 {\n  color: var(--text);\n}\n\n:root[data-theme="light"] .welcome-description,\n:root[data-theme="light"] .component-heading p,\n:root[data-theme="light"] .summary-row > span,\n:root[data-theme="light"] .pipeline-item p,\n:root[data-theme="light"] .history-song-info span,\n:root[data-theme="light"] .history-song-info small,\n:root[data-theme="light"] .song-title-row p,\n:root[data-theme="light"] .stat-copy > span,\n:root[data-theme="light"] .stat-copy > small,\n:root[data-theme="light"] .feature-card p,\n:root[data-theme="light"] .demo-note,\n:root[data-theme="light"] .page-intro > p,\n:root[data-theme="light"] .transcription-placeholder p,\n:root[data-theme="light"] .field-group > span,\n:root[data-theme="light"] .level-option p,\n:root[data-theme="light"] .language-display p,\n:root[data-theme="light"] .settings-link,\n:root[data-theme="light"] .dashboard-footer,\n:root[data-theme="light"] .processing-notice p,\n:root[data-theme="light"] .result-song-info p,\n:root[data-theme="light"] .file-name,\n:root[data-theme="light"] .empty-results p {\n  color: var(--muted);\n}\n\n:root[data-theme="light"] .search-box input,\n:root[data-theme="light"] .field-group input,\n:root[data-theme="light"] .level-option,\n:root[data-theme="light"] .dropzone,\n:root[data-theme="light"] .toggle-theme-button,\n:root[data-theme="light"] .theme-toggle,\n:root[data-theme="light"] .icon-button {\n  color: var(--text);\n}\n\n:root[data-theme="light"] .field-group input,\n:root[data-theme="light"] .search-box,\n:root[data-theme="light"] .search-box input,\n:root[data-theme="light"] .icon-button,\n:root[data-theme="light"] .selected-audio,\n:root[data-theme="light"] .summary-note,\n:root[data-theme="light"] .transcription-placeholder,\n:root[data-theme="light"] .language-display,\n:root[data-theme="light"] .level-option,\n:root[data-theme="light"] .dropzone {\n  background: var(--input-bg);\n  border-color: var(--border);\n}\n\n:root[data-theme="light"] .topbar,\n:root[data-theme="light"] .sidebar {\n  background: var(--topbar-bg);\n  border-color: var(--border);\n}\n\n:root[data-theme="light"] .hero-card {\n  background: linear-gradient(120deg, #f4ecff 0%, #eaf1ff 45%, #f3f5ff 100%);\n  border-color: #d8c9ff;\n}\n\n:root[data-theme="light"] .nav-link {\n  color: #4d5876;\n}\n\n:root[data-theme="light"] .nav-link:hover {\n  background: rgba(124, 58, 237, 0.07);\n  color: #1f2a3d;\n}\n\n:root[data-theme="light"] .nav-link.active {\n  background: linear-gradient(100deg, #efe7ff, #e8edff);\n  color: #4c1d95;\n  box-shadow: inset 2px 0 #8b5cf6;\n}\n\n:root[data-theme="light"] .search-box input::placeholder {\n  color: #7a859d;\n}\n\n:root[data-theme="light"] .notification-dot {\n  border-color: #f4f7ff;\n}\n\n:root[data-theme="light"] .dashboard-footer {\n  color: var(--text-soft);\n}\n'''
if 'position: sticky;' not in css:
    p.write_text(css + append, encoding='utf-8')
else:
    print('CSS already contains sticky rule; skipping append.')

print('Updated frontend theme and navigation.')
