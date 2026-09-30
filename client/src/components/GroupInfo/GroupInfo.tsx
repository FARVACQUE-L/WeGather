import { motion } from "framer-motion";
import { Crown, Moon, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Swal from "sweetalert2";
import { socket } from "../../socket/socket";
import "./GroupInfo.css";

type PresenceStatus = "online" | "idle" | "offline";

type Member = {
  euj_id_user: number;
  user_username: string;
  user_profile_picture: string | null;
  // Absent pour les bannis : leur présence n'est pas affichée.
  status?: PresenceStatus;
};

const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  online: "En ligne",
  idle: "Inactif",
  offline: "Hors ligne",
};

type Group = {
  host_id: number;
  members: Member[];
  banned: Member[];
};

const API_URL = import.meta.env.VITE_API_URL;

const toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: { popup: "toast-error-popup" },
});

function GroupInfo() {
  const { eventUuid } = useParams();
  const [userId, setUserId] = useState<number | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [memberToBan, setMemberToBan] = useState<Member | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/authVerif`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUserId(data.id))
      .catch(() => setUserId(null));
  }, []);

  const fetchGroup = useCallback(async () => {
    if (!eventUuid) return;

    const res = await fetch(`${API_URL}/api/events/${eventUuid}/group`, {
      credentials: "include",
    });

    if (!res.ok) {
      setLoadError(true);
      return;
    }

    setLoadError(false);
    setGroup(await res.json());
  }, [eventUuid]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Le serveur signale chaque changement de présence (connexion,
  // déconnexion, passage en inactif) : on recharge les statuts des membres.
  useEffect(() => {
    socket.on("presence-changed", fetchGroup);

    return () => {
      socket.off("presence-changed", fetchGroup);
    };
  }, [fetchGroup]);

  const isHost = group !== null && userId === group.host_id;

  async function handleBan() {
    if (!memberToBan) return;

    const res = await fetch(
      `${API_URL}/api/events/${eventUuid}/ban/${memberToBan.euj_id_user}`,
      { method: "POST", credentials: "include" },
    );

    setMemberToBan(null);

    if (!res.ok) {
      toast.fire({ icon: "error", text: "Le bannissement a échoué" });
      return;
    }

    await fetchGroup();
    toast.fire({
      icon: "success",
      text: `${memberToBan.user_username} a été banni`,
    });
  }

  async function handleUnban(member: Member) {
    const res = await fetch(
      `${API_URL}/api/events/${eventUuid}/ban/${member.euj_id_user}`,
      { method: "DELETE", credentials: "include" },
    );

    if (!res.ok) {
      toast.fire({ icon: "error", text: "Le débannissement a échoué" });
      return;
    }

    await fetchGroup();
    toast.fire({
      icon: "success",
      text: `${member.user_username} peut de nouveau rejoindre l'événement`,
    });
  }

  if (loadError) {
    return <p>Impossible de charger les membres du groupe.</p>;
  }

  if (!group) {
    return <p>Chargement...</p>;
  }

  return (
    <motion.div
      className="group-info"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        Info du groupe
      </motion.h1>

      <section className="group-info-section">
        <h2>
          Membres <span>({group.members.length})</span>
        </h2>
        <ul className="group-info-list">
          {group.members.map((member, index) => (
            <motion.li
              key={member.euj_id_user}
              className="group-info-member"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <span className="group-info-avatar">
                <img
                  src={`${API_URL}${member.user_profile_picture}`}
                  alt={member.user_username}
                />
                {member.status && (
                  <span
                    className={`group-info-presence is-${member.status}`}
                    role="img"
                    aria-label={PRESENCE_LABELS[member.status]}
                    title={PRESENCE_LABELS[member.status]}
                  >
                    {member.status === "idle" && <Moon size={8} />}
                  </span>
                )}
              </span>
              <span className="group-info-name">{member.user_username}</span>

              {member.euj_id_user === group.host_id && (
                <span className="group-info-host">
                  <Crown size={14} />
                  Hôte
                </span>
              )}

              {isHost && member.euj_id_user !== group.host_id && (
                <button
                  type="button"
                  className="group-info-ban"
                  onClick={() => setMemberToBan(member)}
                >
                  <UserX size={16} />
                  <span>Bannir</span>
                </button>
              )}
            </motion.li>
          ))}
        </ul>
      </section>

      {isHost && group.banned.length > 0 && (
        <section className="group-info-section">
          <h2>
            Bannis <span>({group.banned.length})</span>
          </h2>
          <ul className="group-info-list">
            {group.banned.map((member) => (
              <li
                key={member.euj_id_user}
                className="group-info-member is-banned"
              >
                <img
                  src={`${API_URL}${member.user_profile_picture}`}
                  alt={member.user_username}
                />
                <span className="group-info-name">{member.user_username}</span>
                <button
                  type="button"
                  className="group-info-unban"
                  onClick={() => handleUnban(member)}
                >
                  <UserCheck size={16} />
                  <span>Débannir</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {memberToBan && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Bannir {memberToBan.user_username}</h3>
            <p>
              Ce membre sera retiré de l'événement et ne pourra plus le
              rejoindre tant que vous ne l'aurez pas débanni.
            </p>
            <div className="delete-modal-actions">
              <button type="button" onClick={() => setMemberToBan(null)}>
                Annuler
              </button>
              <button type="button" onClick={handleBan}>
                Bannir
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default GroupInfo;
