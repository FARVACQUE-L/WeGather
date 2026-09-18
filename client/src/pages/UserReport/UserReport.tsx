import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import Swal from "sweetalert2";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import ReportDetails from "../../components/ReportUser/ReportDetails";
import ReportEvidence from "../../components/ReportUser/ReportEvidence";
import ReportType from "../../components/ReportUser/ReportType";
import ReportUserModal from "../../components/ReportUser/ReportUserModal";
import type { EventUserJoin } from "../../types/eventUserJoining";

import "./UserReport.css";

const API_URL = import.meta.env.VITE_API_URL;

function UserReport() {
  const navigate = useNavigate();
  const { eventUuid } = useParams();

  const [repType, setRepType] = useState<string>("");
  const [repDetail, setRepDetail] = useState<string>("");
  const [repEvidence, setRepEvidence] = useState<File[]>([]);
  const [_euj, setEuj] = useState<EventUserJoin[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reportedUserId, setReportedUserId] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Utilisateur non connecté");
        }
        return res.json();
      })
      .then((data) => {
        setCurrentUserId(data.id);
      })
      .catch((error) => {
        console.error(error);
        setCurrentUserId(null);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/events/${eventUuid}/users`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data: EventUserJoin[]) => {
        setEuj(data);
      })
      .catch((error) => console.error(error));
  }, [eventUuid]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!repType || !repDetail || repEvidence.length === 0) {
      toast.fire({
        icon: "error",
        text: "Veuillez remplir les champs pour envoyer votre demande.",
        customClass: {
          popup: "toast-error-popup",
        },
      });
      return;
    }
    if (!currentUserId) {
      toast.fire({
        icon: "error",
        text: "Utilisateur non connecté.",
        customClass: {
          popup: "toast-error-popup",
        },
      });
      return;
    }

    try {
      let response: Response;
      switch (repType) {
        case "utilisateur": {
          if (!reportedUserId) {
            toast.fire({
              icon: "error",
              text: "Veuillez sélectionner l'utilisateur à signaler.",
              customClass: {
                popup: "toast-error-popup",
              },
            });
            return;
          }
          const formData = new FormData();
          formData.append("event_uuid", eventUuid ?? "");
          formData.append("reported_user_description", repDetail);
          formData.append("reported_user_id_user", reportedUserId.toString());
          for (const file of repEvidence) {
            formData.append("reported_user_image", file);
          }
          response = await fetch(`${API_URL}/api/userreport-user`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });
          break;
        }
        case "evenement": {
          const formData = new FormData();
          formData.append("event_uuid", eventUuid ?? "");
          formData.append("reported_event_description", repDetail);
          for (const file of repEvidence) {
            formData.append("reported_event_image", file);
          }
          response = await fetch(`${API_URL}/api/userreport-event`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });
          break;
        }
        case "bug": {
          const formData = new FormData();
          formData.append("reported_bug_description", repDetail);
          for (const file of repEvidence) {
            formData.append("reported_bug_image", file);
          }
          response = await fetch(`${API_URL}/api/userreport-bug`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });
          break;
        }
        default:
          return;
      }

      if (!response.ok) {
        if (response.status === 400 || response.status === 409) {
          const data = await response.json().catch(() => null);

          if (data?.message) {
            toast.fire({
              icon: "warning",
              text: data.message,
              customClass: {
                popup: "toast-error-popup",
              },
            });
            return;
          }
        }
        throw new Error(`Erreur serveur : ${response.status}`);
      }

      toast.fire({
        icon: "success",
        text: "Votre signalement a bien été pris en compte, merci pour votre retour !\nL'équipe Wedoo.",
        customClass: {
          popup: "toast-success-popup",
        },
      });
      navigate(`/tableaudebord/${eventUuid}`);
    } catch (error) {
      console.error(error);
      toast.fire({
        icon: "error",
        text: "Une erreur est survenue, votre signalement n'a pas pu être envoyé.",
        customClass: {
          popup: "toast-error-popup",
        },
      });
    }
  };

  const handleCancel = () => {
    navigate(`/tableaudebord/${eventUuid}`);
  };

  return (
    <>
      <header className="userReport-HeaderNav">
        <NavBar />
        <Profil />
      </header>
      <main className="userReport-Main">
        <div className="userReport-Header">
          <button
            type="button"
            className="userReport-Back"
            onClick={handleGoBack}
            aria-label="Retour à la page précédente"
          >
            <ArrowLeft size={64} />
          </button>
          <div className="userReport-HeaderText">
            <h1>Signaler un problème</h1>
            <p>
              Votre confort est notre priorité. <br /> Aidez-nous à maintenir
              l'excellence de Wedoo en nous faisant part de vos observations.
            </p>
          </div>
        </div>
        <form className="userReport-Form" onSubmit={handleSubmit}>
          <ReportType
            reportType={repType}
            setReportType={setRepType}
            setIsModalOpen={setIsModalOpen}
          />
          <ReportDetails
            reportDetail={repDetail}
            setReportDetail={setRepDetail}
          />
          <ReportEvidence
            reportEvidence={repEvidence}
            setReportEvidence={setRepEvidence}
          />
          <div className="userReport-Btn">
            <button type="submit">Signaler</button>
            <button type="button" onClick={handleCancel}>
              Annuler
            </button>
          </div>
        </form>
        <footer className="userReport-Footer">
          <p>
            En soumettant ce formulaire, vous acceptez nos{" "}
            <Link to="/cgv">conditions d'utilisation</Link> et notre politique
            de confidentialité.
          </p>
        </footer>
      </main>
      {isModalOpen && (
        <ReportUserModal
          euj={_euj}
          setIsModalOpen={setIsModalOpen}
          setReportedUserId={setReportedUserId}
        />
      )}
    </>
  );
}

export default UserReport;
