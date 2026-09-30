import "./Galerie.css";
import { motion } from "framer-motion";
import { ImagePlus, X } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { useParams } from "react-router";
import GalleryModal from "./GalleryModal";
import { PhotoItem } from "./PhotoItem";

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

function Galerie() {
  const { eventUuid } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Gallery[]>([]);
  const [eventName, setEventName] = useState<string>("Chargement...");
  const [photoToEdit, setPhotoToEdit] = useState<Gallery | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPhotos, setLikedPhotos] = useState<number[]>([]);

  const formatImageUrl = (link: string): string => {
    if (!link) return "";
    return link.startsWith("http") ? link : `${API_URL}${link}`;
  };
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          setUserId(null);
          return;
        }

        const data = await res.json();
        setUserId(data.id);
      })
      .catch(() => setUserId(null));
  }, []);

  useEffect(() => {
    if (!eventUuid || userId === null) return;

    fetch(`${API_URL}/api/gallery/${eventUuid}/likes/${userId}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLikedPhotos(data))
      .catch((err) => console.error("Erreur likes:", err));
  }, [eventUuid, userId]);

  useEffect(() => {
    if (!eventUuid) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const galRes = await fetch(`${API_URL}/api/gallery/${eventUuid}`, {
          signal: controller.signal,
          credentials: "include",
        });
        if (galRes.ok) {
          setPhotos(await galRes.json());
        } else {
          setError("Impossible de charger la galerie.");
        }

        const evRes = await fetch(`${API_URL}/api/events/${eventUuid}`, {
          signal: controller.signal,
          credentials: "include",
        });
        if (evRes.ok) {
          setEventName((await evRes.json()).event_name || "Mon Événement");
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Erreur réseau lors du chargement.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, [eventUuid]);

  const toggleLike = async (photoId: number) => {
    if (!userId) return;
    const isAlreadyLiked = likedPhotos.includes(photoId);
    try {
      const url = `${API_URL}/api/gallery/${photoId}/like${isAlreadyLiked ? `/${userId}` : ""}`;
      const response = await fetch(url, {
        method: isAlreadyLiked ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: isAlreadyLiked ? undefined : JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        setLikedPhotos((prev) =>
          isAlreadyLiked
            ? prev.filter((fid) => fid !== photoId)
            : [...prev, photoId],
        );
        setPhotos((prev) =>
          prev.map((p) =>
            p.gallery_id === photoId
              ? {
                  ...p,
                  like_count: Math.max(
                    0,
                    p.like_count + (isAlreadyLiked ? -1 : 1),
                  ),
                }
              : p,
          ),
        );
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleAddPhoto = (
    imageUrl: string,
    insertId: number,
    textDescription: string,
  ) => {
    if (userId === null) return;

    setPhotos((prev) => [
      {
        gallery_id: insertId,
        gallery_id_event: 0,
        gallery_id_user: userId,
        gallery_link: imageUrl,
        gallery_description: textDescription || "Ajout galerie",
        gallery_creation_date: new Date().toISOString(),
        event_host_id: prev[0]?.event_host_id ?? 0,
        like_count: 0,
      },
      ...prev,
    ]);

    setIsModalOpen(false);
  };

  const confirmDeletePhoto = async () => {
    if (photoToDelete === null) return;
    try {
      const res = await fetch(
        `${API_URL}/api/gallery/${photoToDelete}/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.gallery_id !== photoToDelete));
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
    } finally {
      setPhotoToDelete(null);
    }
  };

  const handleUpdateDescription = async () => {
    if (!photoToEdit) return;
    try {
      const res = await fetch(
        `${API_URL}/api/gallery/${photoToEdit.gallery_id}/${userId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gallery_description: newDescription }),
        },
      );
      if (res.ok) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.gallery_id === photoToEdit.gallery_id
              ? { ...p, gallery_description: newDescription }
              : p,
          ),
        );
        setPhotoToEdit(null);
      }
    } catch (err) {
      console.error("Erreur modification:", err);
    }
  };

  // Motif répété tous les 10 photos, sur quatre lignes : la 5e en grand à
  // droite des lignes 1-2, la 6e en grand à gauche des lignes 3-4. Seules
  // ces deux-là sont placées : la grille (grid-auto-flow: dense) range les
  // autres dans l'ordre dans les cases libres. Jusqu'à 4 photos, elles
  // tiennent donc sur une ligne ; à la 5e, la 3e et la 4e passent dessous.
  function getCellLayout(index: number) {
    const position = index % 10;
    if (position !== 4 && position !== 5) {
      return {};
    }
    const firstRow = Math.floor(index / 10) * 4 + (position === 4 ? 1 : 3);
    return {
      className:
        position === 4 ? "galerie-cell-large-right" : "galerie-cell-large-left",
      style: { "--row": firstRow } as CSSProperties,
    };
  }

  if (userId === null) {
    return <p>Chargement utilisateur...</p>;
  }

  return (
    <motion.section
      className="galerie"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="galerie-header">
        <h1>{eventName}</h1>
        <button
          type="button"
          className="galerie-button"
          onClick={() => setIsModalOpen(true)}
        >
          <ImagePlus size={20} />
          <p>Ajouter une photo</p>
        </button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="error-dismiss"
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <p>Chargement de la galerie...</p>
        </div>
      )}

      {!isLoading && photos.length === 0 && (
        <div className="galerie-empty">
          <div className="galerie-empty-text">
            <p className="galerie-empty-title">
              Aucune photo dans cet événement.
            </p>

            <p className="galerie-empty-subtitle">
              Partagez vos meilleurs souvenirs en ajoutant la première photo.
            </p>
          </div>

          <svg
            className="galerie-empty-arrow"
            viewBox="0 0 600 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              className="galerie-empty-path"
              d="
        M0 330
        C20 300, 220 330, 290 300
        C340 270, 340 200, 270 205
        C220 210, 220 290, 290 290
        C370 300, 450 270, 500 90
      "
              stroke="currentColor"
              strokeLinecap="round"
            />
            <path
              className="galerie-empty-head"
              d="M470 120 L500 85 L525 130"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {!isLoading && photos.length > 0 && (
        <motion.div
          className="galerie-grid"
          aria-label="Galerie de l'événement"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {photos.map((photo, index) => (
            <motion.div
              key={photo.gallery_id}
              {...getCellLayout(index)}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.25 }}
            >
              <PhotoItem
                photo={{
                  ...photo,
                  gallery_link: formatImageUrl(photo.gallery_link),
                }}
                isLiked={likedPhotos.includes(photo.gallery_id)}
                onPreview={(url) => setSelectedPhoto(url)}
                onLike={toggleLike}
                onDelete={(fid) => setPhotoToDelete(fid)}
                onEdit={(p) => {
                  setPhotoToEdit(p);
                  setNewDescription(p.gallery_description ?? "");
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {isModalOpen && (
        <GalleryModal
          onClose={() => setIsModalOpen(false)}
          onAddPhoto={handleAddPhoto}
          eventUuid={eventUuid ?? ""}
          userId={userId}
        />
      )}

      {photoToEdit !== null && (
        <div className="GalleryForm-Overlay">
          <dialog className="GalleryForm" open>
            <h2 className="GalleryForm-Title">Modifier la description</h2>
            <div className="GalleryForm-Field">
              <label className="GalleryForm-Label" htmlFor="edit-description">
                Description
              </label>
              <input
                id="edit-description"
                type="text"
                className="GalleryForm-Input"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="GalleryForm-Actions">
              <button
                type="button"
                className="GalleryForm-ButtonCancel"
                onClick={() => setPhotoToEdit(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="GalleryForm-ButtonSubmit"
                onClick={handleUpdateDescription}
              >
                Enregistrer
              </button>
            </div>
          </dialog>
        </div>
      )}

      {photoToDelete !== null && (
        <div className="modal-overlay">
          <div className="modal" role="alertdialog">
            <h2>Supprimer cette photo ?</h2>
            <div className="modal-actions">
              <button type="button" onClick={() => setPhotoToDelete(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="delete-confirm"
                onClick={confirmDeletePhoto}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="image-modal-overlay">
          <button
            type="button"
            className="overlay-close"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={32} />
          </button>
          <img src={selectedPhoto} alt="Aperçu" className="image-modal" />
        </div>
      )}
    </motion.section>
  );
}

export default Galerie;
