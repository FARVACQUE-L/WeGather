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

const EMOJI_RUN =
  /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*)/gu;
const EMOJI_ONLY =
  /^\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*$/u;

const URL_RUN = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
const URL_TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»]+$/;

type MessagePart = {
  key: string;
  value: string;
  kind: "text" | "emoji" | "link";
  href?: string;
};

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
  message_reply_to: number | null;
  reply_text: string | null;
  reply_image: string | null;
  reply_username: string | null;
  message_image: string | null;
  user_name: string;
  user_username: string;
  user_id: number;
  user_profile_picture: string;
  event_name: string;
  reactions: Reaction[];
};

type Reaction = {
  emoji: string;
  users: { user_id: number; user_username: string }[];
};

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type OpenMenu = {
  message: ReceptionMessagesUser;
  anchor: DOMRect;
  side: "left" | "right";
};

const MENU_GAP = 4;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  // Vrai tant que l'utilisateur est en bas de la conversation : on le garde
  // alors collé au dernier message, même si le contenu grandit ensuite.
  const isAtBottomRef = useRef(true);
  const lastMessageIdRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    const messagesElement = messagesRef.current;
    if (messagesElement) {
      messagesElement.scrollTop = messagesElement.scrollHeight;
    }
  }, []);

  const handleMessagesScroll = () => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) return;
    isAtBottomRef.current =
      messagesElement.scrollHeight -
        messagesElement.scrollTop -
        messagesElement.clientHeight <
      80;
  };

  // Après le rendu mais avant l'affichage, pour éviter un saut visible.
  useLayoutEffect(() => {
    const lastMessage = receptionMessagesUser.at(-1);
    if (!lastMessage) return;

    const isNewOwnMessage =
      lastMessage.message_id !== lastMessageIdRef.current &&
      lastMessage.user_id === userId;
    lastMessageIdRef.current = lastMessage.message_id;

    if (isAtBottomRef.current || isNewOwnMessage) scrollToBottom();
  }, [receptionMessagesUser, userId, scrollToBottom]);

  // La zone des messages rétrécit quand une réponse ou une image en attente
  // s'affiche sous elle, ou quand le clavier mobile s'ouvre.
  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) return;

    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) scrollToBottom();
    });
    observer.observe(messagesElement);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  // Une image n'a sa hauteur qu'une fois chargée.
  const handleMessageImageLoad = () => {
    if (isAtBottomRef.current) scrollToBottom();
  };
  const isTouchScreen = window.matchMedia(
    "(pointer: coarse), (max-width: 428px)",
  ).matches;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessagesUser((prev) => prev + emojiData.emoji);
    setShowPicker(false);
    if (!isTouchScreen) messageInputRef.current?.focus();
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

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreview(null);
      return;
    }

    const url = URL.createObjectURL(attachment);
    setAttachmentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  useEffect(() => {
    if (!viewerImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerImage(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [viewerImage]);

  useEffect(() => {
    if (!eventUuid) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/event/host/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setHostId(data.event_id_host))
      .catch(console.error);
  }, [eventUuid]);

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

    if (editing) {
      setEditing(null);
      setMessagesUser("");
    }
    setAttachment(file);
    messageInputRef.current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const image = Array.from(e.clipboardData.files).find((file) =>
      file.type.startsWith("image/"),
    );
    if (!image) return;

    e.preventDefault();
    attachImage(image);
  }

  const canSend = editing
    ? Boolean(messagesUser.trim() || editing.message_image)
    : Boolean(messagesUser.trim() || attachment);

  async function handleSendMessage() {
    if (!canSend || !eventUuid) {
      return;
    }

    const formData = new FormData();
    formData.append("messagesUser", messagesUser);
    formData.append("replyTo", replyTo ? String(replyTo.message_id) : "");
    if (attachment) formData.append("image", attachment);

    try {
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
          <div
            ref={messagesRef}
            className="messagerie-box-messages"
            onScroll={handleMessagesScroll}
          >
            {receptionMessagesUser.map((reception, index) => {
              const previousMessage = receptionMessagesUser[index - 1];

              const currentDay = formatMessageDay(reception.message_date);
              const previousDay = previousMessage
                ? formatMessageDay(previousMessage.message_date)
                : null;

              const isNewDay = currentDay !== previousDay;

              const isOwn = reception.user_id === userId;
              const showAuthor =
                !isOwn &&
                (isNewDay || previousMessage?.user_id !== reception.user_id);
              const isMenuOpen =
                openMenu?.message.message_id === reception.message_id;
              const hour = `${reception.message_edited_at ? "modifié · " : ""}${formatHour(reception.message_date)}`;

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
                  // Décalage compté depuis le bas : un nouveau message
                  // apparaît tout de suite, même dans une longue conversation.
                  transition={{
                    duration: 0.25,
                    delay:
                      Math.min(receptionMessagesUser.length - 1 - index, 10) *
                      0.03,
                  }}
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
                    {!isOwn && !showAuthor && (
                      <span className="avatar-spacer" />
                    )}

                    <section>
                      <div className="message-bubble-row">
                        {isOwn && actions}
                        <p className="message-text">
                          {showAuthor && (
                            <span className="message-author">
                              {reception.user_username}
                            </span>
                          )}
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
                                onLoad={handleMessageImageLoad}
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
                          {!isOwn && (
                            <span className="message-hour">{hour}</span>
                          )}
                        </p>
                        {!isOwn && actions}
                      </div>

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
            <div className="emoji-wrapper">
              <button
                type="button"
                aria-label="Ouvrir le sélecteur d'emoji"
                aria-expanded={showPicker}
                onClick={() => {
                  if (isTouchScreen) messageInputRef.current?.blur();
                  setShowPicker(!showPicker);
                }}
              >
                😊
              </button>

              {showPicker && (
                <div className="emoji-picker">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    emojiStyle={EmojiStyle.NATIVE}
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                    autoFocusSearch={!isTouchScreen}
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

      {openMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="message-menu"
            role="menu"
            style={{ visibility: "hidden" }}
          >
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
