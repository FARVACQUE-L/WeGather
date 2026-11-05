import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { isEventMember } from "./helper/eventMembership";
import { decodeJWT } from "./helper/jwtHelper";
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

const readUserId = (cookieHeader: string | undefined): number | null => {
  const cookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("auth_token="));

  if (!cookie) return null;

  const [, token] = decodeURIComponent(
    cookie.slice("auth_token=".length),
  ).split(" ");

  try {
    return decodeJWT(token).id;
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

    const userId = readUserId(socket.handshake.headers.cookie);

    if (userId !== null) {
      updatePresence(userId, () => addSocket(userId, socket.id));
    }

    socket.on("join-event", async (eventUuid: unknown) => {
      try {
        if (!(await canJoinEvent(userId, eventUuid))) return;

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

    socket.on("disconnect", () => {
      console.log("Utilisateur déconnecté :", socket.id);

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

export const removeFromEventRoom = (userId: number, eventUuid: string) => {
  const socketIds = getSocketIds(userId);
  if (!io || socketIds.length === 0) return;

  io.in(socketIds).socketsLeave(`event-${eventUuid}`);
};
