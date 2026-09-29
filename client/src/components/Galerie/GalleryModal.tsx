import "./GalleryModal.css";

import { useRef, useState } from "react";

type GalleryModalProps = {
  onClose: () => void;
  onAddPhoto: (imageUrl: string, insertId: number, description: string) => void;
  eventUuid: string;
  userId: number;
};

function GalleryModal({
  onClose,
  onAddPhoto,
  eventUuid,
  userId,
}: GalleryModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Seuls les formats JPG, PNG et WEBP sont autorisés.");
      setPreview(null);
      return;
    }

    setError("");
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAddClick = async () => {
    if (!selectedFile || !eventUuid) return;

    try {
      setError("");

      const formData = new FormData();

      formData.append("event_uuid", eventUuid);
      formData.append("gallery_id_user", userId.toString());
      formData.append("gallery_description", description);

      formData.append("photo", selectedFile);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/gallery`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Erreur serveur interne." }));
        setError(
          errorData.message || "Une erreur est survenue lors de l'envoi.",
        );
        return;
      }

      const data = await response.json();
      onAddPhoto(data.photoUrl, data.insertId, description);
      onClose();
    } catch (error) {
      console.error("Erreur de connexion :", error);
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    }
  };

  // Classes GalleryForm-* : champs et boutons calqués sur la modale de
  // modification d'événement, à l'écart des règles globales .modal.
  return (
    <div className="GalleryForm-Overlay">
      <div className="GalleryForm">
        <h2 className="GalleryForm-Title">Ajouter une photo</h2>

        <div className="GalleryForm-Field">
          <label className="GalleryForm-Label" htmlFor="gallery-photo">
            Photo
          </label>
          <div className="GalleryForm-Image">
            {preview && (
              <img
                src={preview}
                alt="Prévisualisation"
                className="GalleryForm-Preview"
              />
            )}
            <button
              type="button"
              className="GalleryForm-ImageButton"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? "Changer la photo" : "Choisir une photo"}
            </button>
            <p className="GalleryForm-Help">JPG, PNG, WEBP - Max. 5 Mo</p>
          </div>
          <input
            ref={fileInputRef}
            id="gallery-photo"
            className="GalleryForm-FileInput"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
          />
        </div>

        <div className="GalleryForm-Field">
          <label className="GalleryForm-Label" htmlFor="gallery-description">
            Description (facultatif)
          </label>
          <input
            id="gallery-description"
            className="GalleryForm-Input"
            type="text"
            placeholder="Ex : Soirée au bord du lac"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <p className="GalleryForm-Error" role="alert">
            {error}
          </p>
        )}

        <div className="GalleryForm-Actions">
          <button
            type="button"
            className="GalleryForm-ButtonCancel"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="GalleryForm-ButtonSubmit"
            onClick={handleAddClick}
            disabled={!preview}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

export default GalleryModal;
