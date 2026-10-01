import "./Messagerie.css";
import type { EmojiClickData } from "emoji-picker-react";
import EmojiPicker, { Categories, EmojiStyle } from "emoji-picker-react";
import { motion } from "framer-motion";
import { Ellipsis, Pencil, Reply, Send, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import Swal from "sweetalert2";
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
  message_edited_at: string | null;
  // Message cité par une réponse, avec son texte et le pseudo de son auteur.
  message_reply_to: number | null;
  reply_text: string | null;
  reply_username: string | null;
  user_name: string;
  user_username: string;
  user_id: number;
  user_profile_picture: string;
  event_name: string;
};

// Menu « ... » ouvert : le message visé, et le sens d'ouverture. Près du bas
// de la liste, le menu s'ouvre vers le haut pour ne pas être coupé.
type OpenMenu = { messageId: number; openUp: boolean };

// Hauteur approximative du menu, pour décider de son sens d'ouverture.
const MENU_HEIGHT = 130;

function Messagerie() {
  const [messagesUser, setMessagesUser] = useState("");
  const [receptionMessagesUser, setReceptionMessagesUser] = useState<
    ReceptionMessagesUser[]
  >([]);
  const [userInEvent, setUserInEvent] = useState<boolean | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  const [replyTo, setReplyTo] = useState<ReceptionMessagesUser | null>(null);
  const [editing, setEditing] = useState<ReceptionMessagesUser | null>(null);
  const [hostId, setHostId] = useState<number | null>(null);
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

    // Un message modifié remplace l'ancien, et les réponses qui le citent
    // affichent son nouveau texte.
    const handleMessageUpdated = (updated: ReceptionMessagesUser) => {
      setReceptionMessagesUser((prev) =>
        prev.map((message) => {
          if (message.message_id === updated.message_id) return updated;
          if (message.message_reply_to === updated.message_id) {
            return { ...message, reply_text: updated.message_text };
          }
          return message;
        }),
      );
    };

    // Un message supprimé disparaît, et les réponses qui le citaient perdent
    // leur citation, comme en base.
    const handleMessageDeleted = ({ message_id }: { message_id: number }) => {
      setReceptionMessagesUser((prev) =>
        prev
          .filter((message) => message.message_id !== message_id)
          .map((message) =>
            message.message_reply_to === message_id
              ? {
                  ...message,
                  message_reply_to: null,
                  reply_text: null,
                  reply_username: null,
                }
              : message,
          ),
      );
    };

    socket.on("new-message", handleNewMessage);
    socket.on("message-updated", handleMessageUpdated);
    socket.on("message-deleted", handleMessageDeleted);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-updated", handleMessageUpdated);
      socket.off("message-deleted", handleMessageDeleted);
    };
  }, [eventUuid]);

  // Si le message auquel on répond, ou qu'on modifie, est supprimé entre-temps,
  // la réponse ou la modification est annulée.
  useEffect(() => {
    const exists = (message: ReceptionMessagesUser | null) =>
      message !== null &&
      receptionMessagesUser.some(
        (current) => current.message_id === message.message_id,
      );

    if (replyTo && !exists(replyTo)) setReplyTo(null);
    if (editing && !exists(editing)) {
      setEditing(null);
      setMessagesUser("");
    }
  }, [receptionMessagesUser, replyTo, editing]);

  // L'hôte peut supprimer tous les messages de son événement.
  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/event/host/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setHostId(data.event_id_host))
      .catch(console.error);
  }, [eventUuid]);

  // Un clic en dehors du menu « ... » le referme.
  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest(".message-actions")) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenu]);

  function toggleMenu(messageId: number, button: HTMLButtonElement) {
    if (openMenu?.messageId === messageId) {
      setOpenMenu(null);
      return;
    }

    const listBottom = messagesRef.current?.getBoundingClientRect().bottom;
    const buttonBottom = button.getBoundingClientRect().bottom;
    const openUp =
      listBottom !== undefined && buttonBottom + MENU_HEIGHT > listBottom;

    setOpenMenu({ messageId, openUp });
  }

  function startReply(message: ReceptionMessagesUser) {
    setOpenMenu(null);
    if (editing) setMessagesUser("");
    setEditing(null);
    setReplyTo(message);
    messageInputRef.current?.focus();
  }

  function startEdit(message: ReceptionMessagesUser) {
    setOpenMenu(null);
    setReplyTo(null);
    setEditing(message);
    setMessagesUser(message.message_text);
    messageInputRef.current?.focus();
  }

  function cancelCompose() {
    if (editing) setMessagesUser("");
    setEditing(null);
    setReplyTo(null);
  }

  async function handleDeleteMessage(message: ReceptionMessagesUser) {
    setOpenMenu(null);

    const { isConfirmed } = await Swal.fire({
      title: "Supprimer le message ?",
      text: "Le message sera supprimé pour tous les participants.",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      customClass: { popup: "toast-warning-popup" },
    });
    if (!isConfirmed) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/${eventUuid}/${message.message_id}`,
        { method: "DELETE", credentials: "include" },
      );
    } catch (error) {
      console.error("Messagerie: erreur suppression message", error);
    }
  }

  async function handleSendMessage() {
    if (!messagesUser.trim() || !eventUuid) {
      return;
    }
    try {
      // En modification, le texte remplace celui du message ; sinon c'est
      // un nouveau message, éventuellement en réponse à un autre.
      const response = editing
        ? await fetch(
            `${import.meta.env.VITE_API_URL}/api/messages/${eventUuid}/${editing.message_id}`,
            {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messagesUser }),
            },
          )
        : await fetch(
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
                replyTo: replyTo?.message_id ?? null,
              }),
            },
          );

      if (response.ok) {
        setMessagesUser("");
        setReplyTo(null);
        setEditing(null);
      }
    } catch (error) {
      console.error("Messagerie: erreur envoi message", error);
    }
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
    if (e.key === "Escape") {
      cancelCompose();
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

              // Pseudo et photo seulement en tête d'une suite de messages du
              // même auteur : ils reviennent après le message d'un autre, ou
              // après le séparateur d'un nouveau jour.
              const isOwn = reception.user_id === userId;
              const showAuthor =
                !isOwn &&
                (isNewDay || previousMessage?.user_id !== reception.user_id);
              const isMenuOpen = openMenu?.messageId === reception.message_id;
              const hour = `${reception.message_edited_at ? "modifié · " : ""}${formatHour(reception.message_date)}`;

              // Bouton « ... » et son menu : à droite de la bulle pour les
              // messages des autres, à gauche pour les siens.
              const actions = (
                <div className="message-actions">
                  <button
                    type="button"
                    className="message-menu-button"
                    aria-label="Actions sur le message"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    onClick={(e) =>
                      toggleMenu(reception.message_id, e.currentTarget)
                    }
                  >
                    <Ellipsis size={18} />
                  </button>
                  {isMenuOpen && (
                    <div
                      className={`message-menu${openMenu?.openUp ? " is-up" : ""}`}
                      role="menu"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => startReply(reception)}
                      >
                        <Reply size={15} />
                        Répondre
                      </button>
                      {isOwn && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => startEdit(reception)}
                        >
                          <Pencil size={15} />
                          Modifier
                        </button>
                      )}
                      {(isOwn || userId === hostId) && (
                        <button
                          type="button"
                          role="menuitem"
                          className="is-danger"
                          onClick={() => handleDeleteMessage(reception)}
                        >
                          <Trash2 size={15} />
                          Supprimer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );

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
                      isOwn
                        ? "messagerie-box-messages-user"
                        : "messagerie-box-messages-friends"
                    }
                  >
                    {isOwn && actions}
                    {showAuthor && (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${reception.user_profile_picture}`}
                        alt="profil_ami"
                      />
                    )}
                    {/* Même largeur que la photo : les bulles suivantes de
                        la suite restent alignées sur la première. */}
                    {!isOwn && !showAuthor && (
                      <span className="avatar-spacer" />
                    )}

                    <section>
                      <p className="message-text">
                        {/* Pseudo en haut de la bulle, pour les messages des
                            autres seulement : les siens n'ont pas besoin
                            d'être signés. */}
                        {showAuthor && (
                          <span className="message-author">
                            {reception.user_username}
                          </span>
                        )}
                        {/* Citation du message auquel celui-ci répond. */}
                        {reception.message_reply_to !== null && (
                          <span className="message-reply">
                            <span className="message-reply-author">
                              {reception.reply_username}
                            </span>
                            <span className="message-reply-text">
                              {reception.reply_text}
                            </span>
                          </span>
                        )}
                        {splitMessageText(reception.message_text).map((part) =>
                          part.isEmoji ? (
                            <span key={part.key} className="message-emoji">
                              {part.value}
                            </span>
                          ) : (
                            part.value
                          ),
                        )}
                        {/* Messages des autres : l'heure est dans la bulle,
                            à droite de la dernière ligne. */}
                        {!isOwn && <span className="message-hour">{hour}</span>}
                      </p>
                      {isOwn && <p className="hour-text">{hour}</p>}
                    </section>
                    {!isOwn && actions}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rappel de la réponse ou de la modification en cours, au-dessus
              de la barre de saisie. Échap ou la croix l'annule. */}
          {(replyTo || editing) && (
            <div className="messagerie-compose-context">
              {replyTo ? <Reply size={16} /> : <Pencil size={16} />}
              <div>
                <p className="compose-context-title">
                  {replyTo
                    ? `Réponse à ${replyTo.user_username}`
                    : "Modification du message"}
                </p>
                <p className="compose-context-text">
                  {(replyTo ?? editing)?.message_text}
                </p>
              </div>
              <button
                type="button"
                aria-label={
                  replyTo ? "Annuler la réponse" : "Annuler la modification"
                }
                onClick={cancelCompose}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="messagerie-input">
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
      </section>
    </motion.div>
  );
}

export default Messagerie;
