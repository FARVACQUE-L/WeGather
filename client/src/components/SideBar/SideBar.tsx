import "./SideBar.css";
import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  Book,
  Images,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import Logo from "../../assets/images/logo-wegather.png";
import notificationSound from "../../assets/sounds/notification.mp3";
import { socket } from "../../socket/socket";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
};

const MotionLink = motion(Link);
type SideBarProps = {
  activeComponent:
    | "tableau"
    | "messagerie"
    | "reservation"
    | "budget"
    | "galerie";
  handleChangeComponent: (
    componentName:
      | "tableau"
      | "messagerie"
      | "reservation"
      | "budget"
      | "galerie",
  ) => void;
};
function SideBar({ activeComponent, handleChangeComponent }: SideBarProps) {
  const { eventUuid } = useParams();
  const [userId, setUserId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isHost, setIsHost] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUserId(data.id))
      .catch(() => setUserId(null));
  }, []);

  useEffect(() => {
    notificationAudioRef.current = new Audio(notificationSound);
    notificationAudioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/event/host/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur récupération host");
        }

        return res.json();
      })
      .then((data) => {
        setIsHost(data.event_id_host);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [eventUuid]);

  const host = userId === isHost;

  const handleDeleteEvent = async () => {
    if (!eventUuid) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/event/delete/${eventUuid}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Erreur suppression");
      }

      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };
  const handleDeleteUserJoining = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/euj/delete/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Erreur suppression");
      }
      setIsExitModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!eventUuid || !userId) return;
    fetch(
      `${import.meta.env.VITE_API_URL}/api/messages/unread/${eventUuid}/${userId}`,
      {
        credentials: "include",
      },
    )
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.count))
      .catch(console.error);
  }, [eventUuid, userId]);

  const activeComponentRef = useRef(activeComponent);

  useEffect(() => {
    activeComponentRef.current = activeComponent;
  }, [activeComponent]);

  useEffect(() => {
    if (!eventUuid || !userId) return;

    socket.emit("join-event", eventUuid);

    const handleNewMessage = (newMessage: { user_id: number }) => {
      if (newMessage.user_id === userId) return;
      if (activeComponentRef.current === "messagerie") return;
      setUnreadCount((prev) => prev + 1);
      notificationAudioRef.current?.play().catch(() => {});
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.emit("leave-event", eventUuid);
      socket.off("new-message", handleNewMessage);
    };
  }, [eventUuid, userId]);

  if (eventUuid === null) {
    return null;
  }

  return (
    <motion.nav
      className="sidebar"
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.button
        type="button"
        className="logo-sidebar-container"
        aria-label="Aller au tableau de bord"
        onClick={() => handleChangeComponent("tableau")}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <img src={Logo} alt="logo-wegather" className="logo-sidebar-image" />
        <h2 className="logo-sidebar-h2">
          We<i>G</i>ather
        </h2>
      </motion.button>

      <motion.ul
        className="sidebar-menu"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.li
          variants={itemVariants}
          className={activeComponent === "tableau" ? "active" : ""}
        >
          <motion.button
            type="button"
            onClick={() => handleChangeComponent("tableau")}
            whileHover={{ x: 6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LayoutDashboard size={20} className="layout" />
            <span>Tableau de bord</span>
          </motion.button>
        </motion.li>

        <motion.li
          variants={itemVariants}
          className={activeComponent === "messagerie" ? "active" : ""}
        >
          <motion.button
            type="button"
            onClick={() => {
              handleChangeComponent("messagerie");
              setUnreadCount(0);
            }}
            whileHover={{ x: 6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageCircle size={20} className="message" />
            <span>Messagerie</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </motion.button>
        </motion.li>

        <motion.li
          variants={itemVariants}
          className={activeComponent === "reservation" ? "active" : ""}
        >
          <motion.button
            type="button"
            onClick={() => handleChangeComponent("reservation")}
            whileHover={{ x: 6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Book size={20} className="book" />
            <span>Reservation</span>
          </motion.button>
        </motion.li>

        <motion.li
          variants={itemVariants}
          className={activeComponent === "budget" ? "active" : ""}
        >
          <motion.button
            type="button"
            onClick={() => handleChangeComponent("budget")}
            whileHover={{ x: 6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BadgeDollarSign size={20} className="dollar" />
            <span>Budget</span>
          </motion.button>
        </motion.li>

        <motion.li
          variants={itemVariants}
          className={activeComponent === "galerie" ? "active" : ""}
        >
          <motion.button
            type="button"
            onClick={() => handleChangeComponent("galerie")}
            whileHover={{ x: 6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Images size={20} className="image" />
            <span>Galerie</span>
          </motion.button>
        </motion.li>
      </motion.ul>

      <motion.ul
        className="sidebar-end-menu"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.li variants={itemVariants} className="sidebar-signal">
          <MotionLink
            whileHover={{ x: 6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            to={`/events/${eventUuid}/report`}
            className="link"
          >
            <TriangleAlert size={20} />
            <span>Signaler</span>
          </MotionLink>
        </motion.li>

        <motion.li variants={itemVariants} className="sidebar-delete-event">
          {host ? (
            <>
              <motion.button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                whileHover={{ x: 6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 size={20} />
                <span>Supprimer l'évenement</span>
              </motion.button>

              {isDeleteModalOpen && (
                <div className="delete-modal-overlay">
                  <div className="delete-modal">
                    <h3>Supprimer l'évenement</h3>

                    <p>Êtes-vous sûr de vouloir supprimer votre évenement ?</p>

                    <div className="delete-modal-actions">
                      <button
                        type="button"
                        onClick={() => setIsDeleteModalOpen(false)}
                      >
                        Annuler
                      </button>

                      <button type="button" onClick={handleDeleteEvent}>
                        <Link to="/homeevents">Supprimer</Link>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <motion.button
                type="button"
                onClick={() => setIsExitModalOpen(true)}
                whileHover={{ x: 6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut size={20} />
                <span>Quitter l'évenement</span>
              </motion.button>

              {isExitModalOpen && (
                <div className="delete-modal-overlay">
                  <div className="delete-modal">
                    <h3>Quitter l'évenement</h3>

                    <p>Êtes-vous sûr de vouloir quitter l'évenement ?</p>

                    <div className="delete-modal-actions">
                      <button
                        type="button"
                        onClick={() => setIsExitModalOpen(false)}
                      >
                        Annuler
                      </button>

                      <button type="button" onClick={handleDeleteUserJoining}>
                        <Link to="/homeevents">Quitter</Link>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.li>
      </motion.ul>
    </motion.nav>
  );
}

export default SideBar;
