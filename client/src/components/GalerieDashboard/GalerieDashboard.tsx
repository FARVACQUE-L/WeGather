import "./GalerieDashboard.css";
// Styles de l'aperçu en grand (.image-modal-overlay), partagés avec la galerie.
import "../Galerie/Galerie.css";
import { motion } from "framer-motion";
import { Images, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useCanHover from "../../helper/useCanHover";

const API_URL = import.meta.env.VITE_API_URL;

type Gallery = {
  gallery_id: number;
  gallery_id_event: number;
  gallery_id_user: number;
  gallery_link: string;
  gallery_description: string | null;
  gallery_creation_date: string | null;
};

function GalerieDashboard() {
  const canHover = useCanHover();
  const [photos, setPhotos] = useState<Gallery[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const formatImageUrl = (link: string) => {
    if (!link) return "";
    return link.startsWith("http") ? link : `${API_URL}${link}`;
  };
  const { eventUuid } = useParams();

  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${API_URL}/api/gallery/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      // L'API trie déjà de la plus récente à la plus ancienne.
      .then((data) => setPhotos(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch((error) => console.error(error));
  }, [eventUuid]);

  return (
    <section className="galerie-dash">
      <div className="galerie-header">
        <h1>
          <Images size={20} />
          Galerie récente
        </h1>
      </div>

      <div className="galerie-grid">
        {photos.map((photo) => (
          <button
            type="button"
            key={photo.gallery_id}
            className="galerie-item"
            onClick={() => setSelectedPhoto(formatImageUrl(photo.gallery_link))}
          >
            <motion.img
              src={formatImageUrl(photo.gallery_link)}
              alt={photo.gallery_description ?? "Galerie événement"}
              className="photo"
              whileHover={
                canHover
                  ? {
                      scale: 1.05,
                    }
                  : undefined
              }
              transition={{
                duration: 0.1,
              }}
            />
          </button>
        ))}
      </div>

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
    </section>
  );
}

export default GalerieDashboard;
