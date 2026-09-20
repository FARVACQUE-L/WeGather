import "./Messagerie.css";
import type { EmojiClickData } from "emoji-picker-react";
import EmojiPicker, { Categories, EmojiStyle } from "emoji-picker-react";
import { motion } from "framer-motion";
import { ContactRound, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { socket } from "../../socket/socket";

// La bibliothèque n'est pas traduite : on redéfinit les catégories pour
// imposer leur nom. L'ordre de ce tableau est celui du sélecteur.
const EMOJI_CATEGORIES = [
  { category: Categories.SUGGESTED, name: "Récemment utilisés" },
  { category: Categories.SMILEYS_PEOPLE, name: "Émojis et personnes" },
  { category: Categories.ANIMALS_NATURE, name: "Animaux et nature" },
  { category: Categories.FOOD_DRINK, name: "Nourriture et boissons" },
  { category: Categories.TRAVEL_PLACES, name: "Voyages et lieux" },
  { category: Categories.ACTIVITIES, name: "Activités" },
  { category: Categories.OBJECTS, name: "Objets" },
  { category: Categories.SYMBOLS, name: "Symboles" },
  { category: Categories.FLAGS, name: "Drapeaux" },
];

// Une suite emoji peut combiner plusieurs caractères : sélecteur de variante,
// teinte de peau, ou liaison par ZWJ (👨‍👩‍👧). On les capture d'un bloc pour ne
// pas couper une famille en trois bonshommes.
const EMOJI_RUN =
  /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*)/gu;
const EMOJI_ONLY =
  /^\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*$/u;

type MessagePart = { key: string; value: string; isEmoji: boolean };

// Découpe un message en fragments texte et emoji. La clé vient de la position
// dans la chaîne, pour rester stable sans dépendre de l'index de la boucle.
const splitMessageText = (text: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  let offset = 0;

  for (const chunk of text.split(EMOJI_RUN)) {
    if (chunk) {
      parts.push({
        key: `${offset}-${chunk}`,
        value: chunk,
        isEmoji: EMOJI_ONLY.test(chunk),
      });
    }
    offset += chunk.length;
  }

  return parts;
};

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
  const messageInputRef = useRef<HTMLInputElement | null>(null);

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
    setShowPicker(false);
    // Le focus revient au champ pour enchaîner la saisie sans cliquer.
    messageInputRef.current?.focus();
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
                      <p className="message-text">
                        {splitMessageText(reception.message_text).map((part) =>
                          part.isEmoji ? (
                            <span key={part.key} className="message-emoji">
                              {part.value}
                            </span>
                          ) : (
                            part.value
                          ),
                        )}
                      </p>
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
              ref={messageInputRef}
              type="text"
              value={messagesUser}
              onChange={(e) => setMessagesUser(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
            />
            {/* Le sélecteur est ancré à son bouton via ce conteneur en
                position relative : il s'ouvre juste au-dessus, quelle que
                soit la largeur d'écran. */}
            <div className="emoji-wrapper">
              <button
                type="button"
                aria-label="Ouvrir le sélecteur d'emoji"
                aria-expanded={showPicker}
                onClick={() => setShowPicker(!showPicker)}
              >
                😊
              </button>

              {showPicker && (
                <div className="emoji-picker">
                  {/* NATIVE : les emojis sont rendus avec la police du
                      système. Par défaut la bibliothèque télécharge une image
                      par emoji depuis un CDN, soit 128 requêtes à l'ouverture. */}
                  {/* La taille passe par les props : la bibliothèque la pose
                      en style en ligne, qu'aucune règle CSS ne peut battre. */}
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    emojiStyle={EmojiStyle.NATIVE}
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                    width="min(320px, 80vw)"
                    height="min(350px, 45vh)"
                    searchPlaceHolder="Rechercher un emoji"
                    categories={EMOJI_CATEGORIES}
                  />
                </div>
              )}
            </div>
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
