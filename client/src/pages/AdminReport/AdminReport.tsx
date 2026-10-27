import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import ReportAdminModal, {
  type BanAction,
} from "../../components/ReportAdmin/ReportAdminModal";
import SideBarAdmin from "../../components/SideBarAdmin/SideBarAdmin";
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
  // L'onglet actif de /admin n'est pas dans l'historique : navigate(-1)
  // ramenait au tableau de bord. On rouvre explicitement les signalements.
  const backToReports = () =>
    navigate("/admin", { state: { tab: "signalement" } });

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

  const isTargetBanned = Boolean(report?.target_is_ban);
  // Signalement d'événement : l'événement est banni. Signalement
  // d'utilisateur : il est exclu de l'événement où il a été signalé.
  const isEventBanned = Boolean(
    type === "event" ? report?.event_is_ban : report?.target_is_event_ban,
  );

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

    // Cible déjà bannie : l'option choisie annule le bannissement.
    const isUnban = action === "user" ? isTargetBanned : isEventBanned;
    const prefix = isUnban ? "unban" : "ban";

    try {
      let response: Response;

      if (action === "user") {
        const targetId =
          type === "user"
            ? report?.reported_user_id_user
            : report?.reported_event_id_host;

        response = await fetch(
          `${API_URL}/api/admin/${prefix}-user/${targetId}`,
          {
            method: "PATCH",
            credentials: "include",
          },
        );
      } else {
        if (type === "user") {
          const eventId = report?.reported_user_id_event;
          const userId = report?.reported_user_id_user;

          response = await fetch(
            `${API_URL}/api/admin/event-${prefix}/${eventId}/${userId}`,
            {
              method: "PATCH",
              credentials: "include",
            },
          );
        } else {
          const eventId = report?.reported_event_id_event;

          response = await fetch(
            `${API_URL}/api/admin/${prefix}-event/${eventId}`,
            {
              method: "PATCH",
              credentials: "include",
            },
          );
        }
      }

      if (!response.ok) {
        // Message du serveur quand il y en a un, par exemple pour un
        // superadmin, qui ne peut pas être banni.
        const data = await response.json().catch(() => null);
        // La modale, ouverte avec showModal, passe au-dessus de tout : le
        // toast restait caché derrière elle.
        setIsModalOpen(false);
        toast.fire({
          icon: "error",
          text:
            data?.message ??
            "Une erreur est survenue, l'action n'a pas pu être effectuée.",
          customClass: {
            popup: "toast-error-popup",
          },
        });
        return;
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
            ? isUnban
              ? "L'utilisateur a bien été débanni."
              : "L'utilisateur a bien été banni."
            : type === "user"
              ? isUnban
                ? "L'utilisateur a bien été rajouté à l'événement."
                : "L'utilisateur a bien été retiré de l'événement."
              : isUnban
                ? "L'événement a bien été débanni."
                : "L'événement a bien été banni.",
        customClass: {
          popup: "toast-success-popup",
        },
        didClose: backToReports,
      });
    } catch (error) {
      console.error(error);
      setIsModalOpen(false);
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
        didClose: backToReports,
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

  // Événement supprimé par son créateur : le signalement reste, sans cible.
  const isEventDeleted =
    type === "event" && report?.reported_event_id_event == null;

  const getInfoReport = () => {
    if (type === "user") return report?.target_username ?? "—";
    if (isEventDeleted)
      return `Événement supprimé, créé par ${report?.host_username ?? "—"}`;
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
      {/* Barre du bas de l'admin, affichée seulement sous 428px
          (AdminReport.css). Un onglet ramène à la page admin sur cet onglet. */}
      <div className="adminReport-SideBar">
        <SideBarAdmin
          activeComponent="signalement"
          handleChangeComponent={(tab) =>
            navigate("/admin", { state: { tab } })
          }
        />
      </div>
      <main>
        <article className="adminReport-Global">
          <div className="adminReport-Leftside">
            <section className="adminReport-Title">
              <div className="adminReport-TitleText">
                <button type="button" onClick={backToReports}>
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
                  Modérer
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
        isEventDeleted={isEventDeleted}
        isTargetSuperAdmin={Boolean(report.target_is_superadmin)}
        isTargetBanned={isTargetBanned}
        isEventBanned={isEventBanned}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBanConfirm}
      />
    </div>
  );
}

export default AdminReport;
