import {
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  Paperclip,
  PencilLine,
  Trash2,
  X,
} from "lucide-react";
import { useRef } from "react";
import {
  ACCEPTED_DOCUMENTS,
  formatSchedule,
  MAX_DOCUMENTS_PER_RESERVATION,
  type ReservationDocument,
  readTypeInfo,
  type WalletReservation,
} from "./reservationWallet";

type ReservationCardProps = {
  reservation: WalletReservation;
  isPast: boolean;
  // Auteur de la réservation ou hôte : modifier et supprimer la réservation.
  canManage: boolean;
  // Auteur du document ou hôte.
  canDeleteDocument: (document: ReservationDocument) => boolean;
  isUploading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddDocument: (file: File) => void;
  onDownloadDocument: (document: ReservationDocument) => void;
  onDeleteDocument: (document: ReservationDocument) => void;
};

function ReservationCard({
  reservation,
  isPast,
  canManage,
  canDeleteDocument,
  isUploading,
  onEdit,
  onDelete,
  onAddDocument,
  onDownloadDocument,
  onDeleteDocument,
}: ReservationCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { label, Icon } = readTypeInfo(reservation.reservation_type);
  const schedule = formatSchedule(reservation);
  const canAddDocument =
    reservation.documents.length < MAX_DOCUMENTS_PER_RESERVATION;

  return (
    <article className={isPast ? "WalletCard is-past" : "WalletCard"}>
      <img
        className="WalletCard-Image"
        src={`${import.meta.env.VITE_API_URL}${reservation.reservation_picture}`}
        alt={reservation.reservation_name}
      />

      <div className="WalletCard-Body">
        <div className="WalletCard-Meta">
          <span
            className={`WalletCard-Type WalletCard-Type--${reservation.reservation_type}`}
          >
            <Icon size={14} />
            {label}
          </span>
          {schedule && (
            <span className="WalletCard-Schedule">
              <Clock size={14} />
              {schedule}
            </span>
          )}
        </div>

        <h3 className="WalletCard-Title">{reservation.reservation_name}</h3>
        <p className="WalletCard-Location">
          <MapPin size={14} />
          {reservation.reservation_location}
        </p>
        <p className="WalletCard-Description">
          {reservation.reservation_description}
        </p>

        {reservation.documents.length > 0 && (
          <ul className="WalletCard-Documents">
            {reservation.documents.map((document) => (
              <li key={document.document_id} className="WalletCard-Document">
                <button
                  type="button"
                  className="WalletCard-DocumentDownload"
                  title={`Télécharger ${document.document_name}`}
                  onClick={() => onDownloadDocument(document)}
                >
                  <FileText size={14} />
                  <span>{document.document_name}</span>
                </button>
                {canDeleteDocument(document) && (
                  <button
                    type="button"
                    className="WalletCard-DocumentDelete"
                    aria-label={`Supprimer ${document.document_name}`}
                    onClick={() => onDeleteDocument(document)}
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="WalletCard-Actions">
          {reservation.reservation_link && (
            <a
              className="WalletCard-Link"
              href={reservation.reservation_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} />
              Voir le site
            </a>
          )}

          {canAddDocument && (
            <button
              type="button"
              className="WalletCard-AddDocument"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={14} />
              {isUploading ? "Envoi…" : "Ajouter un billet"}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_DOCUMENTS}
            className="WalletCard-FileInput"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAddDocument(file);
              // Permet de renvoyer le même fichier après une erreur.
              e.target.value = "";
            }}
          />

          {canManage && (
            <div className="WalletCard-Manage">
              <button
                type="button"
                aria-label="Modifier la réservation"
                onClick={onEdit}
              >
                <PencilLine size={16} />
              </button>
              <button
                type="button"
                aria-label="Supprimer la réservation"
                onClick={onDelete}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default ReservationCard;
