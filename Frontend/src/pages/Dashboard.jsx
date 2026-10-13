import { Link } from "react-router-dom";
import {
  ArrowRight,
  AudioLines,
  BookOpenText,
  Languages,
  Sparkles,
  Clock3,
  Play,
  TrendingUp,
  Headphones,
  Lightbulb,
} from "lucide-react";

const recentSongs = [
  {
    title: "A Sky Full of Stars",
    artist: "Coldplay",
    language: "English",
    level: "Intermediate",
    color: "song-purple",
    initial: "S",
    words: 28,
  },
  {
    title: "Perfect",
    artist: "Ed Sheeran",
    language: "English",
    level: "Beginner",
    color: "song-orange",
    initial: "P",
    words: 21,
  },
  {
    title: "Sample Sinhala Song",
    artist: "Demo collection",
    language: "Sinhala",
    level: "Beginner",
    color: "song-green",
    initial: "S",
    words: 18,
  },
];

const features = [
  {
    icon: BookOpenText,
    title: "Simplify lyrics",
    description: "Understand lyrics that matches your level.",
    color: "feature-purple",
  },
  {
    icon: Languages,
    title: "Translate meaning",
    description: "Explore lyrics in Sinhala.",
    color: "feature-blue",
  },
  {
    icon: Lightbulb,
    title: "Discover expressions",
    description: "Learn unfamiliar words, slang and idioms in context.",
    color: "feature-yellow",
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <Sparkles size={15} />
            YOUR PERSONAL MUSIC CLASSROOM
          </div>
          <h1>
            Every song has a <span>story.</span>
          </h1>
          <p className="welcome-description">
            Understand the lyrics, discover new words, and learn languages
            through the music you love.
          </p>
        </div>

        <div className="welcome-note">
          <Headphones size={23} />
          <span>Listen. Understand. Learn.</span>
        </div>
      </section>

      <section className="hero-card">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            YOUR NEXT LEARNING JOURNEY
          </div>
          <h2>
            Turn your favourite songs
            <br />
            into a learning experience.
          </h2>
          <p>
            Upload a song and explore simpler lyrics, translations, vocabulary
            and expressions.
          </p>
          <Link to="/process" className="primary-button">
            <AudioLines size={18} />
            Process a new song
            <ArrowRight size={17} />
          </Link>
          <div className="hero-footnote">
            <span className="status-dot" />
            Supports English, Sinhala and Tamil learning
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-disc">
            <div className="disc-groove">
              <div className="disc-center" />
            </div>
          </div>
          <div className="floating-note note-one">♪</div>
          <div className="floating-note note-two">♫</div>
          <div className="floating-chip">
            <Sparkles size={15} /> Learn something new
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={AudioLines}
          label="Songs explored"
          value="03"
          detail="Sample activity"
          color="stat-purple"
        />
        <StatCard
          icon={BookOpenText}
          label="Words discovered"
          value="67"
          detail="Illustrative total"
          color="stat-blue"
        />
        <StatCard
          icon={Languages}
          label="Learning languages"
          value="03"
          detail="English, Sinhala, Tamil"
          color="stat-green"
        />
        <StatCard
          icon={TrendingUp}
          label="Learning level"
          value="Growing"
          detail="Keep exploring"
          color="stat-orange"
        />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">YOUR WORKSPACE</span>
            <h2>Continue exploring</h2>
            <p>Pick up where your learning journey begins.</p>
          </div>
          <Link to="/history" className="text-link">
            View history <ArrowRight size={16} />
          </Link>
        </div>

        <div className="songs-grid">
          {recentSongs.map((song) => (
            <article className="song-card" key={song.title}>
              <div className={`song-cover ${song.color}`}>
                <span className="cover-initial">{song.initial}</span>
                <div className="cover-disc" />
                <span className="cover-language">{song.language}</span>
              </div>

              <div className="song-details">
                <div className="song-title-row">
                  <div>
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                  </div>
                  <span className="song-menu">•••</span>
                </div>

                <div className="song-meta">
                  <span>{song.level}</span>
                  <span>
                    <BookOpenText size={13} /> {song.words} sample words
                  </span>
                </div>

                <Link to="/results" className="song-open-link">
                  Explore lyrics <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="demo-note">
          <Clock3 size={14} />
          These are demonstration records for the presentation, not saved user
          data.
        </p>
      </section>

      <section className="section-block features-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">LEARN WITH NAADA</span>
            <h2>More than just lyrics</h2>
            <p>Explore the meaning behind the words.</p>
          </div>
        </div>

        <div className="features-grid">
          {features.map(({ icon: Icon, title, description, color }) => (
            <article className="feature-card" key={title}>
              <div className={`feature-icon ${color}`}>
                <Icon size={21} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <Link to="/process">
                Explore feature <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>Naada</span>
        <span>Learn languages through the music you love.</span>
        <span>Research prototype · 2026</span>
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, color }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={20} />
      </div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
