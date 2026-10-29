import "./Dashboard.css";
import { motion } from "framer-motion";
import {
  Book,
  CalendarClock,
  CalendarDays,
  Copy,
  Hand,
  PiggyBank,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useCanHover from "../../helper/useCanHover";
import GalerieDashboard from "../GalerieDashboard/GalerieDashboard";
import TodoList from "../ToDoList/TodoList";

type EventDashboard = {
  event_link_key: string;
  event_name: string;
  event_description: string | null;
  event_date_start: string;
  event_date_end: string;
  total_users: number | null;
  total_reservations: number | null;
};
type ReservationDashboard = {
  event_id: number | null;
  user_id: number;
  user_username: string;
  reservation_location: string;
  reservation_date_start: string;
  reservation_id: number;
};
type UserBudget = {
  user_id: number;
  total_price: number | string;
};

// « 12-15 sept. » dans le même mois, « 28 juin - 14 juil. » à cheval sur deux.
function formatStayDates(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const month = (date: Date) =>
    date.toLocaleDateString("fr-FR", { month: "short" });

  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    if (startDate.getDate() === endDate.getDate()) {
      return `${endDate.getDate()} ${month(endDate)}`;
    }
    return `${startDate.getDate()}-${endDate.getDate()} ${month(endDate)}`;
  }

  return `${startDate.getDate()} ${month(startDate)} - ${endDate.getDate()} ${month(endDate)}`;
}

// Même calcul que les « Equilibres » de l'onglet Budget : ce que j'ai payé
// moins ma part des dépenses. Positif, on me doit ; négatif, je dois.
function getMyBalance(budgets: UserBudget[], userId: number) {
  if (budgets.length === 0) return 0;

  const total = budgets.reduce((sum, row) => sum + Number(row.total_price), 0);
  const mine = budgets.find((row) => row.user_id === userId);
  const balance = Number(mine?.total_price ?? 0) - total / budgets.length;

  return Math.round(balance * 100) / 100;
}

function formatBalance(balance: number) {
  const amount = Math.abs(balance).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (balance > 0) return `+${amount} €`;
  if (balance < 0) return `-${amount} €`;
  return "0 €";
}

// Couleurs des pastilles d'initiales : chaque organisateur garde la sienne,
// choisie à partir de son id pour qu'elle ne change pas avec son pseudo.
const initialsColors = [
  "#0080005c",
  "#fa985f8c",
  "#4a90e266",
  "#a53b2259",
  "#9b59b666",
  "#f1c40f80",
  "#1abc9c66",
  "#e84a8a59",
];

function getInitialsColor(userId: number) {
  return initialsColors[userId % initialsColors.length];
}

type DashboardProps = {
  // Ouvre l'onglet Réservation (bouton « Voir tout »).
  onSeeAllReservations: () => void;
};

function Dashboard({ onSeeAllReservations }: DashboardProps) {
  const canHover = useCanHover();
  const [eventData, setEventData] = useState<EventDashboard>();
  const [reservationData, setReservationData] = useState<
    ReservationDashboard[]
  >([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [usersBudget, setUsersBudget] = useState<UserBudget[]>([]);
  const [userInEvent, setUserInEvent] = useState<boolean | null>(null);
  const { eventUuid } = useParams();
  const [isModalCode, setIsModalCode] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        setUserId(data.id);
      })
      .catch(() => {
        setUserId(null);
      });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchTest = async () => {
      if (!eventUuid || !userId) return;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user-in-event/${eventUuid}/${userId}`,
        { credentials: "include" },
      );
      const data = await response.json();
      setUserInEvent(data.joined);
    };

    fetchTest();
  }, [eventUuid, userId]);

  useEffect(() => {
    if (!userId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/username/${userId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUserName(data.username);
      });
  }, [userId]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/reservations/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setReservationData(Array.isArray(data) ? data : []);
      });
  }, [eventUuid]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(
      `${import.meta.env.VITE_API_URL}/api/users/description/${eventUuid}`,
      {
        credentials: "include",
      },
    )
      .then((res) => res.json())
      .then((data) => {
        setEventData(data[0]);
      });
  }, [eventUuid]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(
      `${import.meta.env.VITE_API_URL}/api/budget/${eventUuid}/totalUsers`,
      {
        credentials: "include",
      },
    )
      .then((res) => res.json())
      .then((data) => {
        setUsersBudget(Array.isArray(data) ? data : []);
      });
  }, [eventUuid]);

  function getInitials(userName: string) {
    return userName
      .split(" ")
      .map((word) => word[0]?.toUpperCase())
      .join("");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR");
  }

  function getReservationStatus(date: string) {
    const today = new Date();
    const reservationDate = new Date(date);

    return reservationDate < today ? "Passé" : "À venir";
  }
  function getReservationStatusCss(date: string) {
    const today = new Date();
    const reservationDate = new Date(date);

    return reservationDate < today ? "passe" : "a_venir";
  }
  const safeUserId = userId;
  if (!safeUserId) return <p>Chargement...</p>;

  if (userInEvent === null) {
    return <p>Chargement...</p>;
  }
  if (userInEvent === false) {
    return <p>Vous n'êtes pas inscrit à cet événement.</p>;
  }
  const MotionHand = motion(Hand);

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="event-name"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {eventData?.event_name}
      </motion.h1>
      <section className="section-nameCode">
        <motion.h1
          className="user-name"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Salut, {userName}
          <MotionHand
            size={20}
            animate={{ rotate: [0, 25, -25, 25, -25, 25, -25, 25, -25, 0] }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 0.5,
            }}
          />
        </motion.h1>
        {/* Le code s'affiche dans le même conteneur que le bouton, en
            position absolue sur toute sa surface : les deux se superposent
            exactement, quelle que soit la largeur d'écran. */}
        <motion.div
          className="code-wrapper"
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            className="button-code"
            onClick={() => setIsModalCode(true)}
          >
            Code de l'événement
          </button>
          {isModalCode && (
            <motion.div
              className="modal-code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="code-value">{eventData?.event_link_key}</span>
              <button
                className="copy"
                type="button"
                aria-label="Copier le code"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    eventData?.event_link_key || "",
                  );
                  setIsModalCode(false);
                }}
              >
                <Copy size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </section>

      <motion.p
        className="event-description"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {eventData?.event_description}
      </motion.p>

      <div className="dashboard-stats">
        {[
          {
            icon: <CalendarDays size={20} />,
            title: "Dates du séjour",
            value: eventData
              ? formatStayDates(
                  eventData.event_date_start,
                  eventData.event_date_end,
                )
              : "",
            className: "stat-1",
          },
          {
            icon: <UsersRound size={20} />,
            title: "L'équipe au complet",
            value: eventData?.total_users,
            className: "stat-2",
          },
          {
            icon: <Book size={20} />,
            title: "Nos réservations",
            value: eventData?.total_reservations,
            className: "stat-3",
          },
          {
            icon: <PiggyBank size={20} />,
            title: "Ton budget",
            value: formatBalance(getMyBalance(usersBudget, safeUserId)),
            className: "stat-4",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            className={stat.className}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              delay: index * 0,
            }}
            whileHover={
              canHover
                ? {
                    y: -5,
                    scale: 1.02,
                  }
                : undefined
            }
          >
            <p>
              {stat.icon}
              {stat.title}
            </p>
            <h2>{stat.value}</h2>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-components">
        <motion.div
          className="component-recent-reservations"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="component-header">
            <h3>
              <CalendarClock size={20} />
              Réservations récentes
            </h3>
            <button type="button" onClick={onSeeAllReservations}>
              Voir tout
            </button>
          </div>

          <div className="component-array">
            <div className="row-title">
              <h4>Organisateur</h4>
              <h4>Lieux</h4>
              <h4>Date</h4>
              <h4 className="statut">Statut</h4>
            </div>

            <div className="scroll">
              {reservationData.map((reservation, index) => (
                <motion.div
                  className="row"
                  key={reservation.reservation_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: 0.45 + index * 0.05,
                  }}
                >
                  <div className="name">
                    <p
                      className="initials"
                      style={{
                        backgroundColor: getInitialsColor(reservation.user_id),
                      }}
                    >
                      {getInitials(reservation.user_username)}
                    </p>

                    <p>{reservation.user_username}</p>
                  </div>

                  <p>{reservation.reservation_location}</p>

                  <p>{formatDate(reservation.reservation_date_start)}</p>

                  <p
                    className={getReservationStatusCss(
                      reservation.reservation_date_start,
                    )}
                  >
                    {getReservationStatus(reservation.reservation_date_start)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {eventUuid && userId && (
          <motion.div
            className="component-todo"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <TodoList eventUuid={eventUuid} todo_id_user={userId} />
          </motion.div>
        )}

        <motion.div
          className="dashboard-gallery"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <GalerieDashboard />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
