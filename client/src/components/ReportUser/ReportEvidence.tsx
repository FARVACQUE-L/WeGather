import { FileUp, StickyNoteCheck, X } from "lucide-react";
import { useRef } from "react";
import "./ReportEvidence.css";

const fileKey = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

interface ReportEvidenceProps {
  reportEvidence: File[];
  setReportEvidence: (value: File[]) => void;
}

function ReportEvidence({
  reportEvidence,
  setReportEvidence,
}: ReportEvidenceProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.filter(
      (file) =>
        !reportEvidence.some((existing) => fileKey(existing) === fileKey(file)),
    );
    setReportEvidence([...reportEvidence, ...newFiles]);
  };

  const handleRemove = (index: number) => {
    setReportEvidence(reportEvidence.filter((_, i) => i !== index));
  };

  return (
    <fieldset className="reportEvidence-global">
      <legend>Preuves & Captures</legend>
      <button
        type="button"
        className="reportEvidence-dropzone"
        onClick={() => inputRef.current?.click()}
      >
        <div className="reportEvidence-previews">
          {reportEvidence.map((file, index) => (
            <div key={fileKey(file)} className="reportEvidence-item">
              <button
                type="button"
                className="reportEvidence-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                aria-label="Supprimer ce fichier"
              >
                <X size={14} />
              </button>
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="aperçu"
                  className="photoEvidence-preview"
                />
              ) : (
                <span className="reportEvidence-pdf">
                  <StickyNoteCheck size={28} /> PDF sélectionné
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="reportEvidence-logoIcon">
          <FileUp size={32} className="reportEvidences-icon" />
        </div>
        Faites glisser ou partager vos fichiers ici.
        <p>JPG, PNG ou PDF (Max. 8Mo par fichier)</p>
        <input
          ref={inputRef}
          type="file"
          onChange={handleChange}
          accept=".jpg, .png, .pdf"
          multiple
        />
      </button>
    </fieldset>
  );
}

export default ReportEvidence;
