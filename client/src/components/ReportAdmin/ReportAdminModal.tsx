import { CalendarX, UserX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./ReportAdminModal.css";

export type BanAction = "event" | "user";

interface ReportAdminModalProps {
  open: boolean;
  type?: string;
  // Événement signalé puis supprimé : seul l'organisateur peut être banni.
  isEventDeleted?: boolean;
  // Cible superadmin : son compte ne peut pas être banni (refusé aussi par le
  // serveur), seulement retiré de l'événement.
  isTargetSuperAdmin?: boolean;
  // Cible déjà bannie (compte, ou événement / exclusion de l'événement) :
  // l'option propose l'action inverse.
  isTargetBanned?: boolean;
  isEventBanned?: boolean;
  onClose: () => void;
  onConfirm: (action: BanAction) => void;
}

function ReportAdminModal({
  open,
  type,
  isEventDeleted = false,
  isTargetSuperAdmin = false,
  isTargetBanned = false,
  isEventBanned = false,
  onClose,
  onConfirm,
}: ReportAdminModalProps) {
  const [selected, setSelected] = useState<BanAction | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      setSelected(null);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
  };

  return (
    <dialog
      ref={dialogRef}
      className="banModal"
      aria-labelledby="modal-title"
      onClose={onClose}
    >
      <header className="banModal-Header">
        <h2 id="modal-title">Action de modération</h2>
        <button
          type="button"
          className="banModal-Close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </header>

      <div className="banModal-Options">
        {!isEventDeleted && (
          <button
            type="button"
            className="banModal-Option"
            aria-pressed={selected === "event"}
            onClick={() => setSelected("event")}
          >
            <span className="banModal-OptionIcon">
              <CalendarX size={20} />
            </span>
            <span className="banModal-OptionText">
              <span className="banModal-OptionTitle">
                {type === "event"
                  ? isEventBanned
                    ? "Débannir l'événement"
                    : "Bannir l'événement"
                  : isEventBanned
                    ? "Rajouter à l'événement"
                    : "Retirer de l'événement"}
              </span>
              <span className="banModal-OptionDesc">
                {type === "event"
                  ? isEventBanned
                    ? "Rendre cet événement de nouveau accessible à ses participants."
                    : "Supprimer cet événement des listes publiques immédiatement."
                  : isEventBanned
                    ? "Lever l'exclusion et réinscrire cet utilisateur à l'événement."
                    : "Retirer cet utilisateur de l'événement, sans bannir son compte."}
              </span>
            </span>
          </button>
        )}

        <button
          type="button"
          className="banModal-Option"
          aria-pressed={selected === "user"}
          disabled={isTargetSuperAdmin && !isTargetBanned}
          onClick={() => setSelected("user")}
        >
          <span className="banModal-OptionIcon">
            <UserX size={20} />
          </span>
          <span className="banModal-OptionText">
            <span className="banModal-OptionTitle">
              {type === "event"
                ? isTargetBanned
                  ? "Débannir l'organisateur"
                  : "Bannir l'organisateur"
                : isTargetBanned
                  ? "Débannir l'utilisateur"
                  : "Bannir l'utilisateur"}
            </span>
            <span className="banModal-OptionDesc">
              {isTargetBanned
                ? type === "event"
                  ? "Réactiver le compte de l'organisateur, et débannir les événements qu'il organise."
                  : "Réactiver le compte de l'utilisateur signalé, et débannir les événements qu'il organise."
                : isTargetSuperAdmin
                  ? "Un superadmin ne peut pas être banni définitivement."
                  : type === "event"
                    ? "Suspendre le compte de l'organisateur de façon permanente, et bannir les événements qu'il organise."
                    : "Suspendre le compte de l'utilisateur signalé de façon permanente, et bannir les événements qu'il organise."}
            </span>
          </span>
        </button>
      </div>

      <footer className="banModal-Footer">
        <button type="button" className="banModal-Cancel" onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className="banModal-Confirm"
          disabled={!selected}
          onClick={handleConfirm}
        >
          Confirmer
        </button>
      </footer>
    </dialog>
  );
}

export default ReportAdminModal;
