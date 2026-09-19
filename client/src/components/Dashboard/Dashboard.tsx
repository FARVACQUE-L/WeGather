import "./Dashboard.css";
import { motion } from "framer-motion";
import {
  Book,
  CalendarClock,
  Copy,
  Hand,
  HandCoins,
  PiggyBank,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import GalerieDashboard from "../GalerieDashboard/GalerieDashboard";
import TodoList from "../ToDoList/TodoList";

type EventDashboard = {
  event_link_key: string;
  event_name: string;
  event_description: string | null;
  total_users: number | null;
  total_reservations: number | null;
  total_budgets: string | number | null;
};
type ReservationDashboard = {
  event_id: number | null;
  user_name: string;
  reservation_location: string;
  reservation_date: string;
  reservation_id: number;
};
type UserAndBudget = {
  user_id: number;
  user_username: string | null;
  user_name: string | null;
  total_price: number | null;
};

function Dashboard() {
  const [eventData, setEventData] = useState<EventDashboard>();
  const [reservationData, setReservationData] = useState<
    ReservationDashboard[]
  >([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userAndBudgetData, setUserAndBudgetData] = useState<UserAndBudget>();
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
    if (!eventUuid || !userId) return;
    fetch(
      `${import.meta.env.VITE_API_URL}/api/budget/user/${eventUuid}/${userId}`,
      {
        credentials: "include",
      },
    )
      .then((res) => res.json())
      .then((data) => {
        setUserAndBudgetData(data);
      });
  }, [eventUuid, userId]);

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {eventData?.event_description}
      </motion.p>

      <div className="dashboard-stats">
        {[
          {
            icon: <UsersRound size={20} />,
            title: "Total de participants",
            value: eventData?.total_users,
            className: "stat-1",
          },
          {
            icon: <Book size={20} />,
            title: "Reservations",
            value: eventData?.total_reservations,
            className: "stat-2",
          },
          {
            icon: <HandCoins size={20} />,
            title: "Budget total",
            value: `${eventData?.total_budgets}€`,
            className: "stat-3",
          },
          {
            icon: <PiggyBank size={20} />,
            title: "Budget propre",
            value: `${userAndBudgetData?.total_price || 0}€`,
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
            whileHover={{
              y: -5,
              scale: 1.02,
            }}
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
            <button type="button">Voir tout</button>
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
                    <p className="initials">
                      {getInitials(reservation.user_name)}
                    </p>

                    <p>{reservation.user_name}</p>
                  </div>

                  <p>{reservation.reservation_location}</p>

                  <p>{formatDate(reservation.reservation_date)}</p>

                  <p
                    className={getReservationStatusCss(
                      reservation.reservation_date,
                    )}
                  >
                    {getReservationStatus(reservation.reservation_date)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {eventUuid && userId && (
          <motion.div
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
