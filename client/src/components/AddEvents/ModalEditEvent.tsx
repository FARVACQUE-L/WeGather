import { useEffect, useRef, useState } from "react";
import type { EventData, ModalEditEventProps } from "../../types/Events";
import "./ModalEditEvent.css";

const formatDate = (date: string): string => {
  return date.split("T")[0];
};

function ModalEditEvent({
  isOpen,
  onClose,
  event,
  onEventUpdated,
}: ModalEditEventProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(event.event_picture);
  const [form, setForm] = useState({
    event_name: event.event_name,
    event_date_start: formatDate(event.event_date_start),
    event_date_end: formatDate(event.event_date_end),
    event_description: event.event_description,
    event_location: event.event_location,
  });
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      setForm({
        event_name: event.event_name,
        event_date_start: formatDate(event.event_date_start),
        event_date_end: formatDate(event.event_date_end),
        event_description: event.event_description,
        event_location: event.event_location,
      });
      setPreviewImage(event.event_picture);
      setSelectedFile(null);
      setError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen, event]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      onClose();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const formatted =
      name === "event_date_start" || name === "event_date_end"
        ? value
        : value.charAt(0).toUpperCase() + value.slice(1);

    setForm((prev) => {
      const next = { ...prev, [name]: formatted };
      if (name === "event_date_start" && next.event_date_end < formatted) {
        next.event_date_end = formatted;
      }

      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("event_name", form.event_name);
      formData.append("event_date_start", form.event_date_start);
      formData.append("event_date_end", form.event_date_end);
      formData.append("event_description", form.event_description);
      formData.append("event_location", form.event_location);
      if (selectedFile) {
        formData.append("picture", selectedFile);
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events/${event.event_uuid}`,
        { method: "PUT", credentials: "include", body: formData },
      );

      if (!res.ok) throw new Error("Erreur lors de la modification");

      const updatedEvent: EventData = await res.json();
      onEventUpdated(updatedEvent);
      onClose();
    } catch {
      setError("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="ModalEditEvent-Backdrop"
      onClick={handleBackdropClick}
      onKeyUp={() => {}}
      onCancel={onClose}
      aria-labelledby="modal-edit-title"
    >
      <div className="ModalEditEvent-Global">
        <h2 className="ModalEditEvent-Title" id="modal-edit-title">
          Modifiez votre événement
        </h2>

        {error && (
          <p className="ModalEditEvent-Error" role="alert">
            {error}
          </p>
        )}
        <form
          className="ModalEditEvent-Body"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="ModalEditEvent-Field">
            <label className="ModalEditEvent-Label" htmlFor="event_name">
              Nom de l'événement
            </label>
            <input
              id="event_name"
              className="ModalEditEvent-Input"
              type="text"
              name="event_name"
              value={form.event_name}
              onChange={handleChange}
              maxLength={45}
            />
          </div>

          <div className="ModalEditEvent-Field">
            <div className="ModalEditEvent-DateGlobal">
              <div className="ModalEditEvent-Date">
                <label
                  className="ModalEditEvent-Label"
                  htmlFor="event_date_start"
                >
                  Date de début
                </label>
                <input
                  id="event_date_start"
                  className="ModalEditEvent-DateInput"
                  type="date"
                  name="event_date_start"
                  value={form.event_date_start}
                  onChange={handleChange}
                  min={today}
                />
              </div>
              <div className="ModalEditEvent-Date">
                <label
                  className="ModalEditEvent-Label"
                  htmlFor="event_date_end"
                >
                  Date de fin
                </label>
                <input
                  id="event_date_end"
                  className="ModalEditEvent-DateInput"
                  type="date"
                  name="event_date_end"
                  value={form.event_date_end}
                  onChange={handleChange}
                  min={form.event_date_start || today}
                />
              </div>
            </div>
          </div>

          <div className="ModalEditEvent-Field">
            <label className="ModalEditEvent-Label" htmlFor="event_description">
              Description
            </label>
            <textarea
              id="event_description"
              className="ModalEditEvent-TextArea"
              name="event_description"
              value={form.event_description}
              onChange={handleChange}
              rows={4}
              maxLength={255}
            />
            <span className="ModalEditEvent-Counter">
              {form.event_description.length}/255
            </span>
          </div>

          <div className="ModalEditEvent-Field">
            <label className="ModalEditEvent-Label" htmlFor="event_location">
              Lieu
            </label>
            <input
              id="event_location"
              className="ModalEditEvent-Input"
              name="event_location"
              value={form.event_location}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="ModalEditEvent-Field">
            <label
              className="ModalEditEvent-Label"
              htmlFor="ModalEditEvent-Preview"
            >
              Image
            </label>
            <div className="ModalEditEvent-ImageGlobal">
              <img
                src={previewImage}
                alt="prévisualisation"
                className="ModalEditEvent-Preview"
              />

              <button
                type="button"
                className="ModalEditEvent-ImageButton"
                onClick={() => fileInputRef.current?.click()}
              >
                Changer l'image
              </button>
            </div>
            <input
              ref={fileInputRef}
              id="event_picture"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <footer className="ModalEditEvent-Footer">
            <button
              type="button"
              className="ModalEditEvent-ButtonCancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="ModalEditEvent-ButtonSubmit"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Modification..." : "Modifier"}
            </button>
          </footer>
        </form>
      </div>
    </dialog>
  );
}
export default ModalEditEvent;
