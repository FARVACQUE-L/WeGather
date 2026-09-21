import { ExternalLink, MapPin, PencilLine, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import Swal from "sweetalert2";
import type { CardEventsProps, EventData } from "../../types/Events";
import ModalEditEvent from "./ModalEditEvent";
import "./CardEvents.css";

const formatDay = (date: string): string => {
  return `${new Date(date).getDate()}`;
};

const formatMonth = (date: string): string => {
  const months = [
    "Jan",
    "Fév",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sept",
    "Oct",
    "Nov",
    "Déc",
  ];
  return months[new Date(date).getMonth()];
};

function CardEvents({
  user_id,
  event_id,
  event_uuid,
  event_id_host,
  image,
  imageAlt,
  dateStart,
  dateEnd,
  title,
  description,
  location,
  siteUrl,
  onEventDeleted,
  reservation_id_user,
  onEditReservation,
  onReservationDeleted,
  onEventUpdated,
}: CardEventsProps) {
  const uselocation = useLocation();
  const isHomeEvents = uselocation.pathname === "/homeevents";
  const onTableau = uselocation.pathname.startsWith("/tableaudebord/");
  // const { id: user_id } = JSON.parse(localStorage.getItem("user") || "{}");
  const isHost = user_id === event_id_host;
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentDescription, setCurrentDescription] = useState(description);
  const [currentImage, setCurrentImage] = useState(image);
  const [currentLocation, setCurrentLocation] = useState(location);
  const [currentDateStart, setCurrentDateStart] = useState(dateStart);
  const [currentDateEnd, setCurrentDateEnd] = useState(dateEnd);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteEventModalOpen, setIsDeleteEventModalOpen] = useState(false);

  const toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    customClass: { popup: "toast" },
  });

  const handleEventUpdated = (updatedEvent: EventData) => {
    setCurrentTitle(updatedEvent.event_name);
    setCurrentDescription(updatedEvent.event_description);
    setCurrentImage(updatedEvent.event_picture);
    setCurrentLocation(updatedEvent.event_location);
    setCurrentDateStart(updatedEvent.event_date_start);
    setCurrentDateEnd(updatedEvent.event_date_end);
    onEventUpdated?.(updatedEvent);
    toast.fire({
      icon: "success",
      text: "Événement modifié",
      customClass: { popup: "toast-error-popup" },
    });
  };
  const handleDeleteReservation = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations/delete/${event_id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Erreur suppression");
      }

      setIsDeleteModalOpen(false);
      onReservationDeleted?.(event_id);
    } catch (error) {
      console.error(error);
    }
  };
  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/event/delete/${event_uuid}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!response.ok) throw new Error("Erreur suppression");

      setIsDeleteEventModalOpen(false);
      onEventDeleted?.(event_id);
      toast.fire({
        icon: "success",
        text: "Événement supprimé",
        customClass: { popup: "toast-error-popup" },
      });
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <article className="CardEvents-Wrapper">
        <Link
          to={isHomeEvents ? `/tableaudebord/${event_uuid}` : "#"}
          className="CardEvents-Global"
        >
          <div className="CardEvents-ImageDate">
            <img
              className="CardEvents-Image"
              src={currentImage}
              alt={imageAlt}
            />
            <time className="CardEvents-Date">
              <span className="CardEvents-Date-Day">
                {formatDay(currentDateStart)}
              </span>
              <span className="CardEvents-Date-Month">
                {formatMonth(currentDateStart)}
              </span>
            </time>
          </div>
          <div className="CardEvents-Container">
            <h2 className="CardEvents-Title">{currentTitle}</h2>
            <p className="CardEvents-Description">{currentDescription}</p>
            <span className="CardEvents-Location">
              <MapPin size={14} /> {currentLocation}
            </span>
          </div>
        </Link>

        {/* Hors du <Link> de la carte : un lien dans un lien n'est pas du
            HTML valide. Reste visible même si la description est tronquée. */}
        {siteUrl && (
          <a
            className="CardEvents-Site"
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} />
            Voir le site
          </a>
        )}

        {isHost && (
          <button
            type="button"
            className="CardEvents-Edit"
            onClick={() => setIsModalOpen(true)}
          >
            <PencilLine size={16} />
          </button>
        )}
        {isHost && (
          <button
            type="button"
            className="CardEvents-Deleted"
            onClick={() => setIsDeleteEventModalOpen(true)}
          >
            <Trash2 size={16} />
          </button>
        )}
        {isDeleteEventModalOpen && (
          <div className="delete-modal-overlay">
            <div className="delete-modal">
              <h3>Supprimer l'événement</h3>
              <p>Êtes-vous sûr de vouloir supprimer cet événement ?</p>
              <div className="delete-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsDeleteEventModalOpen(false)}
                >
                  Annuler
                </button>
                <button type="button" onClick={handleDeleteEvent}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
        {onEditReservation &&
          reservation_id_user != null &&
          user_id === reservation_id_user && (
            <button
              type="button"
              className="CardEvents-Edit"
              onClick={() => onEditReservation?.(event_id)}
            >
              <PencilLine size={16} />
            </button>
          )}
        {onTableau && (
          <button
            type="button"
            className="CardEvents-Deleted"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 size={16} />
          </button>
        )}
        {isDeleteModalOpen && (
          <div className="delete-modal-overlay">
            <div className="delete-modal">
              <h3>Supprimer la réservation</h3>

              <p>Êtes-vous sûr de vouloir supprimer cette réservation ?</p>

              <div className="delete-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Annuler
                </button>

                <button type="button" onClick={handleDeleteReservation}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </article>
      <ModalEditEvent
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={{
          event_uuid,
          event_id,
          event_id_host,
          event_name: currentTitle,
          event_date_start: currentDateStart,
          event_date_end: currentDateEnd,
          event_description: currentDescription,
          event_location: currentLocation,
          event_picture: currentImage,
          event_link_key: "",
        }}
        onEventUpdated={handleEventUpdated}
      />
    </>
  );
}

export default CardEvents;
