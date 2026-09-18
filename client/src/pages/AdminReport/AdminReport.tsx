import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import ReportAdminModal, {
  type BanAction,
} from "../../components/ReportAdmin/ReportAdminModal";
import type { ReportData } from "../../types/reportData";
import "./AdminReport.css";
import {
  ArrowLeft,
  CalendarSync,
  CircleEllipsis,
  Gavel,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

function AdminReport() {
  const { id, type } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let endpoint = "";
    if (type === "bug") endpoint = `${API_URL}/api/admin/reportBug/${id}`;
    if (type === "event") endpoint = `${API_URL}/api/admin/reportEvent/${id}`;
    if (type === "user") endpoint = `${API_URL}/api/admin/reportUser/${id}`;
    if (!endpoint) return;

    fetch(endpoint, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur serveur : ${res.status}`);
        }
        return res.json();
      })
      .then((data: ReportData) => setReport(data))
      .catch((error) => console.error(error));
  }, [id, type]);

  const capitalize = (str = "") => str.charAt(0).toUpperCase() + str.slice(1);

  const handleBanConfirm = async (action: BanAction) => {
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

    try {
      let response: Response;

      if (action === "user") {
        const targetId =
          type === "user"
            ? report?.reported_user_id_user
            : report?.event_id_host;

        response = await fetch(`${API_URL}/api/admin/ban-user/${targetId}`, {
          method: "PATCH",
          credentials: "include",
        });
      } else {
        if (type === "user") {
          const eventId = report?.reported_user_id_event;
          const userId = report?.reported_user_id_user;

          response = await fetch(
            `${API_URL}/api/admin/event-ban/${eventId}/${userId}`,
            {
              method: "PATCH",
              credentials: "include",
            },
          );
        } else {
          const eventId = report?.reported_event_id_event;

          response = await fetch(`${API_URL}/api/admin/ban-event/${eventId}`, {
            method: "PATCH",
            credentials: "include",
          });
        }
      }

      if (!response.ok) {
        throw new Error(`Erreur serveur : ${response.status}`);
      }

      await fetch(`${API_URL}/api/admin/report${capitalize(type)}/${id}/done`, {
        method: "PATCH",
        credentials: "include",
      });

      setIsModalOpen(false);

      toast.fire({
        icon: "success",
        text:
          action === "user"
            ? "L'utilisateur a bien été banni."
            : type === "user"
              ? "L'utilisateur a bien été retiré de l'événement."
              : "L'événement a bien été banni.",
        customClass: {
          popup: "toast-success-popup",
        },
        didClose: () => navigate(-1),
      });
    } catch (error) {
      console.error(error);
      toast.fire({
        icon: "error",
        text: "Une erreur est survenue, l'action n'a pas pu être effectuée.",
        customClass: {
          popup: "toast-error-popup",
        },
      });
    }
  };

  const handleReject = async () => {
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

    try {
      const response = await fetch(
        `${API_URL}/api/admin/report${capitalize(type)}/${id}/done`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Erreur serveur : ${response.status}`);
      }

      toast.fire({
        icon: "success",
        text: "Le signalement a été rejeté.",
        customClass: {
          popup: "toast-success-popup",
        },
        didClose: () => navigate(-1),
      });
    } catch (error) {
      console.error(error);
      toast.fire({
        icon: "error",
        text: "Une erreur est survenue, l'action n'a pas pu être effectuée.",
        customClass: {
          popup: "toast-error-popup",
        },
      });
    }
  };
  const getDescription = () =>
    report?.reported_bug_description ??
    report?.reported_event_description ??
    report?.reported_user_description ??
    "—";

  const getDate = () => {
    const raw =
      report?.reported_bug_date ??
      report?.reported_event_date ??
      report?.reported_user_date;

    if (!raw) return "—";

    return new Date(raw).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getImages = (): string[] => report?.images ?? [];

  const getInfoReport = () => {
    if (type === "user") return report?.target_username ?? "—";
    if (type === "event")
      return `${report?.event_name ?? "—"} créé par ${report?.host_username ?? "—"}`;
    return "—";
  };

  const getUsername = () =>
    type === "user" ? report?.author_username : report?.user_username;

  const getMail = () =>
    type === "user" ? report?.author_mail : report?.user_mail;

  const getPicture = () =>
    type === "user" ? report?.author_picture : report?.user_profile_picture;

  if (!report) return <p>Chargement...</p>;

  const handleImageClick = (image: string) => {
    Swal.fire({
      imageUrl: `${API_URL}/api/admin/report-image/${image}`,
      imageAlt: "preuve jointe",
      showConfirmButton: false,
      showCloseButton: false,
      width: "auto",
      background: "transparent",
      backdrop: "rgba(0, 0, 0, 0.85)",
      customClass: {
        popup: "lightbox-popup",
        image: "lightbox-image",
      },
    });
  };

  return (
    <div className="adminReport-Layout">
      <header className="adminReport-HeaderNav">
        <NavBar />
        <Profil />
      </header>
      <main>
        <article className="adminReport-Global">
          <div className="adminReport-Leftside">
            <section className="adminReport-Title">
              <div className="adminReport-TitleText">
                <button type="button" onClick={() => navigate(-1)}>
                  <ArrowLeft size={18} /> Retour aux signalements
                </button>
                <h1>Signalement #{id} - Détails</h1>
              </div>
              <p>
                <span role="status" aria-label="Statut">
                  <CircleEllipsis size={10} />{" "}
                  {(report.reported_bug_is_done ??
                  report.reported_event_is_done ??
                  report.reported_user_is_done)
                    ? "traité"
                    : "en cours"}
                </span>
              </p>
            </section>

            <section aria-labelledby="nature" className="adminReport-Type">
              <h2 id="nature">Nature du signalement</h2>
              <div className="adminReport-WrapType">
                <div className="adminReport-WrapType-Icon">
                  <CalendarSync size={24} />
                </div>
                <div className="adminReport-WrapType-TypeText">
                  <h3>{type}</h3>
                  {type !== "bug" && <p>{getInfoReport()}</p>}
                </div>
              </div>
            </section>

            <section
              aria-labelledby="description"
              className="adminReport-Details"
            >
              <h2 id="description">Description</h2>
              <div className="adminReport-WrapDetails">
                <p>{getDescription()}</p>
              </div>
            </section>

            <section aria-labelledby="pieces" className="adminReport-Evidence">
              <h2 id="pieces">Pièces jointes</h2>
              <div className="adminReport-WrapEvidence">
                {getImages().length > 0 ? (
                  <ul>
                    {getImages().map((image) => (
                      <li key={image}>
                        <button
                          type="button"
                          className="adminReport-EvidenceBtn"
                          onClick={() => handleImageClick(image)}
                        >
                          <img
                            src={`${API_URL}/api/admin/report-image/${image}`}
                            alt="preuve jointe"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucune pièce jointe</p>
                )}
              </div>
            </section>

            <section
              aria-labelledby="historique"
              className="adminReport-History"
            >
              <h2 id="historique">Historique</h2>
              <ol>
                <li>
                  <h3>Signalement reçu</h3>
                  <span>{getDate()}</span>
                </li>
              </ol>
            </section>
          </div>

          <aside className="adminReport-Rightside">
            <section aria-labelledby="auteur" className="adminReport-User">
              <h2 id="auteur">Auteur du signalement</h2>
              <div className="adminReport-User-PP-Wrap">
                <img src={`${API_URL}${getPicture()}`} alt="profil pict user" />
              </div>
              <p>{getUsername()}</p>
              <p>{getMail()}</p>
            </section>

            <section aria-labelledby="actions" className="adminReport-Action">
              <h2 id="actions">Actions</h2>
              {type !== "bug" && (
                <button type="button" onClick={() => setIsModalOpen(true)}>
                  <Gavel size={16} />
                  Bannir
                </button>
              )}
              <button type="button" onClick={handleReject}>
                <Trash2 size={16} />
                Rejeter
              </button>
            </section>
          </aside>
        </article>
      </main>
      <ReportAdminModal
        open={isModalOpen}
        type={type}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBanConfirm}
      />
    </div>
  );
}

export default AdminReport;
