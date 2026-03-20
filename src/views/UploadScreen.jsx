import React from 'react';

export default function UploadScreen({ onUpload }) {
  const [dragOver, setDragOver] = React.useState(false);
  const fileRef = React.useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onUpload(f);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) onUpload(f);
  };

  return (
    <div className="upload-screen">
      <div
        className={`upload-box${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📊</div>
        <div className="upload-title">Payout Intelligence</div>
        <div className="upload-desc">
          Upload your <strong>Payout_Tracker.xlsx</strong> to begin.<br />
          All analysis stays local — nothing leaves your browser.
        </div>
        <button className="upload-btn-main" onClick={() => fileRef.current?.click()}>
          ⚡ Load Tracker Excel
        </button>
        <div className="upload-hint">
          Drag & drop anywhere · .xlsx / .xls · Data Log sheet
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
