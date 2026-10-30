import { Download, Heart, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

const API_URL = import.meta.env.VITE_API_URL;

// Appui long sur mobile : durée avant l'ouverture du menu, et déplacement
// au-delà duquel le doigt fait défiler la page au lieu d'appuyer.
const LONG_PRESS_DELAY = 500;
const LONG_PRESS_TOLERANCE = 10;

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
  // Auteur de la photo ou hôte : modifier et supprimer.
  canManage: boolean;
  onPreview: (url: string) => void;
  onLike: (id: number) => void;
  onEdit: (photo: Gallery) => void;
  onDelete: (id: number) => void;
};

export function PhotoItem({
  photo,
  isLiked,
  canManage,
  onPreview,
  onLike,
  onEdit,
  onDelete,
}: PhotoItemProps) {
  // /uploads sert les photos sans extension ni Content-Type : la route de
  // téléchargement renvoie le vrai type. L'API est sur une autre origine en
  // dev, où l'attribut download d'un lien est ignoré : on passe par un blob.
  // Sans no-store, un 304 réutilise la réponse en cache, Content-Type compris,
  // et une ancienne réponse sans le bon type donnait un fichier sans extension.
  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/gallery/${photo.gallery_id}/download`,
        { credentials: "include", cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const extension = blob.type.startsWith("image/")
        ? blob.type.slice("image/".length).replace("jpeg", "jpg")
        : null;
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

  // Sous 428px, les boutons sur la photo sont masqués (Galerie.css) : un appui
  // court l'agrandit, un appui long ouvre un menu avec les mêmes actions.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  // Le relâchement qui suit un appui long déclenche aussi un clic : il ne
  // doit pas agrandir la photo.
  const isLongPressRef = useRef(false);

  const cancelPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressStartRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isLongPressRef.current = false;
    if (!window.matchMedia("(max-width: 428px)").matches) return;
    pressStartRef.current = { x: e.clientX, y: e.clientY };
    pressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      pressTimerRef.current = null;
      setIsMenuOpen(true);
    }, LONG_PRESS_DELAY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const start = pressStartRef.current;
    if (
      start &&
      Math.hypot(e.clientX - start.x, e.clientY - start.y) >
        LONG_PRESS_TOLERANCE
    ) {
      cancelPress();
    }
  };

  // Le menu s'ouvre sous le doigt encore posé : selon le navigateur, le clic
  // du relâchement arrive sur le menu et le fermerait ou lancerait une
  // action. Il est ignoré ; un nouvel appui, lui, remet le drapeau à zéro.
  const resetLongPress = () => {
    isLongPressRef.current = false;
  };

  const ignoreLongPressClick = () => {
    if (!isLongPressRef.current) return false;
    isLongPressRef.current = false;
    return true;
  };

  // Ferme le menu avant de lancer l'action choisie.
  const runMenuAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <article className="galerie-item">
      <button
        type="button"
        className="photo-button"
        onClick={() => {
          if (!ignoreLongPressClick()) onPreview(photo.gallery_link);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        // Sans ça, l'appui long ouvre aussi le menu du navigateur sur
        // l'image (enregistrer, partager).
        onContextMenu={(e) => {
          if (window.matchMedia("(max-width: 428px)").matches) {
            e.preventDefault();
          }
        }}
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

        {canManage && (
          <>
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
          </>
        )}
      </div>

      {/* Rendu dans body : la case de la photo est en overflow: hidden et la
          barre de navigation passerait au-dessus. */}
      {isMenuOpen &&
        createPortal(
          <div className="PhotoMenu-Overlay">
            {/* Toute la surface autour du menu : un appui ferme le menu,
                comme sur l'aperçu d'une photo (.overlay-close). */}
            <button
              type="button"
              className="PhotoMenu-Close"
              aria-label="Fermer le menu"
              onPointerDown={resetLongPress}
              onClick={() => {
                if (!ignoreLongPressClick()) setIsMenuOpen(false);
              }}
            />
            <div
              className="PhotoMenu"
              role="dialog"
              aria-label="Actions sur la photo"
              onPointerDownCapture={resetLongPress}
              onClickCapture={(e) => {
                if (ignoreLongPressClick()) e.stopPropagation();
              }}
            >
              <img
                src={photo.gallery_link}
                alt=""
                className="PhotoMenu-Preview"
              />
              <button
                type="button"
                className={isLiked ? "is-liked" : undefined}
                onClick={() => runMenuAction(() => onLike(photo.gallery_id))}
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                {`${isLiked ? "Je n'aime plus" : "J'aime"} (${photo.like_count ?? 0})`}
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => runMenuAction(() => onEdit(photo))}
                >
                  <Pencil size={18} />
                  Modifier la description
                </button>
              )}
              <button
                type="button"
                onClick={() => runMenuAction(handleDownload)}
              >
                <Download size={18} />
                Télécharger
              </button>
              {canManage && (
                <button
                  type="button"
                  className="PhotoMenu-Delete"
                  onClick={() =>
                    runMenuAction(() => onDelete(photo.gallery_id))
                  }
                >
                  <Trash2 size={18} />
                  Supprimer
                </button>
              )}
              <button
                type="button"
                className="PhotoMenu-Cancel"
                onClick={() => setIsMenuOpen(false)}
              >
                Annuler
              </button>
            </div>
          </div>,
          document.body,
        )}
    </article>
  );
}
