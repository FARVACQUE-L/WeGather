import { Download, Heart, Pencil, Trash2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

type Gallery = {
  gallery_id: number;
  gallery_id_event: number;
  gallery_id_user: number;
  gallery_link: string;
  gallery_description: string | null;
  gallery_creation_date: string | null;
  event_host_id: number;
  like_count: number;
};

type PhotoItemProps = {
  photo: Gallery;
  isLiked: boolean;
  onPreview: (url: string) => void;
  onLike: (id: number) => void;
  onEdit: (photo: Gallery) => void;
  onDelete: (id: number) => void;
};

export function PhotoItem({
  photo,
  isLiked,
  onPreview,
  onLike,
  onEdit,
  onDelete,
}: PhotoItemProps) {
  // /uploads sert les photos sans extension ni Content-Type : la route de
  // téléchargement renvoie le vrai type. L'API est sur une autre origine en
  // dev, où l'attribut download d'un lien est ignoré : on passe par un blob.
  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/gallery/${photo.gallery_id}/download`,
        { credentials: "include" },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = extension
        ? `photo-${photo.gallery_id}.${extension}`
        : `photo-${photo.gallery_id}`;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erreur téléchargement:", err);
    }
  };

  return (
    <article className="galerie-item">
      <button
        type="button"
        className="photo-button"
        onClick={() => onPreview(photo.gallery_link)}
      >
        <img
          src={photo.gallery_link}
          alt={photo.gallery_description ?? "Photo de la galerie"}
          className="photo"
          loading="lazy"
        />
      </button>

      <div className="photo-description">
        {photo.gallery_description ?? "Aucune description"}
      </div>

      <div className="photo-actions">
        <div className="like-container">
          <button
            type="button"
            className={`like-button ${isLiked ? "is-liked" : ""}`}
            onClick={() => onLike(photo.gallery_id)}
            aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              size={18}
              className="heart-icon"
              fill={isLiked ? "currentColor" : "none"}
            />
          </button>
          <span className="like-counter">{photo.like_count ?? 0}</span>
        </div>

        <button
          type="button"
          className="download-button"
          onClick={handleDownload}
          aria-label="Télécharger la photo"
        >
          <Download size={18} />
        </button>

        <button
          type="button"
          className="edit-button"
          onClick={() => onEdit(photo)}
          aria-label="Modifier la description"
        >
          <Pencil size={18} />
        </button>

        <button
          type="button"
          className="delete-button"
          onClick={() => onDelete(photo.gallery_id)}
          aria-label="Supprimer la photo"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  );
}
