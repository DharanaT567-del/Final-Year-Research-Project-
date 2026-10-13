import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AudioLines,
  ArrowRight,
  BookOpenText,
  Check,
  FileAudio,
  Info,
  Languages,
  Sparkles,
} from "lucide-react";
import AudioUploader from "../components/lyrics/AudioUploader";

export default function LyricsProcessing() {
  const navigate = useNavigate();

  const [audioFile, setAudioFile] = useState(null);
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [level, setLevel] = useState("beginner");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!audioFile) {
      setError("Please select a Sinhala song audio file first.");
      return;
    }

    if (!songTitle.trim()) {
      setError("Please enter the song title.");
      return;
    }

    setProcessing(true);

    // PP1 demonstration only: no real ASR model is called yet.
    navigate("/results", {
      state: {
        fileName: audioFile.name,
        songTitle: songTitle.trim(),
        artist: artist.trim() || "Artist not specified",
        level,
        demo: true,
      },
    });

    setProcessing(false);
  }

  return (
    <div className="lyrics-page">
      <div className="page-intro">
        <div className="eyebrow">
          <AudioLines size={15} />
          AI-POWERED LYRICS PROCESSING
        </div>

        <h1>Let's understand your <span>Sinhala song.</span></h1>

        <p>
          Upload a song to begin the lyrics transcription workflow.
          Your learning experience starts with the words you hear.
        </p>
      </div>

      <div className="workflow-steps">
        <div className="workflow-step active">
          <span>1</span>
          <div>
            <strong>Upload audio</strong>
            <small>Select a Sinhala song</small>
          </div>
        </div>

        <div className="workflow-connector" />

        <div className="workflow-step">
          <span>2</span>
          <div>
            <strong>Transcribe lyrics</strong>
            <small>Speech-to-text model</small>
          </div>
        </div>

        <div className="workflow-connector" />

        <div className="workflow-step">
          <span>3</span>
          <div>
            <strong>Review results</strong>
            <small>Check the transcription</small>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="processing-form">
        <AudioUploader onFileSelect={setAudioFile} />

        <section className="upload-card">
          <div className="component-heading">
            <div className="component-icon">
              <BookOpenText size={20} />
            </div>
            <div>
              <h3>Song information</h3>
              <p>Identify the song for your learning workspace.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field-group">
              <span>Song title <b>*</b></span>
              <input
                value={songTitle}
                onChange={(event) => setSongTitle(event.target.value)}
                placeholder="Enter Sinhala song title"
                required
              />
            </label>

            <label className="field-group">
              <span>Artist (optional)</span>
              <input
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
                placeholder="Enter artist name"
              />
            </label>
          </div>

          <div className="language-display">
            <div className="language-display-icon">
              <Languages size={20} />
            </div>
            <div>
              <strong>Source language</strong>
              <p>සිංහල · Sinhala</p>
            </div>
            <span className="language-locked">
              <Check size={14} /> Selected
            </span>
          </div>
        </section>

        <section className="upload-card">
          <div className="component-heading">
            <div className="component-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Learning preferences</h3>
              <p>Choose the level you want to use in later simplification.</p>
            </div>
          </div>

          <div className="level-options">
            <button
              type="button"
              className={`level-option ${level === "beginner" ? "selected" : ""}`}
              onClick={() => setLevel("beginner")}
            >
              <span className="level-radio" />
              <div>
                <strong>Beginner</strong>
                <p>Clear, simple explanations for new learners.</p>
              </div>
              {level === "beginner" && <Check size={18} />}
            </button>

            <button
              type="button"
              className={`level-option ${level === "intermediate" ? "selected" : ""}`}
              onClick={() => setLevel("intermediate")}
            >
              <span className="level-radio" />
              <div>
                <strong>Intermediate</strong>
                <p>More detailed explanations and expressions.</p>
              </div>
              {level === "intermediate" && <Check size={18} />}
            </button>
          </div>
        </section>

        <div className="processing-notice">
          <Info size={18} />
          <p>
            <strong>PP1 prototype:</strong> The current workflow demonstrates
            the interface only. Actual Sinhala transcription requires the
            speech-to-text model to be connected.
          </p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setAudioFile(null);
              setSongTitle("");
              setArtist("");
              setLevel("beginner");
              setError("");
            }}
          >
            Clear form
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={processing}
          >
            <FileAudio size={18} />
            {processing ? "Preparing..." : "Continue to results"}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
