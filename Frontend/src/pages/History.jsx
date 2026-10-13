
import { Link } from "react-router-dom";
import {
  AudioLines,
  ArrowRight,
  Clock3,
  FileAudio,
  History as HistoryIcon,
  Info,
} from "lucide-react";

const demoRecords = [
  {
    title: "Sample Sinhala Song 01",
    artist: "Demonstration record",
    status: "Awaiting model integration",
  },
  {
    title: "Sample Sinhala Song 02",
    artist: "Demonstration record",
    status: "Awaiting model integration",
  },
];

export default function History() {
  return (
    <div className="lyrics-page">
      <div className="page-intro">
        <div className="eyebrow">
          <HistoryIcon size={15} />
          YOUR LEARNING WORKSPACE
        </div>

        <h1>Learning <span>history.</span></h1>

        <p>
          Review your song-processing activity. Saved history
          will be enabled after backend and database integration.
        </p>
      </div>

      <div className="processing-notice">
        <Info size={18} />
        <p>
          <strong>Demonstration data:</strong> These example entries
          are not saved records from Firebase.
        </p>
      </div>

      <section className="upload-card history-card">
        <div className="component-heading">
          <div className="component-icon">
            <Clock3 size={20} />
          </div>
          <div>
            <h3>Recently processed songs</h3>
            <p>Example entries for Progress Presentation 1.</p>
          </div>
        </div>

        <div className="history-list">
          {demoRecords.map((record) => (
            <article className="history-item" key={record.title}>
              <div className="history-song-icon">
                <FileAudio size={21} />
              </div>

              <div className="history-song-info">
                <strong>{record.title}</strong>
                <span>{record.artist}</span>
                <small>Sample entry</small>
              </div>

              <span className="history-status">
                {record.status}
              </span>

              <Link
                to="/process"
                className="history-action"
                aria-label={`Process a new song based on ${record.title}`}
              >
                <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </div>

        <Link to="/process" className="primary-button">
          <AudioLines size={18} />
          Process a Sinhala song
          <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
