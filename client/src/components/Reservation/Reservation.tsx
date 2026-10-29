import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import "./Reservation.css";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, ChevronDown, Paperclip, X } from "lucide-react";
import Swal from "sweetalert2";
import useCanHover from "../../helper/useCanHover";
import { useCompactLevel } from "../../helper/useCompactLevel";
import ImageCropper, {
  type Crop,
  cropImage,
  DEFAULT_CROP,
} from "../ImageCropper/ImageCropper";
import ReservationCard from "./ReservationCard";
import {
  ACCEPTED_DOCUMENTS,
  formatCountdown,
  formatDayHeader,
  formatSchedule,
  groupByDay,
  isPastReservation,
  MAX_DOCUMENTS_PER_RESERVATION,
  RESERVATION_TYPE_INFO,
  RESERVATION_TYPES,
  type ReservationDocument,
  type ReservationType,
  readTypeInfo,
  shortTime,
  type WalletReservation,
} from "./reservationWallet";

type EventInfo = {
  event_name: string;
  event_date_start: string;
  event_date_end: string;
};

// Suppression en attente de confirmation dans la modale.
type PendingDelete =
  | { kind: "reservation"; id: number; name: string }
  | { kind: "document"; id: number; name: string };

// 8 Mo, comme la limite de multer (upload.ts) : on prévient avant l'envoi.
const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;

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
  // L'hôte peut modifier et supprimer toutes les réservations de l'événement.
  const [hostId, setHostId] = useState<number | null>(null);
  const [reservations, setReservations] = useState<WalletReservation[]>([]);
  // Limite de réservations selon la formule de l'organisateur, donnée par le
  // serveur. null quand elle n'est pas encore connue ou que la formule n'en
  // a pas : seul le serveur bloque alors l'ajout.
  const [reservationLimit, setReservationLimit] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservationName, setReservationName] = useState("");
  const [reservationType, setReservationType] =
    useState<ReservationType>("autre");
  const [reservationDateStart, setReservationDateStart] = useState("");
  const [reservationTimeStart, setReservationTimeStart] = useState("");
  const [reservationDateEnd, setReservationDateEnd] = useState("");
  const [reservationTimeEnd, setReservationTimeEnd] = useState("");
  const [reservationLocation, setReservationLocation] = useState("");
  const [reservationDescription, setReservationDescription] = useState("");
  const [reservationLink, setReservationLink] = useState("");
  const [reservationPicture, setReservationPicture] = useState<File | null>(
    null,
  );
  // Documents choisis dans la modale, envoyés une fois la réservation
  // enregistrée (il faut son id).
  const [pendingDocuments, setPendingDocuments] = useState<File[]>([]);
  const [userInEvent, setUserInEvent] = useState<boolean | null>(null);
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP);
  const [eventInfo, setEventInfo] = useState<EventInfo>();
  const [editingReservationId, setEditingReservationId] = useState<
    number | null
  >(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeType, setActiveType] = useState<ReservationType | "all">("all");
  const [showPast, setShowPast] = useState(false);
  // Réservation dont un document est en cours d'envoi depuis sa carte.
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentsInputRef = useRef<HTMLInputElement>(null);
  // Comme dans la galerie, le bouton d'ajout passe en icône quand il touche
  // le titre. L'en-tête n'est rendu qu'une fois l'inscription vérifiée :
  // userInEvent relance la mesure à ce moment-là.
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const addReservationRef = useRef<HTMLButtonElement>(null);
  const compactLevel = useCompactLevel(
    headerRef,
    titleRef,
    [addReservationRef],
    [userInEvent, eventInfo?.event_name],
  );

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
    // 403 pour un non-inscrit : le serveur renvoie un message, pas une liste.
    setReservations(Array.isArray(data) ? data : []);
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
        setEventInfo(data);
      });
  }, [eventUuid]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${API_URL}/api/event/host/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHostId(data?.event_id_host ?? null))
      .catch(console.error);
  }, [eventUuid]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${API_URL}/api/reservations/${eventUuid}/limit`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setReservationLimit(data?.limit ?? null))
      .catch(console.error);
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

  const toastError = (text: string) =>
    toast.fire({
      icon: "error",
      text,
      customClass: { popup: "toast-error-popup" },
    });

  const toastSuccess = (text: string) =>
    toast.fire({
      icon: "success",
      text,
      customClass: { popup: "toast-error-popup" },
    });

  const canManage = (reservation: WalletReservation) =>
    reservation.reservation_id_user === userId || hostId === userId;

  const canDeleteDocument = (document: ReservationDocument) =>
    document.document_id_user === userId || hostId === userId;

  function resetForm() {
    setEditingReservationId(null);
    setReservationName("");
    setReservationType("autre");
    setReservationDateStart("");
    setReservationTimeStart("");
    setReservationDateEnd("");
    setReservationTimeEnd("");
    setReservationLocation("");
    setReservationDescription("");
    setReservationLink("");
    setReservationPicture(null);
    setPendingDocuments([]);
    setPreview("");
  }

  function openEditModal(reservation: WalletReservation) {
    setReservationName(capitalize(reservation.reservation_name));
    setReservationType(reservation.reservation_type ?? "autre");
    setReservationDateStart(reservation.reservation_date_start.slice(0, 10));
    setReservationTimeStart(
      shortTime(reservation.reservation_time_start) ?? "",
    );
    setReservationDateEnd(reservation.reservation_date_end?.slice(0, 10) ?? "");
    setReservationTimeEnd(shortTime(reservation.reservation_time_end) ?? "");
    setReservationLocation(capitalize(reservation.reservation_location));
    setReservationDescription(capitalize(reservation.reservation_description));
    setReservationLink(reservation.reservation_link ?? "");
    setReservationPicture(null);
    setPendingDocuments([]);
    setPreview(
      `${import.meta.env.VITE_API_URL}${reservation.reservation_picture}`,
    );
    setEditingReservationId(reservation.reservation_id);
    setIsModalOpen(true);
  }

  // Renvoie le message d'erreur du serveur, ou null si l'envoi a réussi.
  async function uploadDocument(reservationId: number, file: File) {
    if (file.size > MAX_DOCUMENT_SIZE) {
      return `${file.name} dépasse 8 Mo.`;
    }

    const formData = new FormData();
    formData.append("document", file);

    const response = await fetch(
      `${API_URL}/api/reservations/${reservationId}/documents`,
      { method: "POST", body: formData, credentials: "include" },
    );

    if (response.ok) return null;

    const data = await response.json().catch(() => null);
    return data?.message ?? data?.error ?? `Impossible d'envoyer ${file.name}.`;
  }

  async function handleAddDocument(reservationId: number, file: File) {
    setUploadingId(reservationId);
    const error = await uploadDocument(reservationId, file);
    setUploadingId(null);

    if (error) {
      toastError(error);
      return;
    }

    await fetchReservations();
    toastSuccess("Document ajouté");
  }

  // L'API est sur une autre origine en dev, où l'attribut download d'un lien
  // vers elle est ignoré : on passe par un blob, comme dans la galerie.
  async function handleDownloadDocument(document: ReservationDocument) {
    try {
      const response = await fetch(
        `${API_URL}/api/reservations/documents/${document.document_id}/download`,
        { credentials: "include", cache: "no-store" },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blobUrl = URL.createObjectURL(await response.blob());
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = document.document_name;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);
      toastError("Impossible de télécharger le document.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    const url =
      pendingDelete.kind === "reservation"
        ? `${API_URL}/api/reservations/delete/${pendingDelete.id}`
        : `${API_URL}/api/reservations/documents/${pendingDelete.id}`;

    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });
    const deleted = pendingDelete;
    setPendingDelete(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toastError(data?.message ?? "La suppression a échoué.");
      return;
    }

    if (deleted.kind === "reservation") {
      setReservations((prev) =>
        prev.filter((r) => r.reservation_id !== deleted.id),
      );
      toastSuccess("Réservation supprimée");
    } else {
      setReservations((prev) =>
        prev.map((r) => ({
          ...r,
          documents: r.documents.filter((d) => d.document_id !== deleted.id),
        })),
      );
      toastSuccess("Document supprimé");
    }
  }

  // Mêmes règles que le serveur (validateReservationFields) : on prévient
  // avant l'envoi. Renvoie le message d'erreur, ou null.
  function validateForm(isEditing: boolean) {
    const missingFields = [
      !reservationName && "le titre",
      !reservationDateStart && "la date",
      !reservationLocation && "la localisation",
      !reservationDescription && "une description",
      !isEditing && !reservationPicture && "une image",
    ].filter(Boolean);

    if (missingFields.length > 0) {
      return `Il vous manque : ${missingFields.join(", ")}`;
    }

    const isInEvent = (day: string) =>
      !eventInfo ||
      (day >= eventInfo.event_date_start && day <= eventInfo.event_date_end);

    if (
      !isInEvent(reservationDateStart) ||
      (reservationDateEnd && !isInEvent(reservationDateEnd))
    ) {
      return "Les dates doivent être comprises dans les dates de l'événement";
    }

    const endDay = reservationDateEnd || reservationDateStart;
    if (
      endDay < reservationDateStart ||
      (endDay === reservationDateStart &&
        reservationTimeStart &&
        reservationTimeEnd &&
        reservationTimeEnd <= reservationTimeStart)
    ) {
      return "La fin doit être après le début.";
    }

    const existingDocuments = isEditing
      ? (reservations.find((r) => r.reservation_id === editingReservationId)
          ?.documents.length ?? 0)
      : 0;
    if (
      existingDocuments + pendingDocuments.length >
      MAX_DOCUMENTS_PER_RESERVATION
    ) {
      return `Une réservation est limitée à ${MAX_DOCUMENTS_PER_RESERVATION} documents.`;
    }

    return null;
  }

  async function handleSubmitReservation(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!eventUuid || isSaving) return;

    const isEditing = editingReservationId !== null;
    const error = validateForm(isEditing);

    if (error) {
      toastError(error);
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("event_uuid", eventUuid ?? "");
    formData.append("reservation_name", reservationName);
    formData.append("reservation_type", reservationType);
    formData.append("reservation_date_start", reservationDateStart);
    formData.append("reservation_time_start", reservationTimeStart);
    formData.append("reservation_date_end", reservationDateEnd);
    formData.append("reservation_time_end", reservationTimeEnd);
    formData.append("reservation_location", reservationLocation);
    formData.append("reservation_description", reservationDescription);
    formData.append("reservation_link", reservationLink.trim());
    if (reservationPicture) {
      formData.append(
        "reservation_picture",
        await cropImage(preview, crop, reservationPicture.name),
      );
    }

    const url = isEditing
      ? `${import.meta.env.VITE_API_URL}/api/reservations/update/${editingReservationId}`
      : `${import.meta.env.VITE_API_URL}/api/reservations`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        await fetchReservations();
        toastError(
          data?.error ??
            data?.message ??
            "Une erreur est survenue, veuillez réessayer.",
        );
        return;
      }

      // À la création, le serveur renvoie le résultat de l'INSERT.
      const reservationId = isEditing ? editingReservationId : data?.insertId;
      const failedUploads: string[] = [];

      if (reservationId) {
        for (const file of pendingDocuments) {
          const uploadError = await uploadDocument(reservationId, file);
          if (uploadError) failedUploads.push(uploadError);
        }
      }

      await fetchReservations();
      resetForm();
      setIsModalOpen(false);

      if (failedUploads.length > 0) {
        toastError(
          `Réservation enregistrée, mais ${failedUploads.length} document(s) n'ont pas pu être envoyés : ${failedUploads[0]}`,
        );
        return;
      }

      toastSuccess(isEditing ? "Réservation modifiée" : "Réservation ajoutée");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReservationPictureChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];

    if (file) {
      setReservationPicture(file);
      setPreview(URL.createObjectURL(file));
      setCrop(DEFAULT_CROP);
    }
  }

  function handlePendingDocumentsChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(e.target.files ?? []);
    // Un même fichier choisi deux fois n'est gardé qu'une fois.
    setPendingDocuments((prev) => [
      ...prev,
      ...files.filter(
        (file) =>
          !prev.some(
            (pending) =>
              pending.name === file.name &&
              pending.size === file.size &&
              pending.lastModified === file.lastModified,
          ),
      ),
    ]);
    e.target.value = "";
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

  const filteredReservations =
    activeType === "all"
      ? reservations
      : reservations.filter((r) => r.reservation_type === activeType);
  const upcomingReservations = filteredReservations.filter(
    (r) => !isPastReservation(r),
  );
  const pastReservations = filteredReservations.filter((r) =>
    isPastReservation(r),
  );
  // Mise en avant indépendante du filtre : c'est toujours la prochaine étape
  // du séjour.
  const nextReservation = reservations.find((r) => !isPastReservation(r));
  // Filtres limités aux types présents dans l'événement.
  const presentTypes = RESERVATION_TYPES.filter((type) =>
    reservations.some((r) => r.reservation_type === type),
  );
  const editingDocumentsCount =
    reservations.find((r) => r.reservation_id === editingReservationId)
      ?.documents.length ?? 0;

  const renderDays = (items: WalletReservation[], isPast: boolean) =>
    groupByDay(items).map(({ day, items: dayItems }) => (
      <section key={day} className="Wallet-Day">
        <h2 className="Wallet-DayTitle">{formatDayHeader(day)}</h2>
        <div className="Wallet-DayItems">
          {dayItems.map((reservation) => (
            <div
              key={reservation.reservation_id}
              id={`reservation-${reservation.reservation_id}`}
            >
              <ReservationCard
                reservation={reservation}
                isPast={isPast}
                canManage={canManage(reservation)}
                canDeleteDocument={canDeleteDocument}
                isUploading={uploadingId === reservation.reservation_id}
                onEdit={() => openEditModal(reservation)}
                onDelete={() =>
                  setPendingDelete({
                    kind: "reservation",
                    id: reservation.reservation_id,
                    name: reservation.reservation_name,
                  })
                }
                onAddDocument={(file) =>
                  handleAddDocument(reservation.reservation_id, file)
                }
                onDownloadDocument={handleDownloadDocument}
                onDeleteDocument={(document) =>
                  setPendingDelete({
                    kind: "document",
                    id: document.document_id,
                    name: document.document_name,
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
    ));

  return (
    <motion.div
      className="reservation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div
        ref={headerRef}
        className={
          compactLevel >= 1
            ? "reservation-title is-compact"
            : "reservation-title"
        }
      >
        <motion.h1
          ref={titleRef}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {eventInfo?.event_name}
        </motion.h1>

        <motion.button
          ref={addReservationRef}
          type="button"
          className="reservation-button"
          aria-label="Ajouter une réservation"
          onClick={() => {
            // Limite atteinte : on le dit tout de suite au lieu d'ouvrir une
            // modale dont l'envoi serait refusé.
            if (
              reservationLimit !== null &&
              reservations.length >= reservationLimit
            ) {
              toastError(
                `Un événement est limité à ${reservationLimit} réservations.`,
              );
              return;
            }
            resetForm();
            setIsModalOpen(true);
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          // Même survol que Créer / Rejoindre un événement.
          whileHover={
            canHover
              ? { scale: 0.95, transition: { duration: 0.2 } }
              : undefined
          }
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
                // Entrée enregistre depuis un champ de saisie. Dans la
                // description elle va à la ligne, et sur un bouton (type,
                // fichiers) elle l'active sans enregistrer.
                if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
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
                    maxLength={255}
                    value={reservationName}
                    onChange={(e) =>
                      setReservationName(capitalize(e.target.value))
                    }
                  />
                </div>

                <fieldset className="ReservationModal-Field ReservationModal-Types">
                  <legend className="ReservationModal-Label">Type</legend>
                  <div className="ReservationModal-TypeList">
                    {RESERVATION_TYPES.map((type) => {
                      const { label, Icon } = RESERVATION_TYPE_INFO[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          className={
                            reservationType === type
                              ? "ReservationModal-Type is-active"
                              : "ReservationModal-Type"
                          }
                          aria-pressed={reservationType === type}
                          onClick={() => setReservationType(type)}
                        >
                          <Icon size={14} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="ReservationModal-Field">
                  <span className="ReservationModal-Label">Début</span>
                  <div className="ReservationModal-Row">
                    <input
                      aria-label="Date de début"
                      className="ReservationModal-Input"
                      type="date"
                      value={reservationDateStart}
                      min={eventInfo?.event_date_start}
                      max={eventInfo?.event_date_end}
                      onChange={(e) => setReservationDateStart(e.target.value)}
                    />
                    <input
                      aria-label="Heure de début (facultatif)"
                      className="ReservationModal-Input"
                      type="time"
                      value={reservationTimeStart}
                      onChange={(e) => setReservationTimeStart(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ReservationModal-Field">
                  <span className="ReservationModal-Label">
                    Fin (facultatif)
                  </span>
                  <div className="ReservationModal-Row">
                    <input
                      aria-label="Date de fin (facultatif)"
                      className="ReservationModal-Input"
                      type="date"
                      value={reservationDateEnd}
                      min={reservationDateStart || eventInfo?.event_date_start}
                      max={eventInfo?.event_date_end}
                      onChange={(e) => setReservationDateEnd(e.target.value)}
                    />
                    <input
                      aria-label="Heure de fin (facultatif)"
                      className="ReservationModal-Input"
                      type="time"
                      value={reservationTimeEnd}
                      onChange={(e) => setReservationTimeEnd(e.target.value)}
                    />
                  </div>
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
                    maxLength={255}
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
                    maxLength={255}
                    value={reservationLink}
                    onChange={(e) => setReservationLink(e.target.value)}
                  />
                </div>

                <div className="ReservationModal-Field">
                  <span className="ReservationModal-Label">
                    Billets et confirmations (facultatif)
                  </span>
                  {editingDocumentsCount > 0 && (
                    <span className="ReservationModal-Hint">
                      {editingDocumentsCount} document(s) déjà joint(s), à gérer
                      depuis la carte.
                    </span>
                  )}
                  {pendingDocuments.length > 0 && (
                    <ul className="ReservationModal-Documents">
                      {pendingDocuments.map((file) => (
                        <li
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                        >
                          <span>{file.name}</span>
                          <button
                            type="button"
                            aria-label={`Retirer ${file.name}`}
                            onClick={() =>
                              setPendingDocuments((prev) =>
                                prev.filter((pending) => pending !== file),
                              )
                            }
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="ReservationModal-DocumentsButton"
                    onClick={() => documentsInputRef.current?.click()}
                  >
                    <Paperclip size={14} />
                    Ajouter des fichiers (PDF ou image)
                  </button>
                  <input
                    ref={documentsInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_DOCUMENTS}
                    onChange={handlePendingDocumentsChange}
                    className="ReservationModal-FileInput"
                  />
                </div>

                <div className="ReservationModal-Field ReservationModal-ImageField">
                  <label
                    className="ReservationModal-Label"
                    htmlFor="photo-upload"
                  >
                    Image
                  </label>
                  <div className="ReservationModal-Image">
                    {/* Recadrage seulement pour une nouvelle image : l'image
                        actuelle d'une réservation modifiée est déjà
                        enregistrée telle quelle. */}
                    {reservationPicture ? (
                      <ImageCropper
                        src={preview}
                        crop={crop}
                        onCropChange={setCrop}
                      />
                    ) : (
                      preview && (
                        <img
                          src={preview}
                          alt="Aperçu de la réservation"
                          className="ReservationModal-Preview"
                        />
                      )
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
                    disabled={isSaving}
                    onClick={handleSubmitReservation}
                  >
                    {isSaving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="Wallet"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {reservations.length === 0 ? (
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
        ) : (
          <>
            {nextReservation && (
              <button
                type="button"
                className="Wallet-Next"
                onClick={() =>
                  window.document
                    .getElementById(
                      `reservation-${nextReservation.reservation_id}`,
                    )
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              >
                <span className="Wallet-NextIcon">
                  {(() => {
                    const { Icon } = readTypeInfo(
                      nextReservation.reservation_type,
                    );
                    return <Icon size={24} />;
                  })()}
                </span>
                <span className="Wallet-NextContent">
                  <span className="Wallet-NextLabel">
                    Prochaine réservation ·{" "}
                    {formatCountdown(nextReservation.reservation_date_start)}
                  </span>
                  <span className="Wallet-NextName">
                    {nextReservation.reservation_name}
                  </span>
                  <span className="Wallet-NextDetails">
                    {formatDayHeader(nextReservation.reservation_date_start)}
                    {formatSchedule(nextReservation) &&
                      ` · ${formatSchedule(nextReservation)}`}
                    {` · ${nextReservation.reservation_location}`}
                  </span>
                </span>
              </button>
            )}

            {presentTypes.length > 1 && (
              <div className="Wallet-Filters" role="toolbar">
                <button
                  type="button"
                  className={
                    activeType === "all"
                      ? "Wallet-Filter is-active"
                      : "Wallet-Filter"
                  }
                  aria-pressed={activeType === "all"}
                  onClick={() => setActiveType("all")}
                >
                  Tout
                </button>
                {presentTypes.map((type) => {
                  const { label, Icon } = RESERVATION_TYPE_INFO[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      className={
                        activeType === type
                          ? "Wallet-Filter is-active"
                          : "Wallet-Filter"
                      }
                      aria-pressed={activeType === type}
                      onClick={() => setActiveType(type)}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {upcomingReservations.length > 0 ? (
              <div className="Wallet-Timeline">
                {renderDays(upcomingReservations, false)}
              </div>
            ) : (
              <p className="Wallet-Empty">
                {activeType === "all"
                  ? "Toutes les réservations sont passées."
                  : "Aucune réservation à venir de ce type."}
              </p>
            )}

            {pastReservations.length > 0 && (
              <section className="Wallet-Past">
                <button
                  type="button"
                  className={
                    showPast ? "Wallet-PastToggle is-open" : "Wallet-PastToggle"
                  }
                  aria-expanded={showPast}
                  onClick={() => setShowPast((prev) => !prev)}
                >
                  Réservations passées ({pastReservations.length})
                  <ChevronDown size={18} />
                </button>
                {showPast && (
                  <div className="Wallet-Timeline">
                    {renderDays(pastReservations, true)}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </motion.div>

      {pendingDelete && (
        <div className="Wallet-ConfirmOverlay">
          <div className="Wallet-Confirm">
            <h3>
              {pendingDelete.kind === "reservation"
                ? "Supprimer la réservation"
                : "Supprimer le document"}
            </h3>
            <p>
              Êtes-vous sûr de vouloir supprimer « {pendingDelete.name} » ?
              {pendingDelete.kind === "reservation" &&
                " Ses documents seront supprimés aussi."}
            </p>
            <div className="Wallet-ConfirmActions">
              <button type="button" onClick={() => setPendingDelete(null)}>
                Annuler
              </button>
              <button type="button" onClick={confirmDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
export default Reservation;
