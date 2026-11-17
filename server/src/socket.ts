import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { isEventMember } from "./helper/eventMembership";
import { readSession } from "./middleware/auth";
import eventRepository from "./modules/event/eventRepository";
import { addSocket, getSocketIds, getStatus, removeSocket } from "./presence";

let io: SocketServer | null = null;

const updatePresence = (userId: number, update: () => void): void => {
  const previousStatus = getStatus(userId);
  update();

  if (getStatus(userId) !== previousStatus) {
    io?.emit("presence-changed");
  }
};

// Le site s'authentifie par le cookie auth_token, l'application mobile en
// passant son token dans l'option auth de socket.io-client.
const readCredentials = (handshake: {
  auth: Record<string, unknown>;
  headers: { cookie?: string };
}): string | undefined => {
  if (typeof handshake.auth.token === "string") {
    return `Bearer ${handshake.auth.token}`;
  }

  const cookie = handshake.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("auth_token="));

  return cookie && decodeURIComponent(cookie.slice("auth_token=".length));
};

const readUserId = async (
  credentials: string | undefined,
): Promise<number | null> => {
  if (!credentials) return null;

  try {
    const session = await readSession(credentials);
    return session.status === "valid" ? session.user.id : null;
  } catch {
    return null;
  }
};

const canJoinEvent = async (userId: number | null, eventUuid: unknown) => {
  if (userId === null || typeof eventUuid !== "string") return false;

  const eventId = await eventRepository.readIdByUuid(eventUuid);
  return eventId !== undefined && (await isEventMember(eventId, userId));
};

export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: `${process.env.CLIENT_URL}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Utilisateur connecté :", socket.id);

    const userIdPromise = readUserId(readCredentials(socket.handshake));

    userIdPromise.then((userId) => {
      if (userId !== null && socket.connected) {
        updatePresence(userId, () => addSocket(userId, socket.id));
      }
    });

    socket.on("join-event", async (eventUuid: unknown) => {
      try {
        if (!(await canJoinEvent(await userIdPromise, eventUuid))) return;

        socket.join(`event-${eventUuid}`);
        console.log(`${socket.id} a rejoint event-${eventUuid}`);
      } catch (error) {
        console.error("join-event :", error);
      }
    });

    socket.on("leave-event", (eventUuid: unknown) => {
      if (typeof eventUuid !== "string") return;

      socket.leave(`event-${eventUuid}`);
      console.log(`${socket.id} a quitté event-${eventUuid}`);
    });

    socket.on("disconnect", async () => {
      console.log("Utilisateur déconnecté :", socket.id);

      const userId = await userIdPromise;
      if (userId !== null) {
        updatePresence(userId, () => removeSocket(userId, socket.id));
      }
    });
  });

  return io;
};

export const getIo = (): SocketServer => {
  if (!io) {
    throw new Error("Socket.IO n'est pas initialisé");
  }

  return io;
};

export const disconnectUser = (userId: number) => {
  const socketIds = getSocketIds(userId);
  if (!io || socketIds.length === 0) return;

  io.in(socketIds).disconnectSockets(true);
};

// Prévient tous les appareils connectés d'un utilisateur (site et
// application mobile), par exemple pour synchroniser les messages lus.
export const emitToUser = (userId: number, event: string, payload: unknown) => {
  const socketIds = getSocketIds(userId);
  if (!io || socketIds.length === 0) return;

  io.to(socketIds).emit(event, payload);
};

export const removeFromEventRoom = (userId: number, eventUuid: string) => {
  const socketIds = getSocketIds(userId);
  if (!io || socketIds.length === 0) return;

  io.in(socketIds).socketsLeave(`event-${eventUuid}`);
};
