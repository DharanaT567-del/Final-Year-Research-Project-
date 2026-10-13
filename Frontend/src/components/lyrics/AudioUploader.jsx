import { useRef, useState } from "react";
import { AudioLines, Upload, FileAudio, X, CheckCircle2 } from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function AudioUploader({ onFileSelect }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  function selectFile(selectedFile) {
    setError("");

    if (!selectedFile) return;

    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/mp4",
      "audio/aac",
      "audio/ogg",
      "audio/flac",
      "audio/webm",
    ];

    const validExtension = /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(
      selectedFile.name,
    );

    if (!validTypes.includes(selectedFile.type) && !validExtension) {
      setError("Please select a supported audio file such as MP3, WAV or M4A.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("The audio file must be 50 MB or smaller.");
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);
  }

  function removeFile() {
    setFile(null);
    setError("");
    onFileSelect(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section className="upload-card">
      <div className="component-heading">
        <div className="component-icon">
          <AudioLines size={20} />
        </div>
        <div>
          <h3>Upload Sinhala song</h3>
          <p>Select the audio you want to transcribe.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,audio/*"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />

      {!file ? (
        <button
          type="button"
          className="dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectFile(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="upload-icon">
            <Upload size={25} />
          </span>
          <strong>Drop your audio file here</strong>
          <span>or click to browse your device</span>
          <small>MP3, WAV, M4A or other supported audio · Maximum 50 MB</small>
        </button>
      ) : (
        <div className="selected-audio">
          <div className="audio-file-icon">
            <FileAudio size={24} />
          </div>

          <div className="audio-file-info">
            <strong>{file.name}</strong>
            <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>

          <CheckCircle2 size={19} className="success-icon" />

          <button
            type="button"
            className="remove-file"
            onClick={removeFile}
            aria-label="Remove selected audio"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
