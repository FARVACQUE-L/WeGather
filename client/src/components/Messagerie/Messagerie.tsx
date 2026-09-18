import "./Messagerie.css";
import type { EmojiClickData } from "emoji-picker-react";
import EmojiPicker from "emoji-picker-react";
import { motion } from "framer-motion";
import { ContactRound, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { socket } from "../../socket/socket";

type ReceptionMessagesUser = {
  message_id: number;
  message_text: string;
  message_date: string;
  user_name: string;
  user_id: number;
  user_profile_picture: string;
  event_name: string;
};
type UserByEvent = {
  user_username: string;
  user_profile_picture: string;
  user_joining_date: string;
};
function Messagerie() {
  const [messagesUser, setMessagesUser] = useState("");
  const [receptionMessagesUser, setReceptionMessagesUser] = useState<
    ReceptionMessagesUser[]
  >([]);
  const [userInEvent, setUserInEvent] = useState<boolean | null>(null);
  const [usersByEvent, setUsersByEvent] = useState<UserByEvent[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const { eventUuid } = useParams();

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUserId(data.id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const messagesElement = messagesRef.current;
    const messagesCount = receptionMessagesUser.length;
    if (!messagesElement || messagesCount === 0) return;
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }, [receptionMessagesUser]);
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessagesUser((prev) => prev + emojiData.emoji);
  };

  const fetchUserEvent = useCallback(async () => {
    if (!eventUuid || !userId) return;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/user-in-event/${eventUuid}/${userId}`,
      {
        credentials: "include",
      },
    );

    const data = await response.json();
    setUserInEvent(data.joined);
  }, [eventUuid, userId]);

  const fetchMessages = useCallback(() => {
    if (!eventUuid) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/messages/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setReceptionMessagesUser(data));
  }, [eventUuid]);

  useEffect(() => {
    if (!eventUuid || !userId) return;
    fetchUserEvent();
    fetchMessages();
  }, [eventUuid, userId, fetchUserEvent, fetchMessages]);

  useEffect(() => {
    if (!eventUuid || !userId) return;
    fetch(
      `${import.meta.env.VITE_API_URL}/api/messages/notification/${eventUuid}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      },
    ).catch((error) => {
      console.error("Erreur lecture messages :", error);
    });
  }, [eventUuid, userId]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/messages/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setReceptionMessagesUser(data);
      });
  }, [eventUuid]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/user/event/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUsersByEvent(data));
  }, [eventUuid]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connecté :", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Déconnecté :", reason);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);
  useEffect(() => {
    if (!eventUuid) return;

    socket.emit("join-event", eventUuid);

    const handleNewMessage = (newMessage: ReceptionMessagesUser) => {
      setReceptionMessagesUser((prev) => [...prev, newMessage]);
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [eventUuid]);
  async function handleSendMessage() {
    if (!messagesUser.trim() || !eventUuid) {
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/${eventUuid}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            messagesUser: messagesUser,
          }),
        },
      );

      if (response.ok) {
        setMessagesUser("");
      }
    } catch (error) {
      console.error("Messagerie: erreur envoi message", error);
    }
  }

  function formatMonthYear(dateString: string): string {
    const date = new Date(dateString);

    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }
  function formatHour(dateString: string): string {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const formatMessageDay = (date: string): string => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Aujourd’hui";
    }

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Hier";
    }

    return messageDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (userInEvent === null) {
    return <p>Chargement...</p>;
  }
  if (userInEvent === false) {
    return <p>Vous n'êtes pas inscrit à cet événement.</p>;
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  return (
    <motion.div
      className="messagerie"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h1>{receptionMessagesUser[0]?.event_name}</h1>

      <section className="global-messagerie">
        <motion.div
          className="messagerie-box"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div ref={messagesRef} className="messagerie-box-messages">
            {receptionMessagesUser.map((reception, index) => {
              const previousMessage = receptionMessagesUser[index - 1];

              const currentDay = formatMessageDay(reception.message_date);
              const previousDay = previousMessage
                ? formatMessageDay(previousMessage.message_date)
                : null;

              const isNewDay = currentDay !== previousDay;

              return (
                <motion.div
                  key={reception.message_id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                >
                  {isNewDay && (
                    <div className="message-date-separator">{currentDay}</div>
                  )}

                  <div
                    className={
                      reception.user_id === userId
                        ? "messagerie-box-messages-user"
                        : "messagerie-box-messages-friends"
                    }
                  >
                    {reception.user_id !== userId && (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${reception.user_profile_picture}`}
                        alt="profil_ami"
                      />
                    )}

                    <section>
                      <p className="message-text">{reception.message_text}</p>
                      <p className="hour-text">
                        {formatHour(reception.message_date)}
                      </p>
                    </section>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="massagerie-input">
            <input
              type="text"
              value={messagesUser}
              onChange={(e) => setMessagesUser(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
            />
            <button type="button" onClick={() => setShowPicker(!showPicker)}>
              😊
            </button>

            {showPicker && (
              <div className="emoji-picker">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
            <button
              className="send-button"
              type="button"
              onClick={handleSendMessage}
              disabled={!messagesUser.trim()}
            >
              <Send size={20} className="send" />
            </button>
          </div>
        </motion.div>

        <motion.section
          className="messagerie-contact"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h3>
            <ContactRound size={20} />
            Contacts présents
          </h3>

          <hr className="hr-h3" />

          {usersByEvent.map((event, index) => (
            <motion.div
              key={event.user_username}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
            >
              <img
                src={`${import.meta.env.VITE_API_URL}${event.user_profile_picture}`}
                alt="photo-profil"
              />
              <div>
                <p>{event.user_username}</p>
                <p className="membre-date">
                  Membre depuis {formatMonthYear(event.user_joining_date)}
                </p>
                <hr />
              </div>
            </motion.div>
          ))}
        </motion.section>
      </section>
    </motion.div>
  );
}

export default Messagerie;
