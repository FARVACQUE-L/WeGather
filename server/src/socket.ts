import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { decodeJWT } from "./helper/jwtHelper";
import { addSocket, getStatus, removeSocket } from "./presence";

let io: SocketServer | null = null;

// Applique l'ajout ou le retrait d'un socket, et signale le changement de
// statut s'il y en a un (premier onglet ouvert, dernier onglet fermé). Signal
// sans données : les clients rechargent la liste des membres par l'API, qui
// ne renvoie que les membres de leurs propres événements.
const updatePresence = (userId: number, update: () => void): void => {
  const previousStatus = getStatus(userId);
  update();

  if (getStatus(userId) !== previousStatus) {
    io?.emit("presence-changed");
  }
};

// Le socket s'identifie par le cookie de session, envoyé avec la poignée de
// main. Sans cookie valide (visiteur non connecté), il n'est pas suivi.
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

    socket.on("join-event", (eventUuid: string) => {
      socket.join(`event-${eventUuid}`);
      console.log(`${socket.id} a rejoint event-${eventUuid}`);
    });

    socket.on("leave-event", (eventUuid: string) => {
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
