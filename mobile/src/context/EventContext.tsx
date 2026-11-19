import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError, api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { EventDetail, Group } from "@/types/event";

type EventContextValue = {
  uuid: string;
  event: EventDetail | null;
  group: Group | null;
  errorMessage: string;
  unreadCount: number;
  reload: () => Promise<void>;
  loadUnreadCount: () => void;
};

const EventContext = createContext<EventContextValue | null>(null);

// Données partagées par les onglets de l'événement et le chat.
// Le salon Socket.io est rejoint ici, une seule fois pour tout
// l'événement : les salons ne sont pas comptés côté serveur, un
// leave-event lancé par un écran ferait sortir tous les autres.
export function EventProvider({
  uuid,
  children,
}: {
  uuid: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadGroup = useCallback(async () => {
    setGroup(await api<Group>(`/api/events/${uuid}/group`));
  }, [uuid]);

  const reload = useCallback(async () => {
    try {
      const [eventData] = await Promise.all([
        api<EventDetail>(`/api/events/${uuid}`),
        loadGroup(),
      ]);
      setEvent(eventData);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Erreur serveur",
      );
    }
  }, [uuid, loadGroup]);

  const loadUnreadCount = useCallback(() => {
    api<{ count: number }>(`/api/messages/unread/${uuid}`)
      .then((result) => setUnreadCount(result.count))
      .catch(() => {});
  }, [uuid]);

  useEffect(() => {
    reload();
    loadUnreadCount();
  }, [reload, loadUnreadCount]);

  useEffect(() => {
    const socket = getSocket();

    // Pastilles « en ligne » des membres mises à jour en direct.
    const refreshPresence = () => {
      loadGroup().catch(() => {});
    };

    // Chaque message d'un autre membre compte comme non lu. Si le chat
    // est ouvert, il le marque comme lu et le serveur renvoie
    // « messages-read » : le compteur repasse à zéro.
    const handleNewMessage = (message: { user_id: number }) => {
      if (message.user_id !== user?.id) {
        setUnreadCount((count) => count + 1);
      }
    };

    // Messages lus ici ou sur un autre appareil (le site par exemple).
    const handleMessagesRead = (data: { eventUuid: string }) => {
      if (data.eventUuid === uuid) setUnreadCount(0);
    };

    // Après une coupure, le serveur a oublié le salon : on le rejoint
    // et on recompte les messages arrivés entre-temps.
    const join = () => socket?.emit("join-event", uuid);
    const handleReconnect = () => {
      join();
      loadUnreadCount();
      refreshPresence();
    };

    join();
    socket?.on("connect", handleReconnect);
    socket?.on("new-message", handleNewMessage);
    socket?.on("messages-read", handleMessagesRead);
    socket?.on("presence-changed", refreshPresence);
    return () => {
      socket?.emit("leave-event", uuid);
      socket?.off("connect", handleReconnect);
      socket?.off("new-message", handleNewMessage);
      socket?.off("messages-read", handleMessagesRead);
      socket?.off("presence-changed", refreshPresence);
    };
  }, [uuid, user?.id, loadGroup, loadUnreadCount]);

  const value = useMemo(
    () => ({
      uuid,
      event,
      group,
      errorMessage,
      unreadCount,
      reload,
      loadUnreadCount,
    }),
    [uuid, event, group, errorMessage, unreadCount, reload, loadUnreadCount],
  );

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent doit être utilisé dans un EventProvider");
  }
  return context;
}
