import "./Messagerie.css";
import type { EmojiClickData } from "emoji-picker-react";
import EmojiPicker, { Categories, EmojiStyle } from "emoji-picker-react";
import { motion } from "framer-motion";
import { Ellipsis, Pencil, Plus, Reply, Send, Trash2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

// Liens commençant par http://, https:// ou www. Seuls ces schémas sont
// rendus cliquables : un « javascript: » reste du texte.
const URL_RUN = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
// Ponctuation collée à la fin d'un lien dans une phrase (« voir x.com. »),
// laissée hors du lien.
const URL_TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»]+$/;

type MessagePart = {
  key: string;
  value: string;
  kind: "text" | "emoji" | "link";
  // Adresse du lien, avec https:// ajouté devant un « www. ».
  href?: string;
};

// Découpe un message en fragments texte, emoji et lien. La clé vient de la
// position dans la chaîne, pour rester stable sans dépendre de l'index de la
// boucle.
const splitMessageText = (text: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  let offset = 0;

  const pushText = (chunk: string) => {
    for (const piece of chunk.split(EMOJI_RUN)) {
      if (piece) {
        parts.push({
          key: `${offset}-${piece}`,
          value: piece,
          kind: EMOJI_ONLY.test(piece) ? "emoji" : "text",
        });
      }
      offset += piece.length;
    }
  };

  for (const [index, chunk] of text.split(URL_RUN).entries()) {
    // split avec un groupe capturant : les liens sont aux index impairs.
    if (index % 2 === 0) {
      pushText(chunk);
      continue;
    }

    const trailing = chunk.match(URL_TRAILING_PUNCTUATION)?.[0] ?? "";
    const url = chunk.slice(0, chunk.length - trailing.length);

    parts.push({
      key: `${offset}-${url}`,
      value: url,
      kind: "link",
      href: url.toLowerCase().startsWith("www.") ? `https://${url}` : url,
    });
    offset += url.length;
    pushText(trailing);
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
  reply_image: string | null;
  reply_username: string | null;
  // Image jointe (chemin sous /uploads), null sans image.
  message_image: string | null;
  user_name: string;
  user_username: string;
  user_id: number;
  user_profile_picture: string;
  event_name: string;
  reactions: Reaction[];
};

// Réactions d'un message, regroupées par emoji avec les personnes qui l'ont
// mis.
type Reaction = {
  emoji: string;
  users: { user_id: number; user_username: string }[];
};

// Emojis proposés pour réagir, les mêmes que ceux acceptés par le serveur.
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Menu « ... » ouvert : le message visé, la position du bouton, et le côté
// où ouvrir le menu, dans l'espace libre à côté du bouton (à droite pour les
// messages des autres, à gauche pour les siens).
type OpenMenu = {
  message: ReceptionMessagesUser;
  anchor: DOMRect;
  side: "left" | "right";
};

// Écart entre le bouton « ... » et le menu.
const MENU_GAP = 4;

// Images acceptées en pièce jointe, comme côté serveur.
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

// Texte affiché pour un message cité : son texte, ou « Photo » s'il n'a
// qu'une image.
const quoteText = (text: string | null, image: string | null) =>
  text || (image ? "📷 Photo" : "");

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
  // Image en attente d'envoi, choisie avec le + ou collée, et son aperçu.
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Image affichée en grand dans la visionneuse, null si elle est fermée.
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [hostId, setHostId] = useState<number | null>(null);
  const { eventUuid } = useParams();

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
      // L'utilisateur est lu dans le cookie de session par le serveur.
      { method: "POST", credentials: "include" },
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

    const handleMessageReactions = ({
      message_id,
      reactions,
    }: {
      message_id: number;
      reactions: Reaction[];
    }) => {
      setReceptionMessagesUser((prev) =>
        prev.map((message) =>
          message.message_id === message_id
            ? { ...message, reactions }
            : message,
        ),
      );
    };

    socket.on("new-message", handleNewMessage);
    socket.on("message-updated", handleMessageUpdated);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("message-reactions", handleMessageReactions);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-updated", handleMessageUpdated);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("message-reactions", handleMessageReactions);
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
    if (openMenu && !exists(openMenu.message)) setOpenMenu(null);
  }, [receptionMessagesUser, replyTo, editing, openMenu]);

  // Aperçu de l'image en attente, libéré quand elle change ou est retirée.
  useEffect(() => {
    if (!attachment) {
      setAttachmentPreview(null);
      return;
    }

    const url = URL.createObjectURL(attachment);
    setAttachmentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  // Échap ferme la visionneuse.
  useEffect(() => {
    if (!viewerImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerImage(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [viewerImage]);

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

  // Un clic en dehors du menu « ... » le referme, comme le défilement de la
  // liste ou un redimensionnement : le menu, fixé à l'écran, ne suivrait
  // plus son message.
  useEffect(() => {
    if (!openMenu) return;

    const close = () => setOpenMenu(null);
    const handlePointerDown = (event: PointerEvent) => {
      if (
        !(event.target as Element).closest(".message-menu, .message-actions")
      ) {
        close();
      }
    };
    const list = messagesRef.current;

    document.addEventListener("pointerdown", handlePointerDown);
    list?.addEventListener("scroll", close);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      list?.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [openMenu]);

  // Place le menu à côté du bouton, centré sur lui en hauteur, sans sortir
  // de la boîte de messagerie : décalé vers l'intérieur s'il touche un bord.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const box = messagesRef.current?.getBoundingClientRect();
    if (!openMenu || !menu || !box) return;

    const { anchor, side } = openMenu;
    const { width, height } = menu.getBoundingClientRect();
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), Math.max(min, max));

    const left =
      side === "right"
        ? clamp(anchor.right + MENU_GAP, box.left, box.right - width)
        : clamp(anchor.left - MENU_GAP - width, box.left, box.right - width);
    const top = clamp(
      anchor.top + anchor.height / 2 - height / 2,
      box.top,
      box.bottom - height,
    );

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.visibility = "visible";
  }, [openMenu]);

  function toggleMenu(
    message: ReceptionMessagesUser,
    button: HTMLButtonElement,
  ) {
    if (openMenu?.message.message_id === message.message_id) {
      setOpenMenu(null);
      return;
    }

    setOpenMenu({
      message,
      anchor: button.getBoundingClientRect(),
      side: message.user_id === userId ? "left" : "right",
    });
  }

  // Ajoute la réaction, ou la retire si on l'avait déjà mise. Tous les
  // participants, soi compris, reçoivent le résultat par le socket.
  async function toggleReaction(messageId: number, emoji: string) {
    setOpenMenu(null);

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/${eventUuid}/${messageId}/reactions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        },
      );
    } catch (error) {
      console.error("Messagerie: erreur réaction", error);
    }
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
    // Seul le texte se modifie : une image en attente est retirée.
    setAttachment(null);
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

  // Vérifie et met en attente l'image choisie ou collée. Mêmes limites que le
  // serveur : 8 Mo, formats image courants.
  function attachImage(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      Swal.fire({
        icon: "error",
        text: "Format non supporté : JPEG, PNG, WebP, GIF ou AVIF.",
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      Swal.fire({ icon: "error", text: "Image trop lourde (8 Mo maximum)." });
      return;
    }

    // Une modification ne porte que sur le texte : joindre une image
    // l'annule et repart sur un nouveau message.
    if (editing) {
      setEditing(null);
      setMessagesUser("");
    }
    setAttachment(file);
    messageInputRef.current?.focus();
  }

  // Une image copiée (capture d'écran, image d'une page) est jointe au
  // message ; un texte collé garde son comportement normal.
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const image = Array.from(e.clipboardData.files).find((file) =>
      file.type.startsWith("image/"),
    );
    if (!image) return;

    e.preventDefault();
    attachImage(image);
  }

  // Envoi possible avec du texte, une image, ou un texte vidé lors de la
  // modification d'un message qui a une image.
  const canSend = editing
    ? Boolean(messagesUser.trim() || editing.message_image)
    : Boolean(messagesUser.trim() || attachment);

  async function handleSendMessage() {
    if (!canSend || !eventUuid) {
      return;
    }

    // Multipart pour porter l'image : le navigateur pose lui-même le
    // Content-Type avec sa délimitation.
    const formData = new FormData();
    formData.append("messagesUser", messagesUser);
    formData.append("replyTo", replyTo ? String(replyTo.message_id) : "");
    if (attachment) formData.append("image", attachment);

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
            { method: "POST", credentials: "include", body: formData },
          );

      if (response.ok) {
        setMessagesUser("");
        setReplyTo(null);
        setEditing(null);
        setAttachment(null);
      } else {
        const data = await response.json().catch(() => null);
        Swal.fire({
          icon: "error",
          text:
            data?.error ?? data?.message ?? "Le message n'a pas été envoyé.",
        });
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
              const isMenuOpen =
                openMenu?.message.message_id === reception.message_id;
              const hour = `${reception.message_edited_at ? "modifié · " : ""}${formatHour(reception.message_date)}`;

              // Bouton « ... » : à droite de la bulle pour les messages des
              // autres, à gauche pour les siens. Le menu est rendu à part.
              const actions = (
                <div className="message-actions">
                  <button
                    type="button"
                    className="message-menu-button"
                    aria-label="Actions sur le message"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    onClick={(e) => toggleMenu(reception, e.currentTarget)}
                  >
                    <Ellipsis size={18} />
                  </button>
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
                      {/* Le « ... » est dans la même ligne que la bulle :
                          il reste centré sur elle, quoi qu'il y ait dessous
                          (heure, réactions). */}
                      <div className="message-bubble-row">
                        {isOwn && actions}
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
                                {quoteText(
                                  reception.reply_text,
                                  reception.reply_image,
                                )}
                              </span>
                            </span>
                          )}
                          {/* Image jointe : un clic l'ouvre en grand dans la
                              visionneuse, sans quitter la page. */}
                          {reception.message_image && (
                            <button
                              type="button"
                              className="message-image-button"
                              aria-label="Agrandir"
                              onClick={() =>
                                setViewerImage(
                                  `${import.meta.env.VITE_API_URL}${reception.message_image}`,
                                )
                              }
                            >
                              <img
                                className="message-image"
                                src={`${import.meta.env.VITE_API_URL}${reception.message_image}`}
                                alt={`Envoyée par ${reception.user_username}`}
                                loading="lazy"
                              />
                            </button>
                          )}
                          {splitMessageText(reception.message_text).map(
                            (part) => {
                              if (part.kind === "emoji") {
                                return (
                                  <span
                                    key={part.key}
                                    className="message-emoji"
                                  >
                                    {part.value}
                                  </span>
                                );
                              }
                              // Nouvel onglet, sans accès à la page d'origine.
                              if (part.kind === "link") {
                                return (
                                  <a
                                    key={part.key}
                                    className="message-link"
                                    href={part.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {part.value}
                                  </a>
                                );
                              }
                              return part.value;
                            },
                          )}
                          {/* Messages des autres : l'heure est dans la bulle,
                            à droite de la dernière ligne. */}
                          {!isOwn && (
                            <span className="message-hour">{hour}</span>
                          )}
                        </p>
                        {!isOwn && actions}
                      </div>

                      {/* Une pastille par emoji, avec le nombre de réactions.
                          Un clic ajoute ou retire la sienne ; le survol donne
                          les pseudos. */}
                      {reception.reactions.length > 0 && (
                        <div className="message-reactions">
                          {reception.reactions.map((reaction) => {
                            const isMine = reaction.users.some(
                              (user) => user.user_id === userId,
                            );
                            const names = reaction.users
                              .map((user) => user.user_username)
                              .join(", ");

                            return (
                              <button
                                key={reaction.emoji}
                                type="button"
                                className={`reaction-chip${isMine ? " is-mine" : ""}`}
                                title={names}
                                aria-label={`${reaction.emoji} ${reaction.users.length} : ${names}`}
                                aria-pressed={isMine}
                                onClick={() =>
                                  toggleReaction(
                                    reception.message_id,
                                    reaction.emoji,
                                  )
                                }
                              >
                                <span className="reaction-emoji">
                                  {reaction.emoji}
                                </span>
                                {reaction.users.length}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isOwn && <p className="hour-text">{hour}</p>}
                    </section>
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
                  {quoteText(
                    (replyTo ?? editing)?.message_text ?? null,
                    (replyTo ?? editing)?.message_image ?? null,
                  )}
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

          {/* Image en attente d'envoi, retirable avant l'envoi. */}
          {attachmentPreview && (
            <div className="messagerie-attachment">
              <img src={attachmentPreview} alt="Pièce jointe à envoyer" />
              <button
                type="button"
                aria-label="Retirer l'image"
                onClick={() => setAttachment(null)}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="messagerie-input">
            {/* Joindre une image. Masqué pendant une modification, qui ne
                porte que sur le texte. */}
            {!editing && (
              <>
                <button
                  type="button"
                  className="attach-button"
                  aria-label="Joindre une image"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) attachImage(file);
                    // Permet de rechoisir le même fichier ensuite.
                    e.target.value = "";
                  }}
                />
              </>
            )}
            <input
              ref={messageInputRef}
              type="text"
              value={messagesUser}
              onChange={(e) => setMessagesUser(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
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
              disabled={!canSend}
            >
              <Send size={20} className="send" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Visionneuse : l'image en grand sur un fond sombre, dans la page.
          Un clic à côté de l'image, la croix ou Échap la ferme. */}
      {viewerImage &&
        createPortal(
          <div
            className="image-viewer"
            role="dialog"
            aria-modal="true"
            aria-label="Image en grand"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewerImage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setViewerImage(null);
            }}
          >
            <button
              type="button"
              className="image-viewer-close"
              aria-label="Fermer"
              onClick={() => setViewerImage(null)}
            >
              <X size={24} />
            </button>
            <img src={viewerImage} alt="" />
          </div>,
          document.body,
        )}

      {/* Rendu dans body, en position fixe : dans la liste qui défile, il
          était coupé par ses bords. Invisible jusqu'à son placement. */}
      {openMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="message-menu"
            role="menu"
            style={{ visibility: "hidden" }}
          >
            {/* Réactions rapides, en haut du menu. Celles déjà mises sont
                mises en évidence ; un clic les retire. */}
            <div className="message-menu-reactions">
              {REACTION_EMOJIS.map((emoji) => {
                const isMine = openMenu.message.reactions.some(
                  (reaction) =>
                    reaction.emoji === emoji &&
                    reaction.users.some((user) => user.user_id === userId),
                );

                return (
                  <button
                    key={emoji}
                    type="button"
                    className={isMine ? "is-mine" : undefined}
                    aria-label={`Réagir avec ${emoji}`}
                    aria-pressed={isMine}
                    onClick={() =>
                      toggleReaction(openMenu.message.message_id, emoji)
                    }
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => startReply(openMenu.message)}
            >
              <Reply size={15} />
              Répondre
            </button>
            {openMenu.message.user_id === userId && (
              <button
                type="button"
                role="menuitem"
                onClick={() => startEdit(openMenu.message)}
              >
                <Pencil size={15} />
                Modifier
              </button>
            )}
            {(openMenu.message.user_id === userId || userId === hostId) && (
              <button
                type="button"
                role="menuitem"
                className="is-danger"
                onClick={() => handleDeleteMessage(openMenu.message)}
              >
                <Trash2 size={15} />
                Supprimer
              </button>
            )}
          </div>,
          document.body,
        )}
    </motion.div>
  );
}

export default Messagerie;
