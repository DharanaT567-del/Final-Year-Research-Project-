import { Bell, Mail, Sparkles } from "lucide-react";

const notifications = [
  {
    title: "New learning path ready",
    description: "A fresh Sinhala song lesson is available for you to review.",
    time: "2 min ago",
    tone: "info",
  },
  {
    title: "Vocabulary reminder",
    description: "You have 6 new words waiting in your music study list.",
    time: "45 min ago",
    tone: "highlight",
  },
  {
    title: "Processing complete",
    description: "Your latest song analysis has been prepared for review.",
    time: "Today",
    tone: "success",
  },
];

export default function Notifications() {
  return (
    <div className="lyrics-page notifications-page">
      <div className="page-intro">
        <div className="eyebrow">
          <Bell size={15} />
          NOTIFICATIONS
        </div>
        <h1>Stay on top of <span>your learning.</span></h1>
        <p>
          Quick updates about new lessons, study reminders, and progress changes.
        </p>
      </div>

      <section className="upload-card notifications-card">
        <div className="component-heading">
          <div className="component-icon">
            <Mail size={20} />
          </div>
          <div>
            <h3>Recent updates</h3>
            <p>Latest activity from your music learning workspace.</p>
          </div>
        </div>

        <div className="notification-list">
          {notifications.map((item) => (
            <article className="notification-item" key={item.title}>
              <div className={`notification-icon ${item.tone}`}>
                {item.tone === "success" ? <Sparkles size={18} /> : <Bell size={18} />}
              </div>

              <div className="notification-copy">
                <div className="notification-topline">
                  <strong>{item.title}</strong>
                  <span>{item.time}</span>
                </div>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}