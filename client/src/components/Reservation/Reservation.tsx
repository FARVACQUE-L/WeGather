import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import CardEvents from "../AddEvents/CardEvents";
import "./Reservation.css";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus } from "lucide-react";
import Swal from "sweetalert2";
import useCanHover from "../../helper/useCanHover";

type Reservation = {
  reservation_id: number;
  reservation_id_event: number;
  reservation_id_user: number | null;
  reservation_name: string;
  reservation_date: string;
  reservation_location: string;
  reservation_description: string;
  reservation_link: string | null;
  reservation_picture: string;
  event_name: string;
  event_date_start: string;
  event_date_end: string;
};

const STARTS_WITH_URL = /^https?:\/\//i;

// La capitalisation s'applique à chaque frappe : au moment où l'on tape « h »,
// le champ contient déjà « H ». Dès que le schéma est reconnaissable, on le
// remet donc en minuscules au lieu de simplement s'abstenir.
const capitalize = (str = "") => {
  if (STARTS_WITH_URL.test(str)) {
    return str.replace(/^https?/i, (scheme) => scheme.toLowerCase());
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
};

function Reservation() {
  const canHover = useCanHover();
  const { eventUuid } = useParams();
  const [userId, setUserId] = useState<number | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservationName, setReservationName] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [reservationLocation, setReservationLocation] = useState("");
  const [reservationDescription, setReservationDescription] = useState("");
  const [reservationLink, setReservationLink] = useState("");
  const [reservationPicture, setReservationPicture] = useState<File | null>(
    null,
  );
  const [userInEvent, setUserInEvent] = useState<boolean | null>(null);
  const [preview, setPreview] = useState("");
  const [eventName, setEventName] = useState<Reservation>();
  const [editingReservationId, setEditingReservationId] = useState<
    number | null
  >(null);
  const [authLoading, setAuthLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Non authentifié");
        }
        const user = await res.json();
        setUserId(user.id);
      })
      .catch((err) => {
        console.error(err);
        setUserId(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const fetchReservations = useCallback(async () => {
    if (!eventUuid) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/reservations/all/${eventUuid}`,
      {
        credentials: "include",
      },
    );
    const data = await res.json();
    setReservations(data);
  }, [eventUuid]);

  useEffect(() => {
    if (!eventUuid || !userId) return;

    fetchReservations();

    const fetchTest = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user-in-event/${eventUuid}/${userId}`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();
      setUserInEvent(data.joined);
    };

    fetchTest();
  }, [eventUuid, userId, fetchReservations]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/events/name/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setEventName(data);
      });
  }, [eventUuid]);

  const toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,

    customClass: {
      popup: "toast",
    },
  });

  function openEditModal(reservationId: number) {
    const resa = reservations.find((r) => r.reservation_id === reservationId);
    if (!resa) return;

    setReservationName(capitalize(resa.reservation_name));
    setReservationDate(resa.reservation_date.split("T")[0]);
    setReservationLocation(capitalize(resa.reservation_location));
    setReservationDescription(capitalize(resa.reservation_description));
    setReservationLink(resa.reservation_link ?? "");
    setReservationPicture(null);
    setPreview(`${import.meta.env.VITE_API_URL}${resa.reservation_picture}`);
    setEditingReservationId(reservationId);
    setIsModalOpen(true);
  }

  async function handleSubmitReservation(e: React.FormEvent) {
    e.preventDefault();

    if (!eventUuid) return;

    const isEditing = editingReservationId !== null;

    const missingFields = [
      !reservationName && "le titre",
      !reservationDate && "la date",
      !reservationLocation && "la localisation",
      !reservationDescription && "une description",
      !isEditing && !reservationPicture && "une image",
    ].filter(Boolean);

    if (missingFields.length > 0) {
      toast.fire({
        icon: "error",
        text: `Il vous manque : ${missingFields.join(", ")}`,
        customClass: {
          popup: "toast-error-popup",
        },
      });
      return;
    }

    if (
      eventName &&
      (reservationDate < eventName.event_date_start ||
        reservationDate > eventName.event_date_end)
    ) {
      toast.fire({
        icon: "error",
        text: "La date doit être comprise dans les dates de l'événement",
        customClass: { popup: "toast-error-popup" },
      });
      return;
    }

    const formData = new FormData();
    formData.append("event_uuid", eventUuid ?? "");
    formData.append("reservation_id_user", String(userId));
    formData.append("reservation_name", reservationName);
    formData.append("reservation_date", reservationDate);
    formData.append("reservation_location", reservationLocation);
    formData.append("reservation_description", reservationDescription);
    formData.append("reservation_link", reservationLink.trim());
    if (reservationPicture) {
      formData.append("reservation_picture", reservationPicture);
    }

    const url = isEditing
      ? `${import.meta.env.VITE_API_URL}/api/reservations/update/${editingReservationId}`
      : `${import.meta.env.VITE_API_URL}/api/reservations`;
    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      body: formData,
      credentials: "include",
    });
    await fetchReservations();
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.fire({
        icon: "error",
        text: `Marche pas : ${data?.error ?? data?.message ?? response.statusText ?? "erreur inconnue"}`,
        customClass: {
          popup: "toast-error-popup",
        },
      });
      return;
    }

    setReservationName("");
    setReservationDate("");
    setReservationLocation("");
    setReservationDescription("");
    setReservationLink("");
    setReservationPicture(null);
    setPreview("");
    setEditingReservationId(null);
    setIsModalOpen(false);

    toast.fire({
      icon: "success",
      text: isEditing ? "Réservation modifiée" : "Réservation ajoutée",
      customClass: {
        popup: "toast-error-popup",
      },
    });
  }
  function handleReservationPictureChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];

    if (file) {
      setReservationPicture(file);
      setPreview(URL.createObjectURL(file));
    }
  }
  if (authLoading) {
    return <p>Chargement utilisateur...</p>;
  }

  if (userId === null) {
    return <p>Vous devez être connecté.</p>;
  }

  if (userInEvent === null) {
    return <p>Chargement...</p>;
  }
  if (userInEvent === false) {
    return <p>Vous n'êtes pas inscrit à cet événement.</p>;
  }
  return (
    <motion.div
      className="reservation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="reservation-title">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {eventName?.event_name}
        </motion.h1>

        <motion.button
          type="button"
          className="reservation-button"
          onClick={() => {
            setEditingReservationId(null);
            setReservationName("");
            setReservationDate("");
            setReservationLocation("");
            setReservationDescription("");
            setReservationLink("");
            setReservationPicture(null);
            setPreview("");
            setIsModalOpen(true);
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={canHover ? { scale: 1.05 } : undefined}
          whileTap={{ scale: 0.95 }}
        >
          <CalendarPlus size={20} />
          <p>Ajouter une réservation</p>
        </motion.button>

        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              className="ReservationModal-Overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmitReservation(e);
                }
              }}
            >
              <motion.div
                className="ReservationModal"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="ReservationModal-Title">
                  {editingReservationId
                    ? "Modifier la réservation"
                    : "Nouvelle réservation"}
                </h2>

                {/* Titres, champs et boutons calqués sur la modale de
                    modification d'événement. Classes préfixées : les règles
                    globales .modal de GalleryModal.css s'appliquaient ici. */}
                <div className="ReservationModal-Field">
                  <label
                    className="ReservationModal-Label"
                    htmlFor="reservation-name"
                  >
                    Nom de la réservation
                  </label>
                  <input
                    id="reservation-name"
                    className="ReservationModal-Input"
                    type="text"
                    placeholder="Ex : Hôtel du Parc"
                    value={reservationName}
                    onChange={(e) =>
                      setReservationName(capitalize(e.target.value))
                    }
                  />
                </div>

                <div className="ReservationModal-Field">
                  <label
                    className="ReservationModal-Label"
                    htmlFor="reservation-date"
                  >
                    Date
                  </label>
                  <input
                    id="reservation-date"
                    className="ReservationModal-Input"
                    type="date"
                    value={reservationDate}
                    min={eventName?.event_date_start}
                    max={eventName?.event_date_end}
                    onChange={(e) => setReservationDate(e.target.value)}
                  />
                </div>

                <div className="ReservationModal-Field">
                  <label
                    className="ReservationModal-Label"
                    htmlFor="reservation-location"
                  >
                    Lieu
                  </label>
                  <input
                    id="reservation-location"
                    className="ReservationModal-Input"
                    type="text"
                    placeholder="Ex : Paris"
                    value={reservationLocation}
                    onChange={(e) =>
                      setReservationLocation(capitalize(e.target.value))
                    }
                  />
                </div>

                <div className="ReservationModal-Field">
                  <label
                    className="ReservationModal-Label"
                    htmlFor="reservation-description"
                  >
                    Description
                  </label>
                  <textarea
                    id="reservation-description"
                    className="ReservationModal-TextArea"
                    rows={3}
                    placeholder="Décrivez votre réservation..."
                    value={reservationDescription}
                    onChange={(e) =>
                      setReservationDescription(capitalize(e.target.value))
                    }
                    maxLength={255}
                  />
                  {/* 255 : taille de la colonne reservation_description. */}
                  <span className="ReservationModal-Counter">
                    {reservationDescription.length}/255
                  </span>
                </div>

                {/* Facultatif. Alimente le bouton « Voir le site » de la
                    carte ; le serveur n'accepte que http et https. */}
                <div className="ReservationModal-Field">
                  <label
                    className="ReservationModal-Label"
                    htmlFor="reservation-link"
                  >
                    Lien vers la réservation (facultatif)
                  </label>
                  <input
                    id="reservation-link"
                    className="ReservationModal-Input"
                    type="url"
                    placeholder="https://..."
                    value={reservationLink}
                    onChange={(e) => setReservationLink(e.target.value)}
                  />
                </div>

                <div className="ReservationModal-Field">
                  <label
                    className="ReservationModal-Label"
                    htmlFor="photo-upload"
                  >
                    Image
                  </label>
                  <div className="ReservationModal-Image">
                    {preview && (
                      <img
                        src={preview}
                        alt="Aperçu de la réservation"
                        className="ReservationModal-Preview"
                      />
                    )}
                    <button
                      type="button"
                      className="ReservationModal-ImageButton"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {preview ? "Changer l'image" : "Choisir une image"}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleReservationPictureChange}
                    className="ReservationModal-FileInput"
                  />
                </div>

                <div className="ReservationModal-Actions">
                  <button
                    type="button"
                    className="ReservationModal-ButtonCancel"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="ReservationModal-ButtonSubmit"
                    onClick={handleSubmitReservation}
                  >
                    Enregistrer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="reservation-card-global"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {reservations.length === 0 && (
          <div className="reservation-empty">
            <div className="reservation-empty-text">
              <p className="reservation-empty-title">
                Aucune réservation pour cet événement.
              </p>
              <p className="reservation-empty-subtitle">
                Ajoutez votre première réservation.
              </p>
            </div>

            <svg
              className="reservation-empty-arrow"
              viewBox="0 0 600 500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                className="reservation-empty-path"
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
                className="reservation-empty-head"
                d="M470 120 L500 85 L525 130"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        {reservations.map((event) => (
          <div
            className="card-reservation"
            key={`${event.reservation_id}-${event.reservation_name}-${event.reservation_date}-${event.reservation_location}-${event.reservation_description}-${event.reservation_picture}`}
          >
            <CardEvents
              user_id={userId}
              event_id={event.reservation_id}
              event_uuid={eventUuid ?? ""}
              event_id_host={null}
              reservation_id_user={event.reservation_id_user}
              onEditReservation={openEditModal}
              onReservationDeleted={(deletedId) => {
                setReservations((prev) =>
                  prev.filter((r) => r.reservation_id !== deletedId),
                );
                toast.fire({
                  icon: "success",
                  text: "Réservation supprimée",
                  customClass: {
                    popup: "toast-error-popup",
                  },
                });
              }}
              image={`${import.meta.env.VITE_API_URL}${event.reservation_picture}`}
              imageAlt={event.reservation_name}
              dateStart={event.reservation_date}
              dateEnd={event.reservation_date}
              title={event.reservation_name}
              description={event.reservation_description}
              location={event.reservation_location}
              siteUrl={event.reservation_link}
            />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
export default Reservation;
