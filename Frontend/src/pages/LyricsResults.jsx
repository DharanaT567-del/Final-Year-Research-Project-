import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AudioLines,
  BookOpenText,
  CheckCircle2,
  Clipboard,
  FileAudio,
  Languages,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function LyricsResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const song = location.state;

  if (!song?.fileName) {
    return (
      <div className="empty-results">
        <div className="component-icon">
          <FileAudio size={25} />
        </div>
        <h1>No song selected</h1>
        <p>Upload a Sinhala song to begin the transcription workflow.</p>
        <button
          className="primary-button"
          onClick={() => navigate("/process")}
        >
          <AudioLines size={18} />
          Upload a song
        </button>
      </div>
    );
  }

  return (
    <div className="lyrics-page">
      <button
        className="back-link"
        onClick={() => navigate("/process")}
      >
        <ArrowLeft size={16} /> Back to processing
      </button>

      <div className="page-intro results-intro">
        <div className="eyebrow">
          <BookOpenText size={15} />
          TRANSCRIPTION WORKSPACE
        </div>
        <h1>Review your <span>song details.</span></h1>
        <p>
          This screen is prepared for the output of your Sinhala
          speech-to-text model.
        </p>
      </div>

      <section className="result-song-card">
        <div className="result-song-icon">
          <AudioLines size={27} />
        </div>
        <div className="result-song-info">
          <span className="result-label">SELECTED SONG</span>
          <h2>{song.songTitle || "Untitled Sinhala song"}</h2>
          <p>{song.artist || "Artist not specified"}</p>
          <span className="file-name">{song.fileName}</span>
        </div>
        <span className="result-status">
          <CheckCircle2 size={15} /> File selected
        </span>
      </section>

      <div className="result-grid">
        <section className="upload-card transcription-card">
          <div className="component-heading">
            <div className="component-icon">
              <Languages size={20} />
            </div>
            <div>
              <h3>Original Sinhala lyrics</h3>
              <p>Transcription output will appear here.</p>
            </div>
          </div>

          <div className="transcription-placeholder">
            <div className="placeholder-icon">
              <AudioLines size={27} />
            </div>
            <h4>Waiting for transcription model</h4>
            <p>
              Your uploaded file has been selected successfully.
              The actual Sinhala lyrics will appear here after we
              integrate your speech-to-text model.
            </p>
            <span className="demo-status">
              <span className="status-dot" />
              UI demonstration · No transcription performed
            </span>
          </div>
        </section>

        <aside className="upload-card result-summary">
          <div className="component-heading">
            <div className="component-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Processing summary</h3>
              <p>Current prototype state</p>
            </div>
          </div>

          <div className="summary-row">
            <span>Source language</span>
            <strong>සිංහල</strong>
          </div>
          <div className="summary-row">
            <span>Learning level</span>
            <strong>
              {song.level === "intermediate" ? "Intermediate" : "Beginner"}
            </strong>
          </div>
          <div className="summary-row">
            <span>Audio file</span>
            <strong className="summary-value">Selected</strong>
          </div>
          <div className="summary-row">
            <span>Transcription</span>
            <strong className="summary-pending">Not connected</strong>
          </div>

          <div className="summary-note">
            Simplification, translation and vocabulary analysis will follow
            once transcription is integrated.
          </div>
        </aside>
      </div>

      <section className="upload-card next-steps-card">
        <div className="component-heading">
          <div className="component-icon">
            <BookOpenText size={20} />
          </div>
          <div>
            <h3>Next learning steps</h3>
            <p>These features will be enabled as the AI pipeline develops.</p>
          </div>
        </div>

        <div className="pipeline-list">
          <div className="pipeline-item">
            <span className="pipeline-number">01</span>
            <div>
              <strong>Transcribe Sinhala audio</strong>
              <p>Convert sung audio into Sinhala text.</p>
            </div>
            <span className="pipeline-pending">Planned</span>
          </div>
          <div className="pipeline-item">
            <span className="pipeline-number">02</span>
            <div>
              <strong>Simplify lyrics</strong>
              <p>Prepare understandable lyrics for the selected level.</p>
            </div>
            <span className="pipeline-pending">Planned</span>
          </div>
          <div className="pipeline-item">
            <span className="pipeline-number">03</span>
            <div>
              <strong>Explain vocabulary and idioms</strong>
              <p>Help learners understand unfamiliar expressions.</p>
            </div>
            <span className="pipeline-pending">Planned</span>
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button
          className="secondary-button"
          onClick={() => navigate("/process")}
        >
          <RotateCcw size={16} /> Select another song
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(
                `Song: ${song.songTitle}\nArtist: ${song.artist}\nAudio: ${song.fileName}\nSource language: Sinhala`
              );
            }
          }}
        >
          <Clipboard size={16} /> Copy song details
        </button>
      </div>
    </div>
  );
}
