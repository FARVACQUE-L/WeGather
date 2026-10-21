import { Download, Heart, Pencil, Trash2 } from "lucide-react";

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
  // L'image est servie par l'API, sur une autre origine en dev : l'attribut
  // download d'un lien y est ignoré et le navigateur ouvrirait l'image. On la
  // récupère donc en blob pour forcer le téléchargement.
  const handleDownload = async () => {
    try {
      const response = await fetch(photo.gallery_link);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = photo.gallery_link.split("/").pop() || "photo";
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
