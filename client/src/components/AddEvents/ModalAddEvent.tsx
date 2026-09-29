import { useEffect, useRef, useState } from "react";

import type { ModalAddEventProps } from "../../types/Events";

import CreateForm from "./CreateForm";
import JoinForm from "./JoinForm";

import "./ModalAddEvent.css";

type Tab = "create" | "join";

function ModalAddEvent({
  isOpen,
  onClose,
  onEventCreated,
}: ModalAddEventProps) {
  const [activeTab, setActiveTab] = useState<Tab>("create");

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      const firstInput = dialogRef.current?.querySelector("input");
      firstInput?.focus();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  // Pas de fermeture au clic sur le fond : un clic à côté ferait perdre le
  // formulaire en cours. On ferme avec Annuler ou la touche Échap.
  return (
    <dialog
      ref={dialogRef}
      className="ModalAddEvent-Backdrop"
      onCancel={onClose}
      aria-labelledby="modal-title"
    >
      {" "}
      <div className="ModalAddEvent-Global">
        <div className="ModalAddEvent-Tabs">
          <button
            type="button"
            role="tab"
            id="tab-create"
            aria-selected={activeTab === "create"}
            aria-controls="panel-create"
            className={`ModalAddEvent-Tab ${activeTab === "create" ? "ModalAddEvent-Tab--active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            Créer un événement
          </button>
          <button
            type="button"
            role="tab"
            id="tab-join"
            aria-selected={activeTab === "join"}
            aria-controls="panel-join"
            className={`ModalAddEvent-Tab ${activeTab === "join" ? "ModalAddEvent-Tab--active" : ""}`}
            onClick={() => setActiveTab("join")}
          >
            Rejoindre un événement
          </button>
        </div>
        {activeTab === "create" ? (
          <div role="tabpanel" id="panel-create" aria-labelledby="tab-create">
            <CreateForm onClose={onClose} onEventCreated={onEventCreated} />
          </div>
        ) : (
          <div role="tabpanel" id="panel-join" aria-labelledby="tab-join">
            <JoinForm onClose={onClose} onEventCreated={onEventCreated} />
          </div>
        )}
      </div>
    </dialog>
  );
}

export default ModalAddEvent;
